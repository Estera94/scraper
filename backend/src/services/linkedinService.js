import prisma from '../db/prisma.js';
import { LinkedInScraper, normalizeLinkedInCompanyInput } from './linkedinScraper.js';

const scraper = new LinkedInScraper();

const resolveCompanyLinkedInUrl = (company, explicitUrl) => {
  if (explicitUrl) {
    return explicitUrl;
  }

  const snapshot = company?.latestSnapshot || {};
  const candidates = [
    snapshot?.results?.linkedin,
    snapshot?.linkedin,
    snapshot?.results?.social?.linkedin,
    snapshot?.results?.socialLinks?.linkedin,
    snapshot?.results?.linkedinUrl,
    snapshot?.results?.profile?.linkedin,
    snapshot?.results?.company?.linkedin
  ].filter(Boolean);

  return candidates[0] || null;
};

export const scrapeLinkedInForCompany = async ({ company, linkedinUrl }) => {
  const targetUrl = resolveCompanyLinkedInUrl(company, linkedinUrl);
  if (!targetUrl) {
    throw new Error('Company does not have a LinkedIn URL. Please add one before scraping LinkedIn data.');
  }

  const payload = await scraper.scrapeCompany(normalizeLinkedInCompanyInput(targetUrl));
  const profile = await saveLinkedInProfile(company.id, payload.company);
  const contacts = await saveLinkedInContacts(profile.id, payload.contacts);

  return { profile, contacts };
};

export const saveLinkedInProfile = async (companyId, data) => {
  return prisma.linkedInProfile.upsert({
    where: { companyId },
    update: {
      companyUrl: data.companyUrl,
      headline: data.headline,
      description: data.description,
      industry: data.industry,
      followerCount: data.followerCount,
      employeeCountMin: data.employeeCountMin,
      employeeCountMax: data.employeeCountMax,
      headquarters: data.headquarters,
      website: data.website,
      logoUrl: data.logoUrl,
      lastScrapedAt: data.lastScrapedAt ? new Date(data.lastScrapedAt) : new Date(),
      updatedAt: new Date()
    },
    create: {
      companyId,
      companyUrl: data.companyUrl,
      headline: data.headline,
      description: data.description,
      industry: data.industry,
      followerCount: data.followerCount,
      employeeCountMin: data.employeeCountMin,
      employeeCountMax: data.employeeCountMax,
      headquarters: data.headquarters,
      website: data.website,
      logoUrl: data.logoUrl,
      lastScrapedAt: data.lastScrapedAt ? new Date(data.lastScrapedAt) : new Date()
    }
  });
};

export const saveLinkedInContacts = async (profileId, contacts = []) => {
  await prisma.linkedInContact.deleteMany({
    where: { linkedinProfileId: profileId }
  });

  if (!contacts.length) {
    return [];
  }

  await prisma.linkedInContact.createMany({
    data: contacts.map(contact => ({
      linkedinProfileId: profileId,
      fullName: contact.fullName,
      title: contact.title,
      location: contact.location,
      email: contact.email,
      emailStatus: contact.emailStatus,
      linkedinUrl: contact.linkedinUrl,
      connectionDegree: contact.connectionDegree,
      metadata: contact.metadata || null,
      scrapedAt: contact.scrapedAt ? new Date(contact.scrapedAt) : new Date()
    }))
  });

  return prisma.linkedInContact.findMany({
    where: { linkedinProfileId: profileId },
    orderBy: { fullName: 'asc' }
  });
};

export const getLinkedInProfileForCompany = (companyId) => {
  return prisma.linkedInProfile.findUnique({
    where: { companyId },
    include: {
      contacts: {
        orderBy: { fullName: 'asc' }
      }
    }
  });
};

export const getLinkedInDataWithContacts = async (companyId, { limit = 25, cursor } = {}) => {
  const profile = await prisma.linkedInProfile.findUnique({
    where: { companyId }
  });

  if (!profile) {
    return { profile: null, contacts: [], nextCursor: null };
  }

  const take = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const contacts = await prisma.linkedInContact.findMany({
    where: { linkedinProfileId: profile.id },
    orderBy: { fullName: 'asc' },
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
  });

  let nextCursor = null;
  if (contacts.length > take) {
    const last = contacts.pop();
    nextCursor = last.id;
  }

  return {
    profile,
    contacts,
    nextCursor
  };
};

export const deleteLinkedInProfileForCompany = async (companyId) => {
  const existing = await prisma.linkedInProfile.findUnique({
    where: { companyId }
  });

  if (!existing) {
    return false;
  }

  await prisma.linkedInProfile.delete({
    where: { companyId }
  });

  return true;
};

export const deleteLinkedInContactForUser = async (userId, contactId) => {
  const contact = await prisma.linkedInContact.findUnique({
    where: { id: contactId },
    include: {
      profile: {
        include: {
          company: true
        }
      }
    }
  });

  if (!contact || contact.profile.company.userId !== userId) {
    return false;
  }

  await prisma.linkedInContact.delete({
    where: { id: contactId }
  });

  return true;
};

export const createLinkedInContactForCompany = async (userId, companyId, contactData) => {
  // Verify company belongs to user
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      userId: userId
    }
  });

  if (!company) {
    throw new Error('Company not found or access denied');
  }

  // Get or create LinkedIn profile for the company
  let profile = await prisma.linkedInProfile.findUnique({
    where: { companyId }
  });

  if (!profile) {
    // Create a minimal LinkedIn profile if it doesn't exist
    profile = await prisma.linkedInProfile.create({
      data: {
        companyId,
        companyUrl: null,
        lastScrapedAt: new Date()
      }
    });
  }

  // Create the contact
  const contact = await prisma.linkedInContact.create({
    data: {
      linkedinProfileId: profile.id,
      fullName: contactData.fullName || null,
      title: contactData.title || null,
      location: contactData.location || null,
      email: contactData.email || null,
      emailStatus: contactData.emailStatus || null,
      linkedinUrl: contactData.linkedinUrl || null,
      connectionDegree: contactData.connectionDegree || null,
      metadata: contactData.metadata || null,
      scrapedAt: new Date()
    }
  });

  return contact;
};

process.on('SIGINT', async () => {
  await scraper.close();
});

process.on('SIGTERM', async () => {
  await scraper.close();
});

