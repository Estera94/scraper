import express from 'express';
import { Scraper } from '../services/scraper.js';
import { authenticate } from '../middleware/auth.js';
import { checkCredits, deductCredits, CREDITS_PER_SCRAPE } from '../services/creditService.js';
import prisma from '../db/prisma.js';

const router = express.Router();
const scraper = new Scraper();

// Scrape websites for selected information (protected route)
router.post('/scrape', authenticate, async (req, res) => {
  try {
    const { websites, infoTypes } = req.body;
    const userId = req.user.id;

    if (!websites || !Array.isArray(websites) || websites.length === 0) {
      return res.status(400).json({ error: 'Websites array is required' });
    }

    if (!infoTypes || !Array.isArray(infoTypes) || infoTypes.length === 0) {
      return res.status(400).json({ error: 'Info types array is required' });
    }

    // Calculate required credits (1 credit per website)
    const requiredCredits = websites.length * CREDITS_PER_SCRAPE;

    // Check if user has sufficient credits
    const creditCheck = await checkCredits(userId, requiredCredits);
    if (!creditCheck.hasCredits) {
      return res.status(402).json({
        error: 'Insufficient credits',
        required: requiredCredits,
        current: creditCheck.currentCredits
      });
    }

    const results = [];

    // Process each website
    for (const website of websites) {
      try {
        console.log(`Scraping ${website} for: ${infoTypes.join(', ')}`);
        const scrapedData = await scraper.scrapeWebsite(website, infoTypes);
        
        // Save to database
        await prisma.scrapeResult.create({
          data: {
            userId: userId,
            website: website,
            results: scrapedData
          }
        });
        
        results.push({
          website,
          results: scrapedData,
          success: true
        });
      } catch (error) {
        console.error(`Error scraping ${website}:`, error);
        results.push({
          website,
          results: null,
          success: false,
          error: error.message
        });
      }
    }

    // Deduct credits after successful scrapes
    const successfulScrapes = results.filter(r => r.success).length;
    if (successfulScrapes > 0) {
      await deductCredits(userId, successfulScrapes * CREDITS_PER_SCRAPE);
    }

    res.json({ 
      results,
      creditsUsed: successfulScrapes * CREDITS_PER_SCRAPE
    });
  } catch (error) {
    console.error('Error in scrape endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all saved results for the authenticated user
router.get('/results', authenticate, async (req, res) => {
  try {
    const results = await prisma.scrapeResult.findMany({
      where: { userId: req.user.id },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        website: true,
        results: true,
        timestamp: true
      }
    });

    // Transform to match frontend expectations
    const formattedResults = results.map(result => ({
      id: result.id,
      website: result.website,
      results: result.results,
      timestamp: result.timestamp.toISOString()
    }));

    res.json({ results: formattedResults });
  } catch (error) {
    console.error('Error reading results:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a single result by ID
router.delete('/results/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify the result belongs to the user
    const result = await prisma.scrapeResult.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    if (result.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.scrapeResult.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete all results for the authenticated user
router.delete('/results', authenticate, async (req, res) => {
  try {
    await prisma.scrapeResult.deleteMany({
      where: { userId: req.user.id }
    });

    res.json({ success: true, message: 'All results deleted successfully' });
  } catch (error) {
    console.error('Error deleting all results:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cleanup on process exit
process.on('SIGINT', async () => {
  await scraper.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await scraper.close();
  process.exit(0);
});

export default router;
