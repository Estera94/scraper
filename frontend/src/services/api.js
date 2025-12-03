import api from './auth.js';

export const scrapeWebsites = async (websites, infoTypes) => {
  const response = await api.post('/scrape', { websites, infoTypes });
  return response.data;
};

export const getCompanies = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.search) {
    params.append('search', filters.search);
  }
  
  if (filters.startDate) {
    params.append('startDate', filters.startDate);
  }
  
  if (filters.endDate) {
    params.append('endDate', filters.endDate);
  }
  
  if (filters.hasLinkedIn !== undefined && filters.hasLinkedIn !== null) {
    params.append('hasLinkedIn', filters.hasLinkedIn);
  }
  
  if (filters.hasContacts !== undefined && filters.hasContacts !== null) {
    params.append('hasContacts', filters.hasContacts);
  }
  
  if (filters.dataTypes && filters.dataTypes.length > 0) {
    params.append('dataTypes', filters.dataTypes.join(','));
  }
  
  if (filters.sortBy) {
    params.append('sortBy', filters.sortBy);
  }
  
  if (filters.sortOrder) {
    params.append('sortOrder', filters.sortOrder);
  }
  
  const queryString = params.toString();
  const url = queryString ? `/companies?${queryString}` : '/companies';
  const response = await api.get(url);
  return response.data;
};

export const getCompanyProfile = async (id, params = {}) => {
  const response = await api.get(`/companies/${id}`, { params });
  return response.data;
};

export const rescrapeCompany = async (id, payload) => {
  const response = await api.post(`/companies/${id}/scrape`, payload);
  return response.data;
};

export const deleteCompany = async (id) => {
  const response = await api.delete(`/companies/${id}`);
  return response.data;
};

export const deleteAllCompanies = async () => {
  const response = await api.delete('/companies');
  return response.data;
};

export const deleteCompanyScrape = async (id) => {
  const response = await api.delete(`/company-scrapes/${id}`);
  return response.data;
};

export const getCompanyLinkedIn = async (id, params = {}) => {
  const response = await api.get(`/companies/${id}/linkedin`, { params });
  return response.data;
};

export const scrapeCompanyLinkedIn = async (id, payload = {}) => {
  const response = await api.post(`/companies/${id}/linkedin-scrape`, payload);
  return response.data;
};

export const deleteCompanyLinkedIn = async (id) => {
  const response = await api.delete(`/companies/${id}/linkedin`);
  return response.data;
};

export const createLinkedInContact = async (companyId, contactData) => {
  const response = await api.post(`/companies/${companyId}/linkedin-contacts`, contactData);
  return response.data;
};

export const deleteLinkedInContact = async (id) => {
  const response = await api.delete(`/linkedin-contacts/${id}`);
  return response.data;
};

export const getCompanyNotes = async (id) => {
  const response = await api.get(`/companies/${id}/notes`);
  return response.data;
};

export const createCompanyNote = async (id, payload) => {
  const response = await api.post(`/companies/${id}/notes`, payload);
  return response.data;
};

export const deleteCompanyNote = async (id) => {
  const response = await api.delete(`/company-notes/${id}`);
  return response.data;
};

export const updateCompanyStatus = async (id, status) => {
  const response = await api.patch(`/companies/${id}/status`, { status });
  return response.data;
};

export const getCustomStatuses = async () => {
  const response = await api.get('/custom-statuses');
  return response.data;
};

export const createCustomStatus = async (label, color) => {
  const response = await api.post('/custom-statuses', { label, color });
  return response.data;
};

export const deleteCustomStatus = async (id) => {
  const response = await api.delete(`/custom-statuses/${id}`);
  return response.data;
};

export default api;

