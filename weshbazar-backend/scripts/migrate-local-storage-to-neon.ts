import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  NeonObjectStorageProvider,
  type NeonObjectStorageConfig,
} from '../apps/api/src/providers/storage/neon-object-storage.provider';

interface LocalFile {
  absolutePath: string;
  key: string;
}

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

async function collectFiles(root: string, current = root): Promise<LocalFile[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const files: LocalFile[] = [];
  for (const entry of entries) {
    const absolutePath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(root, absolutePath));
    } else if (entry.isFile()) {
      const extension = path.extname(entry.name).toLowerCase();
      if (!MIME_TYPES[extension]) throw new Error('Unsupported media file: ' + absolutePath);
      files.push({
        absolutePath,
        key: path.relative(root, absolutePath).split(path.sep).join('/'),
      });
    }
  }
  return files.sort((left, right) => left.key.localeCompare(right.key));
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(name + ' is required.');
  return value;
}

async function main(): Promise<void> {
  const rawStoragePath = process.env.LOCAL_STORAGE_PATH?.trim() || './var/storage';
  const storageRoot = path.isAbsolute(rawStoragePath)
    ? rawStoragePath
    : path.resolve(process.cwd(), 'apps/api', rawStoragePath);
  const dryRun = process.argv.includes('--dry-run');
  const files = await collectFiles(storageRoot);

  let totalBytes = 0;
  for (const file of files) totalBytes += (await readFile(file.absolutePath)).byteLength;

  console.log('Found ' + files.length + ' files (' + (totalBytes / 1024 / 1024).toFixed(2) + ' MiB).');
  console.log('Source: ' + storageRoot);
  console.log('Local files will not be deleted.');

  if (dryRun) {
    console.log('Dry run only; no uploads were made.');
    return;
  }

  const config: NeonObjectStorageConfig = {
    endpoint: requiredEnv('NEON_STORAGE_ENDPOINT'),
    bucket: requiredEnv('NEON_STORAGE_BUCKET'),
    region: process.env.NEON_STORAGE_REGION?.trim() || 'us-east-2',
    accessKeyId: requiredEnv('NEON_STORAGE_ACCESS_KEY_ID'),
    secretAccessKey: requiredEnv('NEON_STORAGE_SECRET_ACCESS_KEY'),
  };
  const storage = new NeonObjectStorageProvider(config);
  const failures: string[] = [];
  let uploaded = 0;

  for (let offset = 0; offset < files.length; offset += 3) {
    const batch = files.slice(offset, offset + 3);
    await Promise.all(batch.map(async (file) => {
      try {
        const data = await readFile(file.absolutePath);
        await storage.put(
          file.key,
          data,
          MIME_TYPES[path.extname(file.absolutePath).toLowerCase()],
        );
        uploaded += 1;
      } catch (error) {
        failures.push(file.key + ': ' + (error instanceof Error ? error.message : String(error)));
      }
    }));
    console.log('Uploaded ' + uploaded + '/' + files.length + ' files.');
  }

  if (failures.length > 0) {
    for (const failure of failures) console.error('- ' + failure);
    throw new Error('Migration incomplete. Keep local files and retry.');
  }
  console.log('✔ Uploaded ' + uploaded + ' files. Local originals were preserved.');
}

main().catch((error: unknown) => {
  console.error('✖ Neon Object Storage migration failed:', error);
  process.exitCode = 1;
});
