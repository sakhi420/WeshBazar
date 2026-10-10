import Image from 'next/image';
import { brandAssets, logoDimensions } from '@/config/brand';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  /** Use the white monochrome variant on dark surfaces (§9). */
  variant?: 'color' | 'white';
  className?: string;
  /** Rendered height in px; width is derived from the asset aspect ratio. */
  height?: number;
  priority?: boolean;
}

/**
 * Official WeshBazar wordmark. Renders the real vector asset — never a CSS
 * approximation or redraw (§9). SVG is loaded unoptimized to preserve vectors.
 */
export function BrandLogo({
  variant = 'color',
  className,
  height = 32,
  priority = false,
}: BrandLogoProps) {
  const src = variant === 'white' ? brandAssets.logoWhite : brandAssets.logo;
  const width = Math.round((logoDimensions.width / logoDimensions.height) * height);

  return (
    <Image
      src={src}
      alt={siteConfig.name}
      width={width}
      height={height}
      priority={priority}
      unoptimized
      className={cn('h-auto w-auto select-none', className)}
      style={{ height }}
    />
  );
}
