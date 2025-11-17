/**
 * Configuration de l'API Scalingo
 * L'URL peut être définie via la variable d'environnement VITE_API_BASE_URL
 * ou utilise l'URL par défaut selon l'environnement :
 * - Développement local : http://localhost:8000
 * - Production : https://openchemfacts-api.osc-fr1.scalingo.io
 */
export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV 
    ? 'http://localhost:8000' 
    : 'https://openchemfacts-api.osc-fr1.scalingo.io');

export const API_ENDPOINTS = {
  ROOT: '/',
  HEALTH: '/health',
  SUMMARY: '/api/summary',
  BY_COLUMN: (column: string) => `/api/by_column?column=${encodeURIComponent(column)}`,
  CAS_LIST: '/api/cas/list',
  SSD_PLOT: (cas: string) => `/api/plot/ssd/${cas}`,
  EC10EQ_PLOT: (cas: string) => `/api/plot/ec10eq/${cas}`,
  SSD_COMPARISON: '/api/plot/ssd/comparison',
};

