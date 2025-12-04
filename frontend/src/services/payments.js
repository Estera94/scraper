import api from './auth.js';

export const createCheckout = async (packageId) => {
  const response = await api.post('/payments/create-checkout', { packageId });
  return response.data;
};

export const getPaymentHistory = async () => {
  const response = await api.get('/payments/history');
  return response.data;
};

export const getCreditPackages = async () => {
  const response = await api.get('/payments/packages');
  return response.data;
};



