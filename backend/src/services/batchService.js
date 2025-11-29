import prisma from '../db/prisma.js';

export const createScrapeBatch = async (userId, websites, infoTypes) => {
  const normalizedWebsites = Array.isArray(websites) ? websites : [];
  const normalizedInfoTypes = Array.isArray(infoTypes) ? infoTypes : [];

  if (normalizedWebsites.length === 0) {
    throw new Error('At least one website is required.');
  }

  if (normalizedInfoTypes.length === 0) {
    throw new Error('At least one info type is required.');
  }

  const batch = await prisma.scrapeBatch.create({
    data: {
      userId,
      status: 'pending',
      totalJobs: normalizedWebsites.length,
      completedJobs: 0,
      failedJobs: 0,
      metadata: {
        websites: normalizedWebsites,
        infoTypes: normalizedInfoTypes,
        createdAt: new Date().toISOString()
      }
    }
  });

  return batch;
};

export const listUserBatches = async (userId, filters = {}) => {
  const where = {
    userId
  };

  // Status filter
  if (filters.status && filters.status.trim()) {
    where.status = filters.status.trim();
  }

  // Date range filter
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  // Build sort order
  const sortBy = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder || 'desc';
  const orderBy = {};
  orderBy[sortBy] = sortOrder;

  const batches = await prisma.scrapeBatch.findMany({
    where,
    orderBy,
    include: {
      jobs: {
        select: {
          id: true,
          status: true
        }
      }
    }
  });

  return batches.map(batch => ({
    id: batch.id,
    userId: batch.userId,
    status: batch.status,
    totalJobs: batch.totalJobs,
    completedJobs: batch.completedJobs,
    failedJobs: batch.failedJobs,
    metadata: batch.metadata,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
    progress: batch.totalJobs > 0 
      ? Math.round((batch.completedJobs / batch.totalJobs) * 100) 
      : 0
  }));
};

export const getBatchWithJobs = async (userId, batchId) => {
  const batch = await prisma.scrapeBatch.findFirst({
    where: {
      id: batchId,
      userId
    },
    include: {
      jobs: {
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  if (!batch) {
    return null;
  }

  return {
    id: batch.id,
    userId: batch.userId,
    status: batch.status,
    totalJobs: batch.totalJobs,
    completedJobs: batch.completedJobs,
    failedJobs: batch.failedJobs,
    metadata: batch.metadata,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
    progress: batch.totalJobs > 0 
      ? Math.round((batch.completedJobs / batch.totalJobs) * 100) 
      : 0,
    jobs: batch.jobs.map(job => ({
      id: job.id,
      batchId: job.batchId,
      website: job.website,
      infoTypes: job.infoTypes,
      status: job.status,
      companyId: job.companyId,
      scrapeId: job.scrapeId,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    }))
  };
};

export const updateBatchStatus = async (batchId, status) => {
  const validStatuses = ['pending', 'queued', 'processing', 'completed', 'failed'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  return await prisma.scrapeBatch.update({
    where: { id: batchId },
    data: { status, updatedAt: new Date() }
  });
};

export const incrementBatchCounters = async (batchId, field) => {
  const validFields = ['completedJobs', 'failedJobs'];
  if (!validFields.includes(field)) {
    throw new Error(`Invalid counter field: ${field}`);
  }

  return await prisma.scrapeBatch.update({
    where: { id: batchId },
    data: {
      [field]: { increment: 1 },
      updatedAt: new Date()
    }
  });
};

export const recalculateBatchStatus = async (batchId) => {
  const batch = await prisma.scrapeBatch.findUnique({
    where: { id: batchId },
    include: {
      jobs: {
        select: {
          status: true
        }
      }
    }
  });

  if (!batch) {
    return null;
  }

  const totalJobs = batch.totalJobs;
  const completedJobs = batch.jobs.filter(j => j.status === 'completed').length;
  const failedJobs = batch.jobs.filter(j => j.status === 'failed').length;
  const processingJobs = batch.jobs.filter(j => j.status === 'processing' || j.status === 'queued').length;

  let newStatus = batch.status;

  if (completedJobs + failedJobs === totalJobs) {
    // All jobs are done
    newStatus = failedJobs === totalJobs ? 'failed' : 'completed';
  } else if (processingJobs > 0 || completedJobs > 0 || failedJobs > 0) {
    // Some jobs are in progress
    newStatus = 'processing';
  }

  // Update counters and status
  await prisma.scrapeBatch.update({
    where: { id: batchId },
    data: {
      status: newStatus,
      completedJobs,
      failedJobs,
      updatedAt: new Date()
    }
  });

  return { status: newStatus, completedJobs, failedJobs };
};

export const deleteBatch = async (userId, batchId) => {
  const batch = await prisma.scrapeBatch.findFirst({
    where: {
      id: batchId,
      userId
    }
  });

  if (!batch) {
    return false;
  }

  // Only allow deletion of pending batches
  if (batch.status !== 'pending') {
    throw new Error('Can only delete pending batches');
  }

  await prisma.scrapeBatch.delete({
    where: { id: batchId }
  });

  return true;
};

