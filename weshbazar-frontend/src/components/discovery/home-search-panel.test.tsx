import { render, screen } from '@testing-library/react';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => <img src={src} alt={alt} />,
}));

jest.mock('@/features/search/components/search-field', () => ({
  SearchField: () => <form data-testid="search-field" />,
}));
jest.mock('@/components/location/location-picker', () => ({
  LocationPicker: () => <button type="button" data-testid="location-picker">انتخاب شهر</button>,
}));

import { HomeSearchPanel } from './home-search-panel';

describe('HomeSearchPanel', () => {
  it('places the hero content and responsive search controls over one optimized Kabul background image', () => {
    const { container } = render(<HomeSearchPanel />);

    expect(screen.getByRole('heading', { name: 'هر چی می‌خواهی، از همین‌جا پیدا کن' })).toBeInTheDocument();

    const background = container.querySelector('img[alt=""]');
    expect(background).toBeInTheDocument();
    expect(background?.getAttribute('src')).toContain('images.pexels.com/photos/38407564');
    expect(container.querySelectorAll('img')).toHaveLength(1);

    const search = screen.getByTestId('search-field');
    const location = screen.getByTestId('location-picker');
    expect(search).toBeInTheDocument();
    expect(location).toBeInTheDocument();

    const controls = search.parentElement;
    expect(controls).toHaveClass('grid');
    expect(controls).toHaveClass('grid-cols-1');
    expect(controls).toHaveClass('sm:grid-cols-[minmax(0,1fr)_12rem]');
    expect(search.compareDocumentPosition(location) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
