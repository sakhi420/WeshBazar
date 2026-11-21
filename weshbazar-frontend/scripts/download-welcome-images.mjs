import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(projectRoot, 'public', 'images', 'welcome');
const timeoutMs = 30_000;
const minimumBytes = 10_000;
const allowMissing = process.argv.includes('--allow-missing');

/**
 * Pexels permits free use of these photos on websites and apps.
 * They are fetched during the build and served from this project's /public
 * directory at runtime. Keep the URLs and output names stable so the page's
 * photo choices, crop, and composition do not drift.
 */
const images = [
  {
    file: 'hero-mobile.jpg',
    url: 'https://images.pexels.com/photos/34271392/pexels-photo-34271392/free-photo-of-charming-shopkeeper-in-middle-eastern-bazaar.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    file: 'hero-wide.jpg',
    url: 'https://images.pexels.com/photos/37863204/pexels-photo-37863204/free-photo-of-bustling-small-shop-with-assorted-products.jpeg?auto=compress&cs=tinysrgb&w=2200',
  },
  {
    file: 'seller.jpg',
    url: 'https://images.pexels.com/photos/37115597/pexels-photo-37115597/free-photo-of-local-shopkeeper-in-a-busy-marketplace.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    file: 'vehicles.jpg',
    url: 'https://images.pexels.com/photos/40895082/pexels-photo-40895082/free-photo-of-car-dealership-consultation-with-customers-in-showroom.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    file: 'real-estate.jpg',
    url: 'https://images.pexels.com/photos/7587880/pexels-photo-7587880.jpeg?auto=compress&cs=tinysrgb&w=1000',
  },
  {
    file: 'electronics.jpg',
    url: 'https://images.pexels.com/photos/20259184/pexels-photo-20259184/free-photo-of-display-of-electronics.jpeg?auto=compress&cs=tinysrgb&w=1000',
  },
  {
    file: 'home.jpg',
    url: 'https://images.pexels.com/photos/7511701/pexels-photo-7511701.jpeg?auto=compress&cs=tinysrgb&w=1000',
  },
  {
    file: 'fashion.jpg',
    url: 'https://images.pexels.com/photos/5490963/pexels-photo-5490963.jpeg?auto=compress&cs=tinysrgb&w=1000',
  },
];

async function isUsableImage(filePath) {
  try {
    const existing = await readFile(filePath);
    return (
      existing.length >= minimumBytes &&
      existing[0] === 0xff &&
      existing[1] === 0xd8 &&
      existing[2] === 0xff
    );
  } catch {
    return false;
  }
}

async function downloadImage({ file, url }) {
  const destination = path.join(outputDirectory, file);

  if (await isUsableImage(destination)) {
    return { file, status: 'cached' };
  }

  const temporary = destination + '.download';
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: 'image/jpeg,image/*;q=0.9,*/*;q=0.1' },
  });

  if (!response.ok) {
    throw new Error(file + ': Pexels returned HTTP ' + response.status);
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.startsWith('image/jpeg') && !contentType.startsWith('image/jpg')) {
    throw new Error(file + ': expected JPEG, received ' + (contentType || 'unknown content type'));
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (
    bytes.length < minimumBytes ||
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8 ||
    bytes[2] !== 0xff
  ) {
    throw new Error(file + ': downloaded response is not a valid JPEG image');
  }

  await writeFile(temporary, bytes);
  await rename(temporary, destination);

  return { file, status: 'downloaded', bytes: bytes.length };
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });

  const results = await Promise.all(images.map(downloadImage));
  for (const result of results) {
    const detail = result.bytes ? ' (' + Math.round(result.bytes / 1024) + ' KB)' : '';
    process.stdout.write('[welcome-images] ' + result.status + ': ' + result.file + detail + '\n');
  }

  process.stdout.write('[welcome-images] ' + images.length + ' local image assets ready.\n');
}

main().catch((error) => {
  process.stderr.write(
    '[welcome-images] Failed to prepare local assets: ' +
      (error instanceof Error ? error.message : String(error)) +
      '\n',
  );
  process.stderr.write(
    '[welcome-images] The page was left unchanged. Check build network access to images.pexels.com and retry.\n',
  );
  if (!allowMissing) {
    process.exitCode = 1;
  } else {
    process.stderr.write('[welcome-images] Continuing development without missing local images.\n');
  }
});
