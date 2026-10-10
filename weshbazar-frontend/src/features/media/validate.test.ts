/**
 * Media selection pre-check tests (§35): format, size, capacity order.
 */

import { MAX_IMAGES_PER_LISTING, MAX_UPLOAD_SIZE_BYTES } from './limits';
import { validateImageSelection } from './validate';

function imageFile(name: string, type: string, size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('validateImageSelection', () => {
  it('accepts JPEG/PNG/WebP within size and capacity', () => {
    const files = [
      imageFile('a.jpg', 'image/jpeg'),
      imageFile('b.png', 'image/png'),
      imageFile('c.webp', 'image/webp'),
    ];
    const { accepted, rejected } = validateImageSelection(files, 0);
    expect(accepted).toHaveLength(3);
    expect(rejected).toHaveLength(0);
  });

  it('rejects unsupported formats with a Persian reason', () => {
    const { accepted, rejected } = validateImageSelection(
      [imageFile('doc.pdf', 'application/pdf'), imageFile('anim.gif', 'image/gif')],
      0,
    );
    expect(accepted).toHaveLength(0);
    expect(rejected).toHaveLength(2);
    expect(rejected[0]?.message).toContain('JPEG');
  });

  it('rejects images over the 5 MiB limit', () => {
    const big = imageFile('big.jpg', 'image/jpeg', MAX_UPLOAD_SIZE_BYTES + 1);
    const { accepted, rejected } = validateImageSelection([big], 0);
    expect(accepted).toHaveLength(0);
    expect(rejected[0]?.message).toContain('۵ مگابایت');
  });

  it('enforces the remaining gallery capacity', () => {
    const files = [imageFile('a.jpg', 'image/jpeg'), imageFile('b.jpg', 'image/jpeg')];
    const { accepted, rejected } = validateImageSelection(files, MAX_IMAGES_PER_LISTING - 1);
    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.message).toContain('۱۰ تصویر');
  });

  it('keeps the first files when capacity is zero', () => {
    const { accepted, rejected } = validateImageSelection(
      [imageFile('a.jpg', 'image/jpeg')],
      MAX_IMAGES_PER_LISTING,
    );
    expect(accepted).toHaveLength(0);
    expect(rejected).toHaveLength(1);
  });
});
