/**
 * Auth page card — shared shell for §25–29: H1, optional description, the
 * form slot, and footer links. Presentational only; every auth page stays a
 * Server Component and composes this around one narrow client form.
 */

import type { ReactNode } from 'react';

export interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Secondary actions below the card (e.g. "no account yet?"). */
  footer?: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-card border border-border bg-surface p-5 shadow-sm sm:p-6">
        <h1 className="text-heading font-semibold text-foreground">{title}</h1>
        {description ? (
          <p className="mt-2 text-ui leading-6 text-muted-foreground">{description}</p>
        ) : null}
        <div className="mt-6">{children}</div>
      </div>
      {footer ? (
        <div className="mt-4 space-y-2 text-center text-ui text-muted-foreground">{footer}</div>
      ) : null}
    </div>
  );
}
