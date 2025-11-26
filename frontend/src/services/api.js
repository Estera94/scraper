import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const scrapeWebsites = async (websites, infoTypes) => {
  const response = await api.post('/scrape', { websites, infoTypes });
  return response.data;
};

export const getResults = async () => {
  const response = await api.get('/results');
  return response.data;
};

export const saveResults = async (results) => {
  const response = await api.post('/save', { results });
  return response.data;
};

export const deleteResult = async (index) => {
  const response = await api.delete(`/results/${index}`);
  return response.data;
};

export const deleteAllResults = async () => {
  const response = await api.delete('/results');
  return response.data;
};

export default api;

