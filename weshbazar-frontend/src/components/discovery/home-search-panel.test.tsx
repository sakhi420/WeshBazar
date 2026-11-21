import { render, screen } from '@testing-library/react';

jest.mock('@/features/search/components/search-field', () => ({
  SearchField: () => <div data-testid="search-field" />,
}));
jest.mock('@/components/location/location-picker', () => ({
  LocationPicker: () => <div data-testid="location-picker" />,
}));

import { HomeSearchPanel } from './home-search-panel';

describe('HomeSearchPanel', () => {
  it('keeps the compact keyword search and city picker together in a responsive row', () => {
    const { container } = render(<HomeSearchPanel />);

    expect(screen.getByRole('heading', { name: 'هر چی می‌خواهی، از همین‌جا پیدا کن' })).toBeInTheDocument();
    expect(screen.getByTestId('search-field')).toBeInTheDocument();
    expect(screen.getByTestId('location-picker')).toBeInTheDocument();

    const controls = screen.getByTestId('search-field').parentElement;
    expect(controls).toHaveClass('grid');
    expect(controls).toHaveClass('gap-2');
    expect(controls).toHaveClass('sm:grid-cols-[minmax(0,1fr)_auto]');
    expect(container).toBeTruthy();
  });
});
