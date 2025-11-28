import assert from 'node:assert/strict';
import { normalizeLinkedInCompanyInput } from '../linkedinScraper.js';

const run = () => {
  const urlFromSlug = normalizeLinkedInCompanyInput('microsoft');
  assert.equal(urlFromSlug, 'https://www.linkedin.com/company/microsoft');

  const fullUrl = 'https://www.linkedin.com/company/openai/';
  assert.equal(normalizeLinkedInCompanyInput(fullUrl), fullUrl);

  assert.equal(normalizeLinkedInCompanyInput(''), null);
  assert.equal(normalizeLinkedInCompanyInput(null), null);
};

run();

