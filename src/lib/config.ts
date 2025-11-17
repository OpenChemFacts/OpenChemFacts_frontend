/**
 * Configuration de l'API Railway
 * L'URL peut être définie via la variable d'environnement VITE_API_BASE_URL
 * ou utilise l'URL par défaut de l'API Railway
 */
export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  'https://api-production-e40f.up.railway.app';

export const API_ENDPOINTS = {
  ROOT: '/',
  CAS_LIST: '/api/cas-list',
  CHEMICAL_INFO: (cas: string) => `/api/chemical-info/${cas}`,
  SSD_PLOT: (cas: string) => `/api/ssd-plot/${cas}`,
  EC10EQ_PLOT: (cas: string) => `/api/ec10eq-plot/${cas}`,
  COMPARISON_PLOT: '/api/comparison-plot',
  STATS: '/api/stats',
};

