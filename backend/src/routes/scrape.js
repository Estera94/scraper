import express from 'express';
import { Scraper } from '../services/scraper.js';
import { authenticate } from '../middleware/auth.js';
import prisma from '../db/prisma.js';
// Credit system disabled - removed credit checks
import {
  upsertCompanyWithScrape,
  listUserCompanies,
  getCompanyWithHistory,
  deleteCompanyForUser,
  deleteAllCompaniesForUser,
  deleteCompanyScrapeForUser,
  getCompanyForUser
} from '../services/companyService.js';
import { createScrapeBatch } from '../services/batchService.js';
import { createScrapeJobs } from '../services/jobService.js';
import { dedupeWebsitesByDomain, domainToUrl } from '../utils/domains.js';
import {
  scrapeLinkedInForCompany,
  getLinkedInDataWithContacts,
  deleteLinkedInProfileForCompany,
  deleteLinkedInContactForUser,
  createLinkedInContactForCompany
} from '../services/linkedinService.js';
import {
  listCompanyNotes,
  createCompanyNote,
  deleteCompanyNote
} from '../services/noteService.js';

const router = express.Router();
const scraper = new Scraper();

const ensureInfoTypes = (infoTypes) => {
  if (!Array.isArray(infoTypes) || infoTypes.length === 0) {
    return null;
  }

  return infoTypes;
};

