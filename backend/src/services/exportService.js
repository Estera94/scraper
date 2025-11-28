import prisma from '../db/prisma.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

/**
 * Parse filters from query parameters
 */
const parseFilters = (query) => {
  const filters = {
    startDate: query.startDate ? new Date(query.startDate) : null,
    endDate: query.endDate ? new Date(query.endDate) : null,
    companyIds: query.companyIds ? query.companyIds.split(',').filter(Boolean) : null,
    dataTypes: query.dataTypes ? query.dataTypes.split(',').filter(Boolean) : null
  };

  return filters;
};

/**
 * Build where clause for date filtering
 */
const buildDateFilter = (startDate, endDate) => {
  const where = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }
  return where;
};

/**
 * Get company and LinkedIn export data
 */
export const getCompanyLinkedInExport = async (userId, filters = {}) => {
  const where = {
    userId,
    ...(filters.companyIds ? { id: { in: filters.companyIds } } : {}),
    ...buildDateFilter(filters.startDate, filters.endDate)
  };

  const companies = await prisma.company.findMany({
    where,
    include: {
      linkedin: true
    },
    orderBy: { updatedAt: 'desc' }
  });

  return companies.map(company => {
    const snapshot = company.latestSnapshot || {};
    const results = snapshot.results || {};
    
    // Filter by data types if specified
    let filteredResults = results;
    if (filters.dataTypes && filters.dataTypes.length > 0) {
      filteredResults = {};
      filters.dataTypes.forEach(type => {
        if (results[type] !== undefined) {
          filteredResults[type] = results[type];
        }
      });
    }

    return {
      companyId: company.id,
      domain: company.domain,
      displayName: company.displayName || '',
      companyCreatedAt: company.createdAt ? new Date(company.createdAt).toISOString() : null,
      companyUpdatedAt: company.updatedAt ? new Date(company.updatedAt).toISOString() : null,
      // LinkedIn Profile Data
      linkedinCompanyUrl: company.linkedin?.companyUrl || null,
      linkedinHeadline: company.linkedin?.headline || null,
      linkedinDescription: company.linkedin?.description || null,
      linkedinIndustry: company.linkedin?.industry || null,
      linkedinFollowerCount: company.linkedin?.followerCount ?? null,
      linkedinEmployeeCountMin: company.linkedin?.employeeCountMin ?? null,
      linkedinEmployeeCountMax: company.linkedin?.employeeCountMax ?? null,
      linkedinHeadquarters: company.linkedin?.headquarters ? JSON.stringify(company.linkedin.headquarters) : null,
      linkedinWebsite: company.linkedin?.website || null,
      linkedinLogoUrl: company.linkedin?.logoUrl || null,
      linkedinLastScrapedAt: company.linkedin?.lastScrapedAt ? new Date(company.linkedin.lastScrapedAt).toISOString() : null,
      // Latest Snapshot Data
      snapshotLinkedin: filteredResults.linkedin || null,
      snapshotEmail: filteredResults.email || null,
      snapshotTwitter: filteredResults.twitter || null,
      snapshotPhone: filteredResults.phone || null,
      snapshotWhmcs: filteredResults.whmcs !== undefined ? (filteredResults.whmcs ? 'true' : 'false') : null,
      snapshotCustomKeywords: filteredResults.customKeywords ? JSON.stringify(filteredResults.customKeywords) : null,
      snapshotScrapedAt: snapshot.scrapedAt ? (typeof snapshot.scrapedAt === 'string' ? snapshot.scrapedAt : new Date(snapshot.scrapedAt).toISOString()) : null,
      snapshotInfoTypes: snapshot.infoTypes ? JSON.stringify(snapshot.infoTypes) : null
    };
  });
};

/**
 * Get contacts export data
 */
export const getContactsExport = async (userId, filters = {}) => {
  const companyWhere = {
    userId,
    ...(filters.companyIds ? { id: { in: filters.companyIds } } : {})
  };

  const companies = await prisma.company.findMany({
    where: companyWhere,
    include: {
      linkedin: {
        include: {
          contacts: {
            where: buildDateFilter(filters.startDate, filters.endDate),
            orderBy: { fullName: 'asc' }
          }
        }
      }
    }
  });

  const contacts = [];
  companies.forEach(company => {
    if (company.linkedin && company.linkedin.contacts) {
      company.linkedin.contacts.forEach(contact => {
        contacts.push({
          contactId: contact.id,
          fullName: contact.fullName || null,
          title: contact.title || null,
          location: contact.location || null,
          email: contact.email || null,
          emailStatus: contact.emailStatus || null,
          linkedinUrl: contact.linkedinUrl || null,
          connectionDegree: contact.connectionDegree || null,
          scrapedAt: contact.scrapedAt ? new Date(contact.scrapedAt).toISOString() : null,
          contactCreatedAt: contact.createdAt ? new Date(contact.createdAt).toISOString() : null,
          // Company context
          companyDomain: company.domain,
          companyDisplayName: company.displayName || '',
          companyId: company.id
        });
      });
    }
  });

  return contacts;
};

/**
 * Get scrape history export data
 */
