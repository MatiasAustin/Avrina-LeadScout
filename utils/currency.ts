export type CurrencyCode = 'IDR' | 'USD' | 'EUR';

export const getCurrencySymbol = (currency?: string): string => {
  const c = (currency || 'IDR').toUpperCase();
  if (c === 'IDR') return 'Rp';
  if (c === 'USD') return '$';
  if (c === 'EUR') return '€';
  return c;
};

export const formatCurrency = (amount: number, currency?: string): string => {
  const num = Number(amount) || 0;
  const c = (currency || 'IDR').toUpperCase();
  if (c === 'IDR') {
    return `Rp ${num.toLocaleString('id-ID')}`;
  }
  if (c === 'USD') {
    return `$${num.toLocaleString('en-US')}`;
  }
  if (c === 'EUR') {
    return `€${num.toLocaleString('de-DE')}`;
  }
  return `${c} ${num.toLocaleString()}`;
};

export const formatCompactCurrency = (amount: number, currency?: string): string => {
  const num = Number(amount) || 0;
  const c = (currency || 'IDR').toUpperCase();
  if (c === 'IDR') {
    if (num >= 1_000_000_000) {
      const val = (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '');
      return `Rp ${val} M`;
    }
    if (num >= 1_000_000) {
      const val = (num / 1_000_000).toFixed(1).replace(/\.0$/, '');
      return `Rp ${val} Jt`;
    }
    if (num >= 1_000) {
      const val = (num / 1_000).toFixed(1).replace(/\.0$/, '');
      return `Rp ${val} Rb`;
    }
    return `Rp ${num.toLocaleString('id-ID')}`;
  }
  if (c === 'USD') {
    if (num >= 1_000_000) {
      const val = (num / 1_000_000).toFixed(1).replace(/\.0$/, '');
      return `$${val}M`;
    }
    if (num >= 1_000) {
      const val = (num / 1_000).toFixed(1).replace(/\.0$/, '');
      return `$${val}k`;
    }
    return `$${num.toLocaleString('en-US')}`;
  }
  if (c === 'EUR') {
    if (num >= 1_000_000) {
      const val = (num / 1_000_000).toFixed(1).replace(/\.0$/, '');
      return `€${val}M`;
    }
    if (num >= 1_000) {
      const val = (num / 1_000).toFixed(1).replace(/\.0$/, '');
      return `€${val}k`;
    }
    return `€${num.toLocaleString('de-DE')}`;
  }
  return `${c} ${num.toLocaleString()}`;
};
