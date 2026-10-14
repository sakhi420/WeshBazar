/**
 * SearchField — redirect vs. inline URL behavior (HF-TEST-001, HF-NAV-003).
 *
 * The header passes `redirectToSearch`; the home/search surfaces do not. The
 * component must navigate to /search when told, except on /search itself where
 * it should just update `q` and keep the other filters.
 */

import { render, screen, fireEvent } from '@testing-library/react';

const setQuery = jest.fn();
const routerPush = jest.fn();
let mockPathname = '/';

jest.mock('nuqs', () => {
  // nuqs is ESM-only, so `jest.requireActual('nuqs')` throws. Provide minimal
  // parser stubs: `discoveryParamsParsers` only needs `parseAs*` builders and
  // `useQueryState` needs to return [value, setter].
  const parser: { withOptions: () => unknown } = { withOptions: () => parser };
  return {
    useQueryState: jest.fn(() => [null, setQuery]),
    parseAsString: parser,
    parseAsFloat: parser,
    parseAsStringLiteral: () => parser,
    parseAsArrayOf: () => parser,
  };
});
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
  usePathname: () => mockPathname,
}));

import { SearchField } from './search-field';

function submit(query: string) {
  if (query) fireEvent.change(screen.getByRole('searchbox'), { target: { value: query } });
  fireEvent.submit(screen.getByRole('search'));
}

describe('SearchField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/';
  });

  it('without redirect → writes q to the current URL', () => {
    render(<SearchField />);
    submit('کتاب');
    expect(setQuery).toHaveBeenCalledWith('کتاب');
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('redirect variant on /search → keeps filters, updates q', () => {
    mockPathname = '/search';
    render(<SearchField redirectToSearch />);
    submit('کتاب');
    expect(setQuery).toHaveBeenCalledWith('کتاب');
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('redirect variant elsewhere → navigates to /search?q=…', () => {
    mockPathname = '/account';
    render(<SearchField redirectToSearch />);
    submit('کتاب');
    expect(routerPush).toHaveBeenCalledWith(`/search?q=${encodeURIComponent('کتاب')}`);
    expect(setQuery).not.toHaveBeenCalled();
  });

  it('redirect variant with empty input → navigates to /search', () => {
    mockPathname = '/account';
    render(<SearchField redirectToSearch />);
    submit('');
    expect(routerPush).toHaveBeenCalledWith('/search');
  });
});