import prisma from '../db/prisma.js';
import { dedupeWebsitesByDomain } from '../utils/domains.js';

export const createScrapeJobs = async (batchId, websites, infoTypes) => {
  const normalizedTargets = dedupeWebsitesByDomain(websites);
  const normalizedInfoTypes = Array.isArray(infoTypes) ? infoTypes : [];

  if (normalizedTargets.length === 0) {
    throw new Error('At least one website is required.');
  }

  const jobs = await Promise.all(
    normalizedTargets.map(target =>
      prisma.scrapeJob.create({
        data: {
          batchId,
          website: target.website,
          infoTypes: normalizedInfoTypes,
          status: 'pending'
        }
      })
    )
  );

  return jobs;
};

export const getPendingJobs = async (limit = 5) => {
  const jobs = await prisma.scrapeJob.findMany({
    where: {
      status: 'pending'
    },
    take: limit,
    orderBy: {
      createdAt: 'asc'
    },
    include: {
      batch: {
        select: {
          userId: true,
          status: true
        }
      }
    }
  });

  return jobs;
};

export const markJobAsQueued = async (jobId) => {
  return await prisma.scrapeJob.update({
    where: { id: jobId },
    data: {
      status: 'queued',
      updatedAt: new Date()
    }
  });
};

export const markJobAsProcessing = async (jobId) => {
  return await prisma.scrapeJob.update({
    where: { id: jobId },
    data: {
      status: 'processing',
      updatedAt: new Date()
    }
  });
};

export const updateJobStatus = async (jobId, status, data = {}) => {
  const validStatuses = ['pending', 'queued', 'processing', 'completed', 'failed'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const updateData = {
    status,
    updatedAt: new Date(),
    ...data
  };

  return await prisma.scrapeJob.update({
    where: { id: jobId },
    data: updateData
  });
};

export const getJobById = async (jobId) => {
  return await prisma.scrapeJob.findUnique({
    where: { id: jobId },
    include: {
      batch: {
        select: {
          userId: true,
          status: true
        }
      }
    }
  });
};

