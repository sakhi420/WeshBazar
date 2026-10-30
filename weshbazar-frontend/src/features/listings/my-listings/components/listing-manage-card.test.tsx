/**
 * UI tests for listing-manage-card.tsx (§31 owner lifecycle actions).
 *
 * Locks the retention disclosure on the archive confirmation: once a gallery is
 * archived, images are deleted after the retention window and republishing
 * requires re-uploading them — the user must not be told images are preserved.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';

jest.mock('next/link', () => {
  return function MockLink({
    href,
    children,
    ...rest
  }: {
    href: string;
    children?: ReactNode;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: { alt?: string }) {
    return <span data-testid="next-image">{props.alt ?? ''}</span>;
  },
}));

import { ListingManageCard } from './listing-manage-card';
import type { OwnerListingSummary } from '../../types';
import type { ListingLifecyclePermissions } from '../view-model';
import type { ListingLifecycleAction } from '../hooks';

const ACTION_ALL: ListingLifecyclePermissions = {
  canEdit: true,
  canRenew: true,
  canMarkSold: true,
  canArchive: true,
  canViewPublic: true,
};

const ARCHIVED_PERMS: ListingLifecyclePermissions = {
  canEdit: false,
  canRenew: true,
  canMarkSold: false,
  canArchive: false,
  canViewPublic: false,
};

function makeListing(overrides: Partial<OwnerListingSummary> = {}): OwnerListingSummary {
  return {
    id: 'l-1',
    slug: 'toyota-corolla',
    status: 'ACTIVE',
    version: 1,
    title: 'تویوتا کرولا',
    price: 450000,
    currency: 'AFN',
    pricingType: 'PAID',
    condition: 'LIKE_NEW',
    category: { id: 'c-1', slug: 'vehicles', name: 'موتر و وسایط نقلیه' },
    primaryImage: null,
    views: 12,
    favoriteCount: 3,
    expiresAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderCard(
  overrides: Partial<OwnerListingSummary> = {},
  permissions: ListingLifecyclePermissions = ACTION_ALL,
  opts: { pendingAction?: ListingLifecycleAction | null; locked?: boolean; onAction?: jest.Mock } = {},
) {
  const onAction = opts.onAction ?? jest.fn();
  const view = render(
    <ListingManageCard
      listing={makeListing(overrides)}
      permissions={permissions}
      pendingAction={opts.pendingAction ?? null}
      locked={opts.locked ?? false}
      onAction={onAction}
    />,
  );
  return { ...view, onAction };
}

describe('ListingManageCard', () => {
  it('renders title, status, price and every ACTIVE action without forcing LTR', () => {
    const { container } = renderCard();
    expect(screen.getByText('تویوتا کرولا')).toBeInTheDocument();
    expect(screen.getByText('فعال')).toBeInTheDocument();
    expect(screen.getByText('موتر و وسایط نقلیه')).toBeInTheDocument();
    expect(screen.getByText(/افغانی/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'تمدید' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'بایگانی' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'فروخته شد' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ویرایش' })).toHaveAttribute('href', '/sell/l-1/edit');
    expect(screen.getByRole('link', { name: 'مشاهده' })).toHaveAttribute('href', '/listing/toyota-corolla');
    expect(container.querySelector('article')).not.toHaveAttribute('dir', 'ltr');
  });

  it('archive confirmation discloses image deletion after retention and re-upload', () => {
    const view = renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'بایگانی' }));
    expect(screen.getByText(/پس از پایان مهلت نگهداری حذف/)).toBeInTheDocument();
    expect(screen.getByText(/برای انتشار دوباره باید دوباره بارگذاری شوند/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'تأیید' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'انصراف' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'تأیید' }));
    expect(view.onAction).toHaveBeenCalledWith('archive');
  });

  it('mark-sold confirmation stays focused and never mentions image retention', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'فروخته شد' }));
    expect(screen.getByText(/این کار قابل برگشت نیست/)).toBeInTheDocument();
    expect(screen.queryByText(/نگهداری حذف/)).not.toBeInTheDocument();
  });

  it('ARCHIVED card republishes through renew and does not promise images are kept', () => {
    const view = renderCard({ status: 'ARCHIVED' }, ARCHIVED_PERMS);
    expect(screen.getByRole('button', { name: 'انتشار دوباره' })).toBeInTheDocument();
    expect(screen.getByText(/آن را بازنشر کنید/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'بایگانی' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'فروخته شد' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'ویرایش' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'انتشار دوباره' }));
    expect(view.onAction).toHaveBeenCalledWith('renew');
  });

  it('shows the expired countdown for an ACTIVE listing whose runway elapsed', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    renderCard({ expiresAt: past });
    expect(screen.getByText('منقضی شده')).toBeInTheDocument();
  });

  it('flags aria-busy and disables controls while an action is pending', () => {
    renderCard({}, ACTION_ALL, { pendingAction: 'renew', locked: true });
    expect(screen.getByRole('article')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'تمدید' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'بایگانی' })).toBeDisabled();
  });

  it('renders the thumbnail through next/image when a primary image exists', () => {
    renderCard({
      primaryImage: {
        id: 'img-1',
        url: 'https://cdn.example.com/listing/l-1/img-1.jpg',
        variants: {
          thumbnail: { url: 'https://cdn.example.com/listing/l-1/img-1-thumb.jpg', width: 96, height: 96 },
        },
        width: 800,
        height: 600,
        isPrimary: true,
        sortOrder: 0,
      },
    });
    expect(screen.getByTestId('next-image')).toBeInTheDocument();
  });
});