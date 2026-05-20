import axios from 'axios';
import logger from '../config/logger.js';

const client = axios.create({
  // PYTHON_API_URL is the Railway variable name; PYTHON_ENGINE_URL is the docker-compose name
  baseURL: process.env.PYTHON_API_URL || process.env.PYTHON_ENGINE_URL || 'http://localhost:8000',
  timeout: 30000,
});

export const triggerRiskCalculation = async (userId) => {
  const { data } = await client.post('/risk/calculate', { user_id: String(userId) });
  logger.info({ userId, riskLevel: data?.data?.risk_level }, 'Risk calculation completed');
  return data;
};

export const triggerBaselineCalculation = async (userId) => {
  const { data } = await client.post('/baseline/calculate', { user_id: String(userId) });
  return data;
};
