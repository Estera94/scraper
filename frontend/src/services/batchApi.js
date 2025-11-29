import api from './auth.js';

export const createBatch = async (websites, infoTypes) => {
  const response = await api.post('/batches', { websites, infoTypes });
  return response.data;
};

export const getBatches = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.status) {
    params.append('status', filters.status);
  }
  
  if (filters.startDate) {
    params.append('startDate', filters.startDate);
  }
  
  if (filters.endDate) {
    params.append('endDate', filters.endDate);
  }
  
  if (filters.sortBy) {
    params.append('sortBy', filters.sortBy);
  }
  
  if (filters.sortOrder) {
    params.append('sortOrder', filters.sortOrder);
  }
  
  const queryString = params.toString();
  const url = queryString ? `/batches?${queryString}` : '/batches';
  const response = await api.get(url);
  return response.data;
};

export const getBatch = async (batchId) => {
  const response = await api.get(`/batches/${batchId}`);
  return response.data;
};

export const deleteBatch = async (batchId) => {
  const response = await api.delete(`/batches/${batchId}`);
  return response.data;
};

