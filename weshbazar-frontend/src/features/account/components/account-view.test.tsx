import { fireEvent, render, screen } from '@testing-library/react';
import { AccountView } from './account-view';

const mockMutate = jest.fn();
const mockReplace = jest.fn();

const mockProfile = {
  id: 'user-1',
  phone: '+93700000000',
  displayName: 'احمد',
  role: 'USER',
  status: 'ACTIVE',
  phoneVerified: true,
  createdAt: '2025-03-01T00:00:00.000Z',
  avatarUrl: null,
  seller: {
    id: 'seller-1',
    type: 'INDIVIDUAL',
    displayName: 'فروشگاه احمد',
    slug: 'ahmad-store',
    bio: 'لوازم خانه و موبایل',
    status: 'ACTIVE',
    createdAt: '2025-03-01T00:00:00.000Z',
    updatedAt: '2025-03-01T00:00:00.000Z',
  },
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('next/link', () => {
  return function MockLink({
    href,
    children,
    ...rest
  }: {
    href: string;
    children?: React.ReactNode;
    [key: string]: unknown;
  }) {
    return <a href={href} {...rest}>{children}</a>;
  };
});

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: mockProfile, isPending: false, isError: false }),
}));

jest.mock('@/features/auth', () => ({
  useAuthBootstrap: () => ({ status: 'ready', retry: jest.fn() }),
  toPersianDigits: (value: number | string) => String(value),
}));

jest.mock('@/features/auth/components', () => ({
  INPUT_CLASS: 'mock-input',
}));

jest.mock('@/features/listings', () => ({
  formatMonthYear: () => 'حمل ۱۴۰۴',
}));

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ name }: { name: string }) => <span data-testid="avatar">{name}</span>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    type = 'button',
    ...rest
  }: {
    children?: React.ReactNode;
    type?: 'button' | 'submit' | 'reset';
    [key: string]: unknown;
  }) => <button type={type} {...rest}>{children}</button>,
}));

jest.mock('@/components/feedback/error-state', () => ({
  ErrorState: () => <div>خطا</div>,
}));

jest.mock('./profile-photo-controls', () => ({
  ProfilePhotoControls: () => <div>کنترل عکس</div>,
}));

jest.mock('../hooks', () => ({
  useUpdateProfile: () => ({ isPending: false, mutate: mockMutate }),
  useLogout: () => ({ isPending: false, mutate: jest.fn() }),
}));

describe('AccountView dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows account identity, primary actions, seller profile and support links', () => {
    render(<AccountView />);

    expect(screen.getByRole('heading', { name: 'حساب من' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'فعالیت‌های من' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /آگهی‌های من/ })).toHaveAttribute('href', '/my-listings');
    expect(screen.getByRole('link', { name: /علاقه‌مندی‌ها/ })).toHaveAttribute('href', '/favorites');
    expect(screen.getByRole('heading', { name: 'پروفایل فروشندگی' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /مشاهده صفحهٔ عمومی/ })).toHaveAttribute(
      'href',
      '/seller/ahmad-store',
    );
    expect(screen.getByRole('link', { name: /امنیت حساب/ })).toHaveAttribute(
      'href',
      '/account/security',
    );
    expect(screen.getByRole('link', { name: /راهنما و پشتیبانی/ })).toHaveAttribute(
      'href',
      '/contact',
    );
  });

  it('saves seller display name and bio through the existing profile mutation', () => {
    render(<AccountView />);

    fireEvent.click(screen.getByRole('button', { name: 'ویرایش' }));
    fireEvent.change(screen.getByLabelText('نام نمایشی فروشنده'), {
      target: { value: 'فروشگاه نو' },
    });
    fireEvent.change(screen.getByLabelText('معرفی کوتاه'), {
      target: { value: 'لوازم دیجیتال و خانه' },
    });
    fireEvent.submit(screen.getByLabelText('نام نمایشی فروشنده').closest('form')!);

    expect(mockMutate).toHaveBeenCalledWith(
      { seller: { displayName: 'فروشگاه نو', bio: 'لوازم دیجیتال و خانه' } },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
  });

  it('keeps staff-only routes out of this customer dashboard', () => {
    render(<AccountView />);
    expect(screen.queryByRole('link', { name: /پنل مدیریت/ })).not.toBeInTheDocument();
  });
});
