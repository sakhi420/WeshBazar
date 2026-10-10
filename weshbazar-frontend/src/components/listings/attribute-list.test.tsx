/**
 * Behavior test for AttributeList rendering (master prompt §123).
 *
 * The list must omit rows whose formatted value is empty — never render an
 * empty <dd> — and must still render boolean-false values as «نخیر» so
 * sellers cannot hide negated attributes with false.
 */

import { render, screen } from '@testing-library/react';
import { AttributeList } from './attribute-list';
import type { PublicAttribute } from '@/features/listings';

const attr = (
  key: string,
  label: string,
  value: PublicAttribute['value'],
  type: string | null = 'TEXT',
): PublicAttribute => ({ key, label, type, value });

describe('AttributeList', () => {
  it('renders every non-empty row', () => {
    render(
      <AttributeList
        attributes={[
          attr('brand', 'برند', 'toyota'),
          attr('year', 'سال', 2020),
          attr('has_warranty', 'گارانتی', true),
          attr('is_original', 'اصیل', false),
        ]}
      />,
    );
    expect(screen.getByText('برند')).toBeInTheDocument();
    expect(screen.getByText('toyota')).toBeInTheDocument();
    expect(screen.getByText('گارانتی')).toBeInTheDocument();
    expect(screen.getByText('بله')).toBeInTheDocument();
    expect(screen.getByText('نخیر')).toBeInTheDocument();
  });

  it('omits rows whose formatted value would be empty', () => {
    const { container } = render(
      <AttributeList
        attributes={[
          attr('empty_string', 'Empty', ''),
          attr('null_value', 'Null', null as unknown as string),
          attr('ok', 'OK', 'visible'),
        ]}
      />,
    );
    expect(screen.queryByText('Empty')).not.toBeInTheDocument();
    expect(screen.queryByText('Null')).not.toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('visible')).toBeInTheDocument();
    // Of the three inputs, the empty-string and null rows are omitted,
    // so only a single dt row («OK») remains.
    expect(container.querySelectorAll('dt')).toHaveLength(1);
  });

  it('returns null when no row is displayable', () => {
    const { container } = render(
      <AttributeList attributes={[attr('nothing', 'Nothing', '')]} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
