import puppeteer from 'puppeteer';
import { config } from '../config.js';

const LOGIN_URL = 'https://www.linkedin.com/login';

export const normalizeLinkedInCompanyInput = (companyInput = '') => {
  if (!companyInput) {
    return null;
  }
  if (companyInput.startsWith('http')) {
    return companyInput;
  }
  const slug = companyInput.replace(/^\/+/, '').replace(/\/+$/, '');
  return `${config.linkedin.baseUrl}${config.linkedin.companyPath}${slug}`;
};

export class LinkedInScraper {
  constructor(opts = {}) {
    this.browser = null;
    this.options = {
      maxContacts: config.linkedin.maxContacts,
      waitBetweenRequestsMs: config.linkedin.waitBetweenRequestsMs,
      ...opts
    };
  }

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch(config.puppeteerOptions);
    }
    return this.browser;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async newPage() {
    await this.init();
    const page = await this.browser.newPage();
    page.setDefaultTimeout(45000);
    page.setDefaultNavigationTimeout(45000);
    return page;
  }

  async login(page) {
    if (!config.linkedin.username || !config.linkedin.password) {
      throw new Error('LinkedIn credentials are not configured. Set LINKEDIN_USERNAME and LINKEDIN_PASSWORD env vars.');
    }

    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

    const usernameField = await page.$('input#username, input[name="session_key"]');
    const passwordField = await page.$('input#password, input[name="session_password"]');

    if (!usernameField || !passwordField) {
      const alreadyLoggedIn = await page.$('nav.global-nav');
      if (alreadyLoggedIn) {
        return;
      }
      throw new Error('LinkedIn login form not available. The page layout may have changed.');
    }

    await usernameField.focus();
    await page.keyboard.type(config.linkedin.username, { delay: 30 });
    await passwordField.focus();
    await page.keyboard.type(config.linkedin.password, { delay: 30 });
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    const loginChallenge = await page.$('form[action*="checkpoint"]');
    if (loginChallenge) {
      throw new Error('LinkedIn requested an additional verification step. Please complete the checkpoint manually.');
    }
  }

  async ensureAuthenticated(page) {
    if (page.url().startsWith(config.linkedin.baseUrl)) {
      return;
    }
    await this.login(page);
  }

  async scrapeCompany(companyInput) {
    const url = normalizeLinkedInCompanyInput(companyInput);
    if (!url) {
      throw new Error('LinkedIn company URL or slug is required.');
    }

    const page = await this.newPage();
    try {
      await this.ensureAuthenticated(page);
      await page.goto(url, { waitUntil: 'networkidle2' });

      const companyData = await this.extractCompanyProfile(page);
      const contacts = await this.scrapeContacts(url);

      return { company: companyData, contacts };
    } finally {
      await page.close();
    }
  }

  async extractCompanyProfile(page) {
    return page.evaluate(() => {
      const getText = (selector) => document.querySelector(selector)?.textContent?.trim() || null;
      const dataAttr = (selector, attr) => document.querySelector(selector)?.getAttribute(attr) || null;

      const followerText = getText('.followers-count');
      const matchFollowers = followerText ? followerText.match(/([\d,]+)/) : null;
      const followers = matchFollowers ? parseInt(matchFollowers[1].replace(/,/g, ''), 10) : null;

      const employeeRangeText = getText('.org-top-card-summary-info-list__info-item');
      let employeeCountMin = null;
      let employeeCountMax = null;
      if (employeeRangeText) {
        const matchRange = employeeRangeText.match(/(\d[\d,]*)\s*-\s*(\d[\d,]*)/);
        if (matchRange) {
          employeeCountMin = parseInt(matchRange[1].replace(/,/g, ''), 10);
          employeeCountMax = parseInt(matchRange[2].replace(/,/g, ''), 10);
        }
      }

      const headquarters = [];
      document.querySelectorAll('.org-about-company-module__company-headquarter h3').forEach(node => {
        headquarters.push(node.textContent.trim());
      });

      return {
        companyUrl: window.location.href,
        headline: getText('.org-top-card-summary__tagline'),
        description: getText('.org-about-us-organization-description__text'),
        industry: getText('.org-top-card-summary__industry'),
        followerCount: followers,
        employeeCountMin,
        employeeCountMax,
        headquarters: headquarters.length ? headquarters : null,
        website: dataAttr('a[data-control-name="page_member_main_site"]', 'href'),
        logoUrl: document.querySelector('.org-top-card-primary-content__logo img')?.src || null,
        lastScrapedAt: new Date().toISOString()
      };
    });
  }

  async scrapeContacts(baseCompanyUrl) {
    const contacts = [];
    const page = await this.newPage();

    try {
      await this.ensureAuthenticated(page);
      const peopleUrl = `${baseCompanyUrl.replace(/\/$/, '')}/people/`;
      await page.goto(peopleUrl, { waitUntil: 'networkidle2' });

      let hasMore = true;
      while (hasMore && contacts.length < this.options.maxContacts) {
        const newContacts = await page.evaluate(() => {
          const results = [];
          document.querySelectorAll('.org-people-profile-card').forEach(card => {
            const name = card.querySelector('.artdeco-entity-lockup__title')?.textContent?.trim() || null;
            const title = card.querySelector('.artdeco-entity-lockup__subtitle')?.textContent?.trim() || null;
            const location = card.querySelector('.artdeco-entity-lockup__caption')?.textContent?.trim() || null;
            const linkedinUrl = card.querySelector('a')?.href || null;

            if (name) {
              results.push({
                fullName: name,
                title,
                location,
                linkedinUrl
              });
            }
          });
          return results;
        });

        for (const contact of newContacts) {
          contacts.push({
            ...contact,
            scrapedAt: new Date().toISOString()
          });
          if (contacts.length >= this.options.maxContacts) {
            break;
          }
        }

        const nextButton = await page.$('button[aria-label="Next"]');
        if (nextButton && !(await nextButton.evaluate(btn => btn.disabled))) {
          await Promise.all([
            nextButton.click(),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
          ]);
          await page.waitForTimeout(this.options.waitBetweenRequestsMs);
        } else {
          hasMore = false;
        }
      }

      return contacts;
    } finally {
      await page.close();
    }
  }
}

