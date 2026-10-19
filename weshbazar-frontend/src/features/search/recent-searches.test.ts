import { readRecentSearches, saveRecentSearch } from './recent-searches';

describe('recent-searches (localStorage)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts empty', () => {
    expect(readRecentSearches()).toEqual([]);
  });

  it('stores, dedupes, and moves the most-recent query to the front', () => {
    saveRecentSearch('تویوتا');
    saveRecentSearch('اپل');
    saveRecentSearch('تویوتا');
    expect(readRecentSearches()).toEqual(['تویوتا', 'اپل']);
  });

  it('ignores blank queries', () => {
    saveRecentSearch('   ');
    expect(readRecentSearches()).toEqual([]);
  });

  it('caps history at 10 items', () => {
    for (let i = 0; i < 15; i += 1) saveRecentSearch(`جستجو ${i}`);
    expect(readRecentSearches()).toHaveLength(10);
    expect(readRecentSearches()[0]).toBe('جستجو 14');
    expect(readRecentSearches()[9]).toBe('جستجو 5');
  });

  it('tolerates corrupt storage', () => {
    window.localStorage.setItem('weshbazar.recent-searches', '{not-json');
    expect(readRecentSearches()).toEqual([]);
  });
});