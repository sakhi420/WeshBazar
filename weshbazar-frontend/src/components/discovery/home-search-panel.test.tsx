import { render, screen } from '@testing-library/react';

jest.mock('@/features/search/components/search-field', () => ({
  SearchField: () => <form data-testid="search-field" />,
}));
jest.mock('@/components/location/location-picker', () => ({
  LocationPicker: () => <button type="button" data-testid="location-picker">انتخاب شهر</button>,
}));

import { HomeSearchPanel } from './home-search-panel';

describe('HomeSearchPanel', () => {
  it('places both usable search controls before the decorative photo collage', () => {
    const { container } = render(<HomeSearchPanel />);

    expect(screen.getByRole('heading', { name: 'هر چی می‌خواهی، از همین‌جا پیدا کن' })).toBeInTheDocument();

    const search = screen.getByTestId('search-field');
    const location = screen.getByTestId('location-picker');
    expect(search).toBeInTheDocument();
    expect(location).toBeInTheDocument();

    const controls = search.parentElement;
    expect(controls).toHaveClass('grid');
    expect(controls).toHaveClass('grid-cols-1');
    expect(controls).toHaveClass('sm:grid-cols-[minmax(0,1fr)_9.5rem]');
    expect(search.compareDocumentPosition(location) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const image = container.querySelector('img[alt="موتر برای خرید و فروش"]');
    expect(image).toBeInTheDocument();
    expect(location.compareDocumentPosition(image as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
