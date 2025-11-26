import express from 'express';
import { Scraper } from '../services/scraper.js';
import { addResult, readResults, saveResults, deleteResult, deleteAllResults } from '../utils/fileManager.js';

const router = express.Router();
const scraper = new Scraper();

// Scrape websites for selected information
router.post('/scrape', async (req, res) => {
  try {
    const { websites, infoTypes } = req.body;

    if (!websites || !Array.isArray(websites) || websites.length === 0) {
      return res.status(400).json({ error: 'Websites array is required' });
    }

    if (!infoTypes || !Array.isArray(infoTypes) || infoTypes.length === 0) {
      return res.status(400).json({ error: 'Info types array is required' });
    }

    const results = [];

    // Process each website
    for (const website of websites) {
      try {
        console.log(`Scraping ${website} for: ${infoTypes.join(', ')}`);
        const scrapedData = await scraper.scrapeWebsite(website, infoTypes);
        
        // Save to JSON file
        await addResult(website, scrapedData);
        
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

    res.json({ results });
  } catch (error) {
    console.error('Error in scrape endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all saved results
router.get('/results', async (req, res) => {
  try {
    const results = await readResults();
    res.json({ results });
  } catch (error) {
    console.error('Error reading results:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a single result by index (MUST come before /results to match correctly)
router.delete('/results/:index', async (req, res) => {
  try {
    console.log('DELETE /results/:index called with index:', req.params.index);
    const index = parseInt(req.params.index, 10);
    
    if (isNaN(index)) {
      return res.status(400).json({ error: 'Invalid index' });
    }

    await deleteResult(index);
    res.json({ success: true, message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete all results
router.delete('/results', async (req, res) => {
  try {
    console.log('DELETE /results called (delete all)');
    await deleteAllResults();
    res.json({ success: true, message: 'All results deleted successfully' });
  } catch (error) {
    console.error('Error deleting all results:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save results (already handled in scrape, but keeping for consistency)
router.post('/save', async (req, res) => {
  try {
    const { results } = req.body;
    
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({ error: 'Results array is required' });
    }

    await saveResults(results);
    res.json({ success: true, message: 'Results saved successfully' });
  } catch (error) {
    console.error('Error saving results:', error);
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

