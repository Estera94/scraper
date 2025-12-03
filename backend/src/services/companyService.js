import prisma from '../db/prisma.js';
import { normalizeDomain } from '../utils/domains.js';

const DEFAULT_TOOL = 'web_scraper';

const buildSnapshotPayload = ({ website, infoTypes = [], results, tool = DEFAULT_TOOL }) => ({
  tool,
  scrapedAt: new Date().toISOString(),
  website,
  infoTypes,
  results
});

export const upsertCompanyWithScrape = async ({ userId, website, infoTypes = [], results, tool = DEFAULT_TOOL }) => {
  const domain = normalizeDomain(website);

  if (!domain) {
    throw new Error('Unable to determine domain from website input.');
  }

  const snapshot = buildSnapshotPayload({ website, infoTypes, results, tool });

  const company = await prisma.company.upsert({
    where: {
      userId_domain: {
        userId,
        domain
      }
    },
    update: {
      latestSnapshot: snapshot
    },
    create: {
      userId,
      domain,
      displayName: domain,
      latestSnapshot: snapshot
    }
  });

  const scrape = await prisma.companyScrape.create({
    data: {
      companyId: company.id,
      tool,
      infoTypes,
      results,
      metadata: {
        website,
        infoTypes,
        scrapedAt: snapshot.scrapedAt
      }
    }
  });

  return { company, scrape };
};

export const listUserCompanies = async (userId, filters = {}) => {
  const where = {
    userId
  };

  // Search filter (domain or displayName)
  if (filters.search && filters.search.trim()) {
    const searchTerm = filters.search.trim();
    where.OR = [
      { domain: { contains: searchTerm, mode: 'insensitive' } },
      { displayName: { contains: searchTerm, mode: 'insensitive' } }
    ];
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

  // Has LinkedIn filter
  if (filters.hasLinkedIn !== undefined && filters.hasLinkedIn !== null) {
    if (filters.hasLinkedIn === true || filters.hasLinkedIn === 'true') {
      where.linkedin = { isNot: null };
    } else if (filters.hasLinkedIn === false || filters.hasLinkedIn === 'false') {
      where.linkedin = { is: null };
    }
  }

  // Has Contacts filter (requires checking LinkedIn profile)
  let hasContactsFilter = null;
  if (filters.hasContacts !== undefined && filters.hasContacts !== null) {
    hasContactsFilter = filters.hasContacts === true || filters.hasContacts === 'true';
  }

  // Data types filter (check latestSnapshot)
  if (filters.dataTypes && Array.isArray(filters.dataTypes) && filters.dataTypes.length > 0) {
    // We'll filter this in JavaScript after fetching since Prisma JSON filtering is limited
    // For now, we'll fetch all and filter in memory, or use a more complex query
  }

  // Build sort order
  const sortBy = filters.sortBy || 'updatedAt';
  const sortOrder = filters.sortOrder || 'desc';
  const orderBy = {};
  orderBy[sortBy] = sortOrder;

  // Fetch companies with LinkedIn data
  const companies = await prisma.company.findMany({
    where,
    orderBy,
    include: {
      linkedin: {
        include: {
          contacts: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });

  // Filter by hasContacts if specified
  let filteredCompanies = companies;
  if (hasContactsFilter !== null) {
    filteredCompanies = companies.filter(company => {
      const contactCount = company.linkedin?.contacts?.length || 0;
      return hasContactsFilter ? contactCount > 0 : contactCount === 0;
    });
  }

  // Filter by data types if specified
  if (filters.dataTypes && Array.isArray(filters.dataTypes) && filters.dataTypes.length > 0) {
    filteredCompanies = filteredCompanies.filter(company => {
      const snapshot = company.latestSnapshot || {};
      const results = snapshot.results || {};
      return filters.dataTypes.every(dataType => {
        const value = results[dataType];
        return value !== null && value !== undefined && value !== '';
      });
    });
  }

  // Format response with additional metadata
  return filteredCompanies.map(company => {
    const snapshot = company.latestSnapshot || {};
    const results = snapshot.results || {};
    const contactCount = company.linkedin?.contacts?.length || 0;

    // Determine which data types are present
    const dataTypesFound = [];
    if (results.linkedin) dataTypesFound.push('linkedin');
    if (results.email) dataTypesFound.push('email');
    if (results.phone) dataTypesFound.push('phone');
    if (results.twitter) dataTypesFound.push('twitter');
    if (results.whmcs !== undefined) dataTypesFound.push('whmcs');

    return {
      id: company.id,
      userId: company.userId,
      domain: company.domain,
      displayName: company.displayName,
      status: company.status,
      latestSnapshot: company.latestSnapshot,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      hasLinkedIn: !!company.linkedin,
      contactCount: contactCount,
      dataTypesFound: dataTypesFound
    };
  });
};

export const getCompanyWithHistory = async ({ userId, companyId, limit = 20, cursor }) => {
  const company = await prisma.company.findFirst({
    where: { id: companyId, userId }
  });

  if (!company) {
    return null;
  }

  const take = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const scrapes = await prisma.companyScrape.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
  });

  let nextCursor = null;
  let history = scrapes;

  if (scrapes.length > take) {
    const nextItem = scrapes.pop();
    nextCursor = nextItem.id;
    history = scrapes;
  }

  return {
    company,
    scrapes: history,
    nextCursor
  };
};

export const deleteCompanyForUser = async (userId, companyId) => {
  const company = await prisma.company.findFirst({
    where: { id: companyId, userId }
  });

  if (!company) {
    return false;
  }

  await prisma.company.delete({
    where: { id: companyId }
  });

  return true;
};

export const deleteAllCompaniesForUser = async (userId) => {
  await prisma.company.deleteMany({
    where: { userId }
  });
};

export const deleteCompanyScrapeForUser = async (userId, scrapeId) => {
  const scrape = await prisma.companyScrape.findUnique({
    where: { id: scrapeId },
    include: { company: true }
  });

  if (!scrape || scrape.company.userId !== userId) {
    return false;
  }

  await prisma.companyScrape.delete({
    where: { id: scrapeId }
  });

  return true;
};

export const getCompanyForUser = async (userId, companyId) => {
  return prisma.company.findFirst({
    where: { id: companyId, userId }
  });
};

