import { orderHomeCategories } from './ordering';
import type { CategorySummary } from './types';

function cat(slug: string, parentId: string | null = null, sortOrder = 0): CategorySummary {
  return {
    id: `id-${slug}`,
    slug,
    name: slug,
    iconKey: null,
    parentId,
    sortOrder,
    hasChildren: false,
  };
}

describe('orderHomeCategories', () => {
  it('pins Afghanistan priority verticals and drops child nodes', () => {
    const input: CategorySummary[] = [
      cat('vehicles'),
      cat('cars', 'id-vehicles'), // child — must be excluded
      cat('animals-agriculture'),
      cat('mobiles-electronics'),
      cat('real-estate'),
      cat('jobs-services'),
      cat('home-furniture'),
    ];

    expect(orderHomeCategories(input).map((c) => c.slug)).toEqual([
      'vehicles',
      'mobiles-electronics',
      'real-estate',
      'jobs-services',
      'home-furniture',
      'animals-agriculture',
    ]);
  });

  it('appends unknown slugs after pinned ones in stable received order', () => {
    const input: CategorySummary[] = [
      cat('unknown-a'),
      cat('vehicles'),
      cat('unknown-b'),
    ];

    expect(orderHomeCategories(input).map((c) => c.slug)).toEqual([
      'vehicles',
      'unknown-a',
      'unknown-b',
    ]);
  });
});