router.post('/scrape', authenticate, async (req, res) => {
  try {
    const { websites = [], infoTypes } = req.body;
    const userId = req.user.id;

    const normalizedTargets = dedupeWebsitesByDomain(websites);
    if (normalizedTargets.length === 0) {
      return res.status(400).json({ error: 'At least one website is required.' });
    }

    const infoTypeList = ensureInfoTypes(infoTypes);
    if (!infoTypeList) {
      return res.status(400).json({ error: 'Info types array is required' });
    }

    // Credit system disabled - no credit checks
    // Create batch
    const batch = await createScrapeBatch(
      userId,
      normalizedTargets.map(t => t.website),
      infoTypeList
    );

    // Create jobs for the batch
    await createScrapeJobs(
      batch.id,
      normalizedTargets.map(t => t.website),
      infoTypeList
    );

    res.json({
      batch: {
        id: batch.id,
        status: batch.status,
        totalJobs: batch.totalJobs,
        createdAt: batch.createdAt
      },
      message: 'Scrape batch created successfully. Jobs will be processed by the scheduler.'
    });
  } catch (error) {
    console.error('Error in scrape endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/companies', authenticate, async (req, res) => {
  try {
    const filters = {
      search: req.query.search || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      hasLinkedIn: req.query.hasLinkedIn !== undefined ? req.query.hasLinkedIn : null,
      hasContacts: req.query.hasContacts !== undefined ? req.query.hasContacts : null,
      dataTypes: req.query.dataTypes ? (Array.isArray(req.query.dataTypes) ? req.query.dataTypes : req.query.dataTypes.split(',')) : null,
      sortBy: req.query.sortBy || 'updatedAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    // Validate sortBy
    const validSortFields = ['createdAt', 'updatedAt', 'domain'];
    if (!validSortFields.includes(filters.sortBy)) {
      filters.sortBy = 'updatedAt';
    }

    // Validate sortOrder
    if (filters.sortOrder !== 'asc' && filters.sortOrder !== 'desc') {
      filters.sortOrder = 'desc';
    }

    const companies = await listUserCompanies(req.user.id, filters);
    res.json({ companies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/companies/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit, cursor } = req.query;
    const result = await getCompanyWithHistory({
      userId: req.user.id,
      companyId: id,
      limit,
      cursor
    });

    if (!result) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching company profile:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/companies/:id/scrape', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const infoTypeList = ensureInfoTypes(req.body.infoTypes);

    if (!infoTypeList) {
      return res.status(400).json({ error: 'Info types array is required' });
    }

    const company = await getCompanyForUser(req.user.id, id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const websiteInput = (req.body.website && req.body.website.trim()) || domainToUrl(company.domain);

    // Credit system disabled - no credit checks
    console.log(`Re-scraping company ${company.domain} (${websiteInput})`);
    const scrapedData = await scraper.scrapeWebsite(websiteInput, infoTypeList);
    const { company: updatedCompany, scrape } = await upsertCompanyWithScrape({
      userId: req.user.id,
      website: websiteInput,
      infoTypes: infoTypeList,
      results: scrapedData
    });

    res.json({
      company: updatedCompany,
      scrape
    });
  } catch (error) {
    console.error('Error re-scraping company:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/companies/:id/linkedin', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const company = await getCompanyForUser(req.user.id, id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const { limit, cursor } = req.query;
    const data = await getLinkedInDataWithContacts(id, { limit, cursor });

    res.json(data);
  } catch (error) {
    console.error('Error fetching LinkedIn data:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/companies/:id/linkedin-scrape', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const company = await getCompanyForUser(req.user.id, id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Credit system disabled - no credit checks
    const { profile, contacts } = await scrapeLinkedInForCompany({
      company,
      linkedinUrl: req.body.linkedinUrl
    });

    res.json({
      profile,
      contacts
    });
  } catch (error) {
    console.error('Error scraping LinkedIn:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/companies/:id/linkedin', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const company = await getCompanyForUser(req.user.id, id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const deleted = await deleteLinkedInProfileForCompany(id);
    if (!deleted) {
      return res.status(404).json({ error: 'LinkedIn profile not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting LinkedIn profile:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/companies/:id/linkedin-contacts', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, title, location, email, linkedinUrl } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const contact = await createLinkedInContactForCompany(req.user.id, id, {
      fullName: fullName.trim(),
      title: title?.trim() || null,
      location: location?.trim() || null,
      email: email?.trim() || null,
      linkedinUrl: linkedinUrl?.trim() || null
    });

    res.status(201).json({ contact });
  } catch (error) {
    console.error('Error creating LinkedIn contact:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/linkedin-contacts/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteLinkedInContactForUser(req.user.id, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting LinkedIn contact:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/companies/:id/notes', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await listCompanyNotes(id, req.user.id);
    if (!result) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json({ notes: result.notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/companies/:id/notes', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;

    if (!body || typeof body !== 'string') {
      return res.status(400).json({ error: 'Note body is required' });
    }

    const company = await getCompanyForUser(req.user.id, id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const note = await createCompanyNote({
      companyId: id,
      authorId: req.user.id,
      body: body.trim()
    });

    res.status(201).json({ note });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/company-notes/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteCompanyNote({ noteId: id, userId: req.user.id });
    if (!deleted) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/companies/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status (allow null to clear status, or non-empty string)
    if (status !== null && status !== undefined && (typeof status !== 'string' || status.trim().length === 0)) {
      return res.status(400).json({ error: 'Status must be a non-empty string or null' });
    }

    // Verify company belongs to user
    const company = await getCompanyForUser(req.user.id, id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Update status
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: { status: status?.trim() || null }
    });

    res.json({ company: updatedCompany });
  } catch (error) {
    console.error('Error updating company status:', error);
    
    // Provide more helpful error messages
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Check if it's a database schema error (column doesn't exist)
    if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
      return res.status(500).json({ 
        error: 'Database migration required. Please run: npx prisma migrate dev' 
      });
    }
    
    res.status(500).json({ error: error.message || 'Failed to update company status' });
  }
});

// Get user's custom statuses
router.get('/custom-statuses', authenticate, async (req, res) => {
  try {
    const customStatuses = await prisma.userCustomStatus.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ customStatuses });
  } catch (error) {
    console.error('Error fetching custom statuses:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch custom statuses' });
  }
});

// Create a custom status
router.post('/custom-statuses', authenticate, async (req, res) => {
  try {
    const { label, color } = req.body;

    if (!label || !label.trim()) {
      return res.status(400).json({ error: 'Label is required' });
    }

    if (!color || !color.trim()) {
      return res.status(400).json({ error: 'Color is required' });
    }

    // Validate color format (hex or named color)
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^[a-zA-Z]+$/;
    if (!colorRegex.test(color.trim())) {
      return res.status(400).json({ error: 'Invalid color format. Use hex (#RRGGBB) or color name' });
    }

    const customStatus = await prisma.userCustomStatus.upsert({
      where: {
        userId_label: {
          userId: req.user.id,
          label: label.trim()
        }
      },
      update: {
        color: color.trim()
      },
      create: {
        userId: req.user.id,
        label: label.trim(),
        color: color.trim()
      }
    });

    res.json({ customStatus });
  } catch (error) {
    console.error('Error creating custom status:', error);
    res.status(500).json({ error: error.message || 'Failed to create custom status' });
  }
});

// Delete a custom status
router.delete('/custom-statuses/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const customStatus = await prisma.userCustomStatus.findUnique({
      where: { id }
    });

    if (!customStatus || customStatus.userId !== req.user.id) {
      return res.status(404).json({ error: 'Custom status not found' });
    }

    await prisma.userCustomStatus.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom status:', error);
    res.status(500).json({ error: error.message || 'Failed to delete custom status' });
  }
});

router.delete('/companies/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteCompanyForUser(req.user.id, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/companies', authenticate, async (req, res) => {
  try {
    await deleteAllCompaniesForUser(req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting all companies:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/company-scrapes/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteCompanyScrapeForUser(req.user.id, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Scrape not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting scrape:', error);
    res.status(500).json({ error: error.message });
  }
});

process.on('SIGINT', async () => {
  await scraper.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await scraper.close();
  process.exit(0);
});

export default router;
