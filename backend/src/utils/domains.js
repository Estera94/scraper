export const normalizeDomain = (input = '') => {
  if (typeof input !== 'string') {
    return '';
  }

  let value = input.trim();
  if (!value) {
    return '';
  }

  try {
    const prefixed = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(prefixed);
    return url.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return value
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .toLowerCase();
  }
};

export const dedupeWebsitesByDomain = (websites = []) => {
  const seen = new Set();

  return websites
    .filter(website => typeof website === 'string' && website.trim())
    .map(website => website.trim())
    .map(website => ({
      website,
      domain: normalizeDomain(website)
    }))
    .filter(({ domain }) => !!domain)
    .filter(({ domain }, index, list) => {
      if (seen.has(domain)) {
        return false;
      }
      seen.add(domain);
      return true;
    });
};

export const domainToUrl = (domain) => {
  if (!domain) {
    return '';
  }
  if (/^https?:\/\//i.test(domain)) {
    return domain;
  }
  return `https://${domain}`;
};