export const getScrapeHistoryExport = async (userId, filters = {}) => {
  const companyWhere = {
    userId,
    ...(filters.companyIds ? { id: { in: filters.companyIds } } : {})
  };

  const scrapes = await prisma.companyScrape.findMany({
    where: {
      company: companyWhere,
      ...buildDateFilter(filters.startDate, filters.endDate)
    },
    include: {
      company: {
        select: {
          id: true,
          domain: true,
          displayName: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return scrapes.map(scrape => {
    const results = scrape.results || {};
    
    // Filter by data types if specified
    let filteredResults = results;
    if (filters.dataTypes && filters.dataTypes.length > 0) {
      filteredResults = {};
      filters.dataTypes.forEach(type => {
        if (results[type] !== undefined) {
          filteredResults[type] = results[type];
        }
      });
    }

    return {
      scrapeId: scrape.id,
      companyId: scrape.companyId,
      companyDomain: scrape.company.domain,
      companyDisplayName: scrape.company.displayName || '',
      tool: scrape.tool,
      infoTypes: scrape.infoTypes ? JSON.stringify(scrape.infoTypes) : null,
      results: JSON.stringify(filteredResults),
      metadata: scrape.metadata ? JSON.stringify(scrape.metadata) : null,
      createdAt: scrape.createdAt ? new Date(scrape.createdAt).toISOString() : null
    };
  });
};

/**
 * Get all data export (combined)
 */
export const getAllDataExport = async (userId, filters = {}) => {
  const [companies, contacts, scrapes] = await Promise.all([
    getCompanyLinkedInExport(userId, filters),
    getContactsExport(userId, filters),
    getScrapeHistoryExport(userId, filters)
  ]);

  return {
    companies,
    contacts,
    scrapes,
    summary: {
      totalCompanies: companies.length,
      totalContacts: contacts.length,
      totalScrapes: scrapes.length,
      exportDate: new Date().toISOString()
    }
  };
};

/**
 * Format a value for CSV export
 */
const formatCSVValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  
  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  // Handle boolean values
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  // Handle numbers
  if (typeof value === 'number') {
    return String(value);
  }
  
  // Handle objects/arrays (should already be stringified)
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  const str = String(value);
  
  // Escape if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
};

/**
 * Convert data to CSV format
 */
export const toCSV = (data, headers) => {
  if (!data || data.length === 0) {
    return headers.map(formatCSVValue).join(',') + '\n';
  }

  const csvRows = [headers.map(formatCSVValue).join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      return formatCSVValue(value);
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};

/**
 * Convert data to JSON format
 */
export const toJSON = (data) => {
  return JSON.stringify(data, null, 2);
};

/**
 * Convert data to Excel format
 */
export const toExcel = async (data, headers, sheetName = 'Export') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Add headers
  worksheet.addRow(headers);
  
  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data rows
  if (data && data.length > 0) {
    data.forEach(row => {
      const values = headers.map(header => row[header] || '');
      worksheet.addRow(values);
    });
  }

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value ? String(cell.value) : '';
      if (cellValue.length > maxLength) {
        maxLength = cellValue.length;
      }
    });
    column.width = Math.min(Math.max(maxLength + 2, 10), 50);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Convert data to PDF format
 */
export const toPDF = async (data, headers, title = 'Export Report') => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add title
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();

      // Add date
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      if (!data || data.length === 0) {
        doc.fontSize(12).text('No data available', { align: 'center' });
        doc.end();
        return;
      }

      // Calculate column widths
      const pageWidth = doc.page.width - 100;
      const colCount = headers.length;
      const colWidth = pageWidth / colCount;

      // Add headers
      doc.fontSize(10).font('Helvetica-Bold');
      let x = 50;
      headers.forEach((header, index) => {
        doc.text(header.substring(0, 20), x, doc.y, { width: colWidth - 10, align: 'left' });
        x += colWidth;
      });
      doc.moveDown();

      // Add data rows
      doc.font('Helvetica').fontSize(8);
      data.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (doc.y > doc.page.height - 50) {
          doc.addPage();
          // Re-add headers on new page
          doc.font('Helvetica-Bold').fontSize(10);
          x = 50;
          headers.forEach(header => {
            doc.text(header.substring(0, 20), x, doc.y, { width: colWidth - 10, align: 'left' });
            x += colWidth;
          });
          doc.moveDown();
          doc.font('Helvetica').fontSize(8);
        }

        x = 50;
        headers.forEach((header, index) => {
          const value = row[header];
          const text = value !== null && value !== undefined ? String(value).substring(0, 30) : '';
          doc.text(text, x, doc.y, { width: colWidth - 10, align: 'left' });
          x += colWidth;
        });
        doc.moveDown();
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Main export function that handles format conversion
 */
export const exportData = async (data, format, headers, title = 'Export') => {
  switch (format.toLowerCase()) {
    case 'csv':
      return {
        content: toCSV(data, headers),
        contentType: 'text/csv',
        extension: 'csv'
      };
    
    case 'json':
      return {
        content: toJSON(data),
        contentType: 'application/json',
        extension: 'json'
      };
    
    case 'xlsx':
      const excelBuffer = await toExcel(data, headers, title);
      return {
        content: excelBuffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx'
      };
    
    case 'pdf':
      const pdfBuffer = await toPDF(data, headers, title);
      return {
        content: pdfBuffer,
        contentType: 'application/pdf',
        extension: 'pdf'
      };
    
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};

export { parseFilters };

