import 'dotenv/config';
import { access, readdir, readFile } from 'node:fs/promises';
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

function writeOutput(message: string): void {
  process.stdout.write(message + '\n');
}

function writeError(message: string): void {
  process.stderr.write(message + '\n');
}

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
  const candidates = path.isAbsolute(rawStoragePath)
    ? [rawStoragePath]
    : [
        path.resolve(process.cwd(), 'apps/api', rawStoragePath),
        path.resolve(process.cwd(), rawStoragePath),
      ];
  const matches: Array<{ root: string; files: LocalFile[] }> = [];
  for (const candidate of [...new Set(candidates)]) {
    try {
      try {
        await access(path.join(candidate, '.seed-in-progress'));
        throw new Error('Exhibition seeding is still in progress for this directory. Wait for the seed process to finish.');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
      const files = await collectFiles(candidate);
      if (files.length > 0) matches.push({ root: candidate, files });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  if (matches.length === 0) {
    throw new Error(
      'No media files were found. Checked: ' + candidates.join(', ') +
      '. Confirm LOCAL_STORAGE_PATH before retrying.',
    );
  }
  if (matches.length > 1) {
    throw new Error(
      'Media files exist in more than one candidate directory. Set LOCAL_STORAGE_PATH to an absolute path to select the correct source: ' +
      matches.map((match) => match.root).join(', '),
    );
  }

  const storageRoot = matches[0].root;
  const files = matches[0].files;
  const dryRun = process.argv.includes('--dry-run');

  let totalBytes = 0;
  for (const file of files) totalBytes += (await readFile(file.absolutePath)).byteLength;

  writeOutput('Found ' + files.length + ' files (' + (totalBytes / 1024 / 1024).toFixed(2) + ' MiB).');
  writeOutput('Source: ' + storageRoot);
  writeOutput('Local files will not be deleted.');

  if (dryRun) {
    writeOutput('Dry run only; no uploads were made.');
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
    writeOutput('Uploaded ' + uploaded + '/' + files.length + ' files.');
  }

  if (failures.length > 0) {
    for (const failure of failures) writeError('- ' + failure);
    throw new Error('Migration incomplete. Keep local files and retry.');
  }
  writeOutput('✔ Uploaded ' + uploaded + ' files. Local originals were preserved.');
}

main().catch((error: unknown) => {
  const details = error instanceof Error ? error.stack ?? error.message : String(error);
  writeError('✖ Neon Object Storage migration failed: ' + details);
  process.exitCode = 1;
});
