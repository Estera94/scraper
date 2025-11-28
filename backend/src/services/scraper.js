import puppeteer from 'puppeteer';
import { config } from '../config.js';

const CUSTOM_PREFIX = 'custom:';

export class Scraper {
  constructor() {
    this.browser = null;
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

  async scrapeWebsite(website, infoTypes = []) {
    const requestedInfoTypes = Array.isArray(infoTypes) ? infoTypes : [];
    const results = {
      linkedin: null,
      email: null,
      twitter: null,
      phone: null,
      whmcs: false
    };

    try {
      await this.init();
      
      // Create new page with timeout handling
      let page;
      try {
        page = await this.browser.newPage();
        page.setDefaultTimeout(30000); // 30 seconds for page operations
        page.setDefaultNavigationTimeout(30000); // 30 seconds for navigation
      } catch (error) {
        console.error(`Failed to create new page for ${website}:`, error.message);
        // If page creation fails, try to continue with a fresh browser instance
        await this.close();
        await this.init();
        page = await this.browser.newPage();
        page.setDefaultTimeout(30000);
        page.setDefaultNavigationTimeout(30000);
      }
      
      // Normalize website URL
      let url = website.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }

      // Scrape multiple pages
      const allHtmlContent = [];
      for (const path of config.pagesToScrape) {
        try {
          const pageUrl = `${url}${path}`;
          console.log(`Scraping: ${pageUrl}`);
          
          // Try with networkidle2 first, fallback to domcontentloaded for slow sites
          try {
            await page.goto(pageUrl, {
              waitUntil: 'networkidle2',
              timeout: 30000 // 30 seconds
            });
          } catch (timeoutError) {
            // If networkidle2 times out, try with domcontentloaded (faster, less strict)
            console.log(`networkidle2 timeout for ${pageUrl}, trying domcontentloaded...`);
            await page.goto(pageUrl, {
              waitUntil: 'domcontentloaded',
              timeout: 30000
            });
            // Give it a moment for dynamic content
            await page.waitForTimeout(2000);
          }

          const html = await page.content();
          allHtmlContent.push(html);
        } catch (error) {
          console.log(`Failed to scrape ${url}${path}: ${error.message}`);
          // Continue with other pages
        }
      }

      await page.close();

      // Extract information from all collected HTML
      const combinedHtml = allHtmlContent.join('\n');
      
      if (requestedInfoTypes.includes('email')) {
        results.email = this.extractEmail(combinedHtml);
      }
      if (requestedInfoTypes.includes('linkedin')) {
        results.linkedin = this.extractLinkedIn(combinedHtml);
      }
      if (requestedInfoTypes.includes('twitter')) {
        results.twitter = this.extractTwitter(combinedHtml);
      }
      if (requestedInfoTypes.includes('phone')) {
        results.phone = this.extractPhone(combinedHtml);
      }
      if (requestedInfoTypes.includes('whmcs')) {
        results.whmcs = this.extractWHMCS(combinedHtml);
      }

      const customKeywords = requestedInfoTypes
        .filter(type => typeof type === 'string' && type.startsWith(CUSTOM_PREFIX))
        .map(type => type.slice(CUSTOM_PREFIX.length).trim())
        .filter(Boolean);

      if (customKeywords.length > 0) {
        const seen = new Set();
        results.customKeywords = customKeywords
          .filter(keyword => {
            const key = keyword.toLowerCase();
            if (seen.has(key)) {
              return false;
            }
            seen.add(key);
            return true;
          })
          .map(keyword => {
            const matches = this.extractCustomKeywordMatches(combinedHtml, keyword);
            return {
              keyword,
              found: matches.length > 0,
              matches
            };
          });
      }

      return results;
    } catch (error) {
      console.error(`Error scraping ${website}:`, error);
      throw error;
    }
  }

  extractEmail(html) {
    // Email regex pattern
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = html.match(emailRegex);
    
    if (emails && emails.length > 0) {
      // Filter out common false positives
      const filtered = emails.filter(email => {
        const lower = email.toLowerCase();
        return !lower.includes('example.com') && 
               !lower.includes('test.com') && 
               !lower.includes('domain.com') &&
               !lower.includes('sentry.io') &&
               !lower.includes('google-analytics');
      });
      
      // Also check for mailto links
      const mailtoRegex = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
      const mailtoMatches = html.match(mailtoRegex);
      if (mailtoMatches) {
        mailtoMatches.forEach(match => {
          const email = match.replace('mailto:', '').toLowerCase();
          if (!filtered.includes(email)) {
            filtered.push(email);
          }
        });
      }
      
      return filtered.length > 0 ? filtered[0] : null;
    }
    return null;
  }

  extractLinkedIn(html) {
    // Find LinkedIn URLs
    const linkedinRegex = /https?:\/\/(www\.)?(linkedin\.com\/[^\s"<>]+)/gi;
    const matches = html.match(linkedinRegex);
    
    if (matches && matches.length > 0) {
      // Filter to get the most relevant (company/profile pages)
      const companyMatch = matches.find(m => m.includes('/company/') || m.includes('/in/'));
      return companyMatch || matches[0];
    }
    return null;
  }

  extractTwitter(html) {
    // Find Twitter/X URLs
    const twitterRegex = /https?:\/\/(www\.)?(twitter\.com|x\.com)\/([^\s"<>]+)/gi;
    const matches = html.match(twitterRegex);
    
    if (matches && matches.length > 0) {
      return matches[0];
    }
    return null;
  }

  extractPhone(html) {
    // Various phone number patterns
    const phonePatterns = [
      /\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // US format
      /\+?[\d\s\-\(\)]{10,}/g, // General international format
      /\+?\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g // International
    ];

    for (const pattern of phonePatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        // Filter out false positives (like dates, IDs, etc.)
        const validPhones = matches.filter(phone => {
          const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
          return cleaned.length >= 10 && cleaned.length <= 15 && /^\+?\d+$/.test(cleaned);
        });
        
        if (validPhones.length > 0) {
          return validPhones[0].trim();
        }
      }
    }
    return null;
  }

  extractWHMCS(html) {
    // Case-insensitive search for WHMCS
    const whmcsRegex = /whmcs/gi;
    const matches = html.match(whmcsRegex);
    
    if (matches && matches.length > 0) {
      return true;
    }
    
    // Also check for WHMCS-related URLs
    const whmcsUrlRegex = /whmcs\.com|whmcs-api|whmcs-client/gi;
    if (html.match(whmcsUrlRegex)) {
      return true;
    }
    
    return false;
  }

  extractCustomKeywordMatches(html, keyword) {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKeyword, 'gi');
    const matches = [];
    const contextRadius = 80;
    let match;

    while ((match = regex.exec(html)) !== null && matches.length < 3) {
      const start = Math.max(0, match.index - contextRadius);
      const end = Math.min(html.length, match.index + keyword.length + contextRadius);
      const snippet = html
        .slice(start, end)
        .replace(/\s+/g, ' ')
        .trim();
      matches.push(snippet);
    }

    return matches;
  }
}

