import cron from 'node-cron';
import { Scraper } from './scraper.js';
import { getPendingJobs, markJobAsQueued, markJobAsProcessing, updateJobStatus } from './jobService.js';
import { incrementBatchCounters, recalculateBatchStatus, updateBatchStatus } from './batchService.js';
import { upsertCompanyWithScrape } from './companyService.js';
import { checkCredits, deductCredits, CREDITS_PER_SCRAPE } from './creditService.js';

const scraper = new Scraper();
let isProcessing = false;
const JOBS_PER_RUN = 5; // Process up to 5 jobs per cron run

/**
 * Process a single scrape job
 */
const processScrapeJob = async (job) => {
  try {
    // Mark as processing
    await markJobAsProcessing(job.id);

    // Check if user has credits
    const creditCheck = await checkCredits(job.batch.userId, CREDITS_PER_SCRAPE);
    if (!creditCheck.hasCredits) {
      await updateJobStatus(job.id, 'failed', {
        error: `Insufficient credits. Required: ${CREDITS_PER_SCRAPE}, Available: ${creditCheck.currentCredits}`
      });
      await incrementBatchCounters(job.batchId, 'failedJobs');
      await recalculateBatchStatus(job.batchId);
      return;
    }

    // Execute scraping
    console.log(`[Cron] Processing job ${job.id}: Scraping ${job.website} for: ${JSON.stringify(job.infoTypes)}`);
    const scrapedData = await scraper.scrapeWebsite(job.website, job.infoTypes);

    // Save results to Company and CompanyScrape
    const { company, scrape } = await upsertCompanyWithScrape({
      userId: job.batch.userId,
      website: job.website,
      infoTypes: job.infoTypes,
      results: scrapedData
    });

    // Deduct credits
    await deductCredits(job.batch.userId, CREDITS_PER_SCRAPE);

    // Update job as completed
    await updateJobStatus(job.id, 'completed', {
      companyId: company.id,
      scrapeId: scrape.id
    });

    // Update batch counters
    await incrementBatchCounters(job.batchId, 'completedJobs');
    await recalculateBatchStatus(job.batchId);

    console.log(`[Cron] Job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`[Cron] Error processing job ${job.id}:`, error);
    
    // Mark job as failed
    await updateJobStatus(job.id, 'failed', {
      error: error.message || 'Unknown error occurred'
    });

    // Update batch counters
    await incrementBatchCounters(job.batchId, 'failedJobs');
    await recalculateBatchStatus(job.batchId);
  }
};

/**
 * Process pending jobs
 */
const processPendingJobs = async () => {
  if (isProcessing) {
    console.log('[Cron] Previous run still processing, skipping...');
    return;
  }

  isProcessing = true;

  try {
    // Initialize scraper if needed
    await scraper.init();

    // Get pending jobs
    const pendingJobs = await getPendingJobs(JOBS_PER_RUN);

    if (pendingJobs.length === 0) {
      console.log('[Cron] No pending jobs to process');
      return;
    }

    console.log(`[Cron] Processing ${pendingJobs.length} pending jobs`);

    // Get unique batch IDs and update their status to processing
    const batchIds = [...new Set(pendingJobs.map(job => job.batchId))];
    for (const batchId of batchIds) {
      await updateBatchStatus(batchId, 'processing');
    }

    // Mark jobs as queued first
    for (const job of pendingJobs) {
      await markJobAsQueued(job.id);
    }

    // Process jobs in parallel (but limit concurrency)
    const processPromises = pendingJobs.map(job => processScrapeJob(job));
    await Promise.allSettled(processPromises);

  } catch (error) {
    console.error('[Cron] Error in processPendingJobs:', error);
  } finally {
    isProcessing = false;
  }
};

/**
 * Initialize and start the cron scheduler
 */
export const startCronScheduler = () => {
  // Run every 30 seconds: */30 * * * * *
  const cronExpression = '*/30 * * * * *';
  
  console.log('[Cron] Starting scheduler with expression:', cronExpression);
  
  const task = cron.schedule(cronExpression, async () => {
    await processPendingJobs();
  }, {
    scheduled: false
  });

  task.start();
  console.log('[Cron] Scheduler started successfully');

  return task;
};

/**
 * Stop the cron scheduler
 */
export const stopCronScheduler = (task) => {
  if (task) {
    task.stop();
    console.log('[Cron] Scheduler stopped');
  }
  
  // Close scraper browser
  scraper.close().catch(err => {
    console.error('[Cron] Error closing scraper:', err);
  });
};

