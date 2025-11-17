/**
 * Configuration de l'API Scalingo
 * L'URL peut être définie via la variable d'environnement VITE_API_BASE_URL
 * ou utilise l'URL par défaut selon l'environnement :
 * - Développement local : http://localhost:8000
 * - Production : https://openchemfacts-api.osc-fr1.scalingo.io
 */
export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
<<<<<<< HEAD
  (import.meta.env.DEV 
    ? 'http://localhost:8000' 
    : 'https://openchemfacts-api.osc-fr1.scalingo.io');
=======
  'https://api-production-e40f.up.railway.app';
>>>>>>> e672ce84622af95aa3197eb66a09314d1b544977

export const API_ENDPOINTS = {
  ROOT: '/',
  CAS_LIST: '/api/cas-list',
  CHEMICAL_INFO: (cas: string) => `/api/chemical-info/${cas}`,
  SSD_PLOT: (cas: string) => `/api/ssd-plot/${cas}`,
  EC10EQ_PLOT: (cas: string) => `/api/ec10eq-plot/${cas}`,
  COMPARISON_PLOT: '/api/comparison-plot',
  STATS: '/api/stats',
};

