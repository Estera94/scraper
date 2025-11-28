import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getCompanyLinkedInExport,
  getContactsExport,
  getScrapeHistoryExport,
  getAllDataExport,
  exportData,
  parseFilters
} from '../services/exportService.js';

const router = express.Router();

/**
 * Helper to send file response
 */
const sendFileResponse = (res, content, contentType, filename) => {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  if (Buffer.isBuffer(content)) {
    res.send(content);
  } else {
    res.send(content);
  }
};

/**
 * GET /api/reports/companies
 * Export company and LinkedIn data
 */
router.get('/companies', authenticate, async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const format = req.query.format || 'csv';
    const userId = req.user.id;

    const data = await getCompanyLinkedInExport(userId, filters);
    
    const headers = [
      'companyId', 'domain', 'displayName', 'companyCreatedAt', 'companyUpdatedAt',
      'linkedinCompanyUrl', 'linkedinHeadline', 'linkedinDescription', 'linkedinIndustry',
      'linkedinFollowerCount', 'linkedinEmployeeCountMin', 'linkedinEmployeeCountMax',
      'linkedinHeadquarters', 'linkedinWebsite', 'linkedinLogoUrl', 'linkedinLastScrapedAt',
      'snapshotLinkedin', 'snapshotEmail', 'snapshotTwitter', 'snapshotPhone',
      'snapshotWhmcs', 'snapshotCustomKeywords', 'snapshotScrapedAt', 'snapshotInfoTypes'
    ];

    const result = await exportData(data, format, headers, 'Company & LinkedIn Export');
    const filename = `companies-export-${Date.now()}.${result.extension}`;

    sendFileResponse(res, result.content, result.contentType, filename);
  } catch (error) {
    console.error('Error exporting companies:', error);
    res.status(500).json({ error: error.message || 'Failed to export companies data' });
  }
});

/**
 * GET /api/reports/contacts
 * Export key contacts data
 */
router.get('/contacts', authenticate, async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const format = req.query.format || 'csv';
    const userId = req.user.id;

    const data = await getContactsExport(userId, filters);
    
    const headers = [
      'contactId', 'fullName', 'title', 'location', 'email', 'emailStatus',
      'linkedinUrl', 'connectionDegree', 'scrapedAt', 'contactCreatedAt',
      'companyDomain', 'companyDisplayName', 'companyId'
    ];

    const result = await exportData(data, format, headers, 'Key Contacts Export');
    const filename = `contacts-export-${Date.now()}.${result.extension}`;

    sendFileResponse(res, result.content, result.contentType, filename);
  } catch (error) {
    console.error('Error exporting contacts:', error);
    res.status(500).json({ error: error.message || 'Failed to export contacts data' });
  }
});

/**
 * GET /api/reports/scrapes
 * Export scrape history data
 */
router.get('/scrapes', authenticate, async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const format = req.query.format || 'csv';
    const userId = req.user.id;

    const data = await getScrapeHistoryExport(userId, filters);
    
    const headers = [
      'scrapeId', 'companyId', 'companyDomain', 'companyDisplayName',
      'tool', 'infoTypes', 'results', 'metadata', 'createdAt'
    ];

    const result = await exportData(data, format, headers, 'Scrape History Export');
    const filename = `scrapes-export-${Date.now()}.${result.extension}`;

    sendFileResponse(res, result.content, result.contentType, filename);
  } catch (error) {
    console.error('Error exporting scrapes:', error);
    res.status(500).json({ error: error.message || 'Failed to export scrape history' });
  }
});

/**
 * GET /api/reports/all
 * Export all data (combined)
 */
router.get('/all', authenticate, async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const format = req.query.format || 'json';
    const userId = req.user.id;

    const allData = await getAllDataExport(userId, filters);

    if (format === 'json') {
      const result = await exportData(allData, format, [], 'All Data Export');
      const filename = `all-data-export-${Date.now()}.${result.extension}`;
      sendFileResponse(res, result.content, result.contentType, filename);
    } else {
      // For other formats, export as separate sheets/files or combine
      // For simplicity, we'll export companies as the main data
      const headers = [
        'companyId', 'domain', 'displayName', 'companyCreatedAt', 'companyUpdatedAt',
        'linkedinCompanyUrl', 'linkedinHeadline', 'linkedinDescription', 'linkedinIndustry',
        'linkedinFollowerCount', 'linkedinEmployeeCountMin', 'linkedinEmployeeCountMax',
        'linkedinHeadquarters', 'linkedinWebsite', 'linkedinLogoUrl', 'linkedinLastScrapedAt',
        'snapshotLinkedin', 'snapshotEmail', 'snapshotTwitter', 'snapshotPhone',
        'snapshotWhmcs', 'snapshotCustomKeywords', 'snapshotScrapedAt', 'snapshotInfoTypes'
      ];

      const result = await exportData(allData.companies, format, headers, 'All Data Export');
      const filename = `all-data-export-${Date.now()}.${result.extension}`;
      sendFileResponse(res, result.content, result.contentType, filename);
    }
  } catch (error) {
    console.error('Error exporting all data:', error);
    res.status(500).json({ error: error.message || 'Failed to export all data' });
  }
});

export default router;

