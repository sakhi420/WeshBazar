import { render, screen } from '@testing-library/react';

jest.mock('@/features/search/components/search-field', () => ({
  SearchField: () => <div data-testid="search-field" />,
}));
jest.mock('@/components/location/location-picker', () => ({
  LocationPicker: () => <div data-testid="location-picker" />,
}));

import { HomeSearchPanel } from './home-search-panel';

describe('HomeSearchPanel', () => {
  it('stacks keyword search above the city control below the lg breakpoint', () => {
    const { container } = render(<HomeSearchPanel />);

    expect(screen.getByRole('heading', { name: 'بازار خرید و فروش در افغانستان' })).toBeInTheDocument();
    expect(screen.getByTestId('search-field')).toBeInTheDocument();
    expect(screen.getByTestId('location-picker')).toBeInTheDocument();

    const row = screen.getByTestId('search-field').parentElement;
    expect(row).toHaveClass('flex-col');
    expect(row).toHaveClass('lg:flex-row');
    expect(row?.className ?? '').not.toMatch(/\bmd:flex-row\b/);
    expect(container).toBeTruthy();
  });
});
