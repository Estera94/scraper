import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createScrapeBatch,
  listUserBatches,
  getBatchWithJobs,
  deleteBatch
} from '../services/batchService.js';
import { createScrapeJobs } from '../services/jobService.js';
// Credit system disabled - removed credit checks
import { dedupeWebsitesByDomain } from '../utils/domains.js';

const router = express.Router();

const ensureInfoTypes = (infoTypes) => {
  if (!Array.isArray(infoTypes) || infoTypes.length === 0) {
    return null;
  }
  return infoTypes;
};

// Create a new scrape batch
router.post('/', authenticate, async (req, res) => {
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

    res.status(201).json({
      batch: {
        id: batch.id,
        status: batch.status,
        totalJobs: batch.totalJobs,
        createdAt: batch.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ error: error.message });
  }
});

// List user's batches
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {
      status: req.query.status || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const batches = await listUserBatches(req.user.id, filters);
    res.json({ batches });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get batch details with jobs
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await getBatchWithJobs(req.user.id, id);

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    res.json({ batch });
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete/cancel a batch
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteBatch(req.user.id, id);

    if (!deleted) {
      return res.status(404).json({ error: 'Batch not found or cannot be deleted' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

