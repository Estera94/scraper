import api from './auth.js';

/**
 * Helper function to download file from blob
 */
const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Build query string from filters
 */
const buildQueryString = (filters, format) => {
  const params = new URLSearchParams();
  
  if (format) {
    params.append('format', format);
  }
  
  if (filters.startDate) {
    params.append('startDate', filters.startDate);
  }
  
  if (filters.endDate) {
    params.append('endDate', filters.endDate);
  }
  
  if (filters.companyIds && filters.companyIds.length > 0) {
    params.append('companyIds', filters.companyIds.join(','));
  }
  
  if (filters.dataTypes && filters.dataTypes.length > 0) {
    params.append('dataTypes', filters.dataTypes.join(','));
  }
  
  return params.toString();
};

/**
 * Export companies and LinkedIn data
 */
export const exportCompanies = async (filters = {}, format = 'csv') => {
  try {
    const queryString = buildQueryString(filters, format);
    const response = await api.get(`/reports/companies?${queryString}`, {
      responseType: 'blob'
    });
    
    const contentType = response.headers['content-type'];
    const blob = new Blob([response.data], { type: contentType });
    
    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = `companies-export-${Date.now()}.${format}`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    downloadFile(blob, filename);
    return { success: true };
  } catch (error) {
    console.error('Error exporting companies:', error);
    throw error;
  }
};

/**
 * Export key contacts data
 */
export const exportContacts = async (filters = {}, format = 'csv') => {
  try {
    const queryString = buildQueryString(filters, format);
    const response = await api.get(`/reports/contacts?${queryString}`, {
      responseType: 'blob'
    });
    
    const contentType = response.headers['content-type'];
    const blob = new Blob([response.data], { type: contentType });
    
    const contentDisposition = response.headers['content-disposition'];
    let filename = `contacts-export-${Date.now()}.${format}`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    downloadFile(blob, filename);
    return { success: true };
  } catch (error) {
    console.error('Error exporting contacts:', error);
    throw error;
  }
};

/**
 * Export scrape history data
 */
export const exportScrapes = async (filters = {}, format = 'csv') => {
  try {
    const queryString = buildQueryString(filters, format);
    const response = await api.get(`/reports/scrapes?${queryString}`, {
      responseType: 'blob'
    });
    
    const contentType = response.headers['content-type'];
    const blob = new Blob([response.data], { type: contentType });
    
    const contentDisposition = response.headers['content-disposition'];
    let filename = `scrapes-export-${Date.now()}.${format}`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    downloadFile(blob, filename);
    return { success: true };
  } catch (error) {
    console.error('Error exporting scrapes:', error);
    throw error;
  }
};

/**
 * Export all data (combined)
 */
export const exportAll = async (filters = {}, format = 'json') => {
  try {
    const queryString = buildQueryString(filters, format);
    const response = await api.get(`/reports/all?${queryString}`, {
      responseType: 'blob'
    });
    
    const contentType = response.headers['content-type'];
    const blob = new Blob([response.data], { type: contentType });
    
    const contentDisposition = response.headers['content-disposition'];
    let filename = `all-data-export-${Date.now()}.${format}`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    downloadFile(blob, filename);
    return { success: true };
  } catch (error) {
    console.error('Error exporting all data:', error);
    throw error;
  }
};


