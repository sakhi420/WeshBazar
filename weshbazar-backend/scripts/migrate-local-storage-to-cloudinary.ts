/**
 * Copy local WeshBazar media to Cloudinary without deleting local originals.
 *
 * Run from weshbazar-backend:
 *   npm run media:migrate:cloudinary -- --dry-run
 *   npm run media:migrate:cloudinary
 *
 * Re-running is safe: stable storage keys map to stable Cloudinary public IDs.
 */
import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  CloudinaryStorageProvider,
  type CloudinaryStorageConfig,
} from '../apps/api/src/providers/storage/cloudinary-storage.provider';

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
      if (!MIME_TYPES[extension]) {
        throw new Error('Unsupported file in local media directory: ' + absolutePath);
      }
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
  // The API workspace runs with apps/api as its working directory.
  // This script is invoked from the backend repository root.
  const storageRoot = path.isAbsolute(rawStoragePath)
    ? rawStoragePath
    : path.resolve(process.cwd(), 'apps/api', rawStoragePath);
  const dryRun = process.argv.includes('--dry-run');

  const files = await collectFiles(storageRoot);
  const totalBytes = (await Promise.all(files.map(async (file) => {
    const data = await readFile(file.absolutePath);
    return data.byteLength;
  }))).reduce((sum, size) => sum + size, 0);

  console.log('Found ' + files.length + ' image files (' + (totalBytes / 1024 / 1024).toFixed(2) + ' MiB).');
  console.log('Source: ' + storageRoot);
  console.log('Local source files will not be deleted.');

  if (dryRun) {
    console.log('Dry run only; no files were uploaded.');
    return;
  }

  const config: CloudinaryStorageConfig = {
    cloudName: requiredEnv('CLOUDINARY_CLOUD_NAME'),
    apiKey: requiredEnv('CLOUDINARY_API_KEY'),
    apiSecret: requiredEnv('CLOUDINARY_API_SECRET'),
  };
  const storage = new CloudinaryStorageProvider(config);
  const failures: string[] = [];
  let uploaded = 0;

  for (let offset = 0; offset < files.length; offset += 3) {
    const batch = files.slice(offset, offset + 3);
    await Promise.all(batch.map(async (file) => {
      try {
        const data = await readFile(file.absolutePath);
        const contentType = MIME_TYPES[path.extname(file.absolutePath).toLowerCase()];
        await storage.put(file.key, data, contentType);
        uploaded += 1;
      } catch (error) {
        failures.push(file.key + ': ' + (error instanceof Error ? error.message : String(error)));
      }
    }));
    console.log('Uploaded ' + uploaded + '/' + files.length + ' files.');
  }

  if (failures.length > 0) {
    console.error('Migration finished with ' + failures.length + ' failed file(s):');
    for (const failure of failures) console.error('- ' + failure);
    throw new Error('Cloudinary media migration is incomplete; keep local files and retry.');
  }

  console.log('✔ Uploaded ' + uploaded + ' files to Cloudinary. Local files were preserved.');
}

main().catch((error: unknown) => {
  console.error('✖ Cloudinary media migration failed:', error);
  process.exitCode = 1;
});
