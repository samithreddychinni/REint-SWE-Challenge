export function formatMw(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }
  return `${Math.round(value).toLocaleString('en-US')} MW`;
}

export function formatSignedMw(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }
  const rounded = Math.round(value);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toLocaleString('en-US')} MW`;
}

export function formatShortTimestamp(iso: string): string {
  if (!iso || iso.length < 16) return iso;
  const monthDay = iso.slice(5, 10);
  const time = iso.slice(11, 16);
  return `${monthDay} ${time}`;
}

export function formatFullTimestamp(iso: string | null): string {
  if (!iso) return '-';
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}
