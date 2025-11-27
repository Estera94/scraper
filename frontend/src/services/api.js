import api from './auth.js';

export const scrapeWebsites = async (websites, infoTypes) => {
  const response = await api.post('/scrape', { websites, infoTypes });
  return response.data;
};

export const getResults = async () => {
  const response = await api.get('/results');
  return response.data;
};

export const deleteResult = async (id) => {
  const response = await api.delete(`/results/${id}`);
  return response.data;
};

export const deleteAllResults = async () => {
  const response = await api.delete('/results');
  return response.data;
};

export default api;

