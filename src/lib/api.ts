import { API_BASE_URL } from "./config";

/**
 * Types d'erreurs API
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Fonction utilitaire pour effectuer des appels API avec gestion d'erreurs
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Log de débogage en développement
  if (import.meta.env.DEV) {
    console.log(`[API] Fetching: ${url}`);
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      // Ajouter les credentials pour les requêtes CORS si nécessaire
      credentials: 'omit', // 'omit' par défaut, peut être changé en 'include' si nécessaire
    });

    // Gestion des erreurs HTTP
    if (!response.ok) {
      let errorMessage = "Une erreur est survenue";
      
      switch (response.status) {
        case 404:
          errorMessage = "Ressource non trouvée";
          break;
        case 500:
          errorMessage = "Erreur serveur interne";
          break;
        case 503:
          errorMessage = "Service temporairement indisponible";
          break;
        case 400:
          errorMessage = "Requête invalide";
          break;
        case 401:
          errorMessage = "Non autorisé";
          break;
        case 403:
          errorMessage = "Accès interdit";
          break;
        default:
          errorMessage = `Erreur ${response.status}: ${response.statusText}`;
      }

      // Essayer de récupérer le message d'erreur du serveur
      try {
        const errorData = await response.json();
        if (errorData.detail || errorData.message) {
          errorMessage = errorData.detail || errorData.message;
        }
      } catch {
        // Si la réponse n'est pas du JSON, utiliser le message par défaut
      }

      if (import.meta.env.DEV) {
        console.error(`[API] Error ${response.status} on ${url}:`, errorMessage);
      }

      throw new ApiError(errorMessage, response.status, response.statusText);
    }

    const data = await response.json();
    
    if (import.meta.env.DEV) {
      console.log(`[API] Success on ${url}`);
    }
    
    return data;
  } catch (error) {
    // Gestion des erreurs réseau et CORS
    if (error instanceof TypeError) {
      // Détecter les erreurs CORS spécifiquement
      if (error.message.includes("Failed to fetch") || 
          error.message.includes("NetworkError") ||
          error.message.includes("fetch")) {
        
        const isCorsError = error.message.includes("CORS") || 
                          error.message.includes("Access-Control");
        
        if (import.meta.env.DEV) {
          console.error(`[API] Network error on ${url}:`, error.message);
          if (isCorsError) {
            console.error(`[API] CORS error detected. Check backend CORS configuration.`);
          }
        }
        
        throw new ApiError(
          isCorsError
            ? "Erreur CORS: Le serveur n'autorise pas les requêtes depuis cette origine. Vérifiez la configuration CORS du serveur."
            : `Impossible de se connecter au serveur (${API_BASE_URL}). Vérifiez votre connexion réseau et que le serveur est démarré.`,
          0,
          "Network Error"
        );
      }
    }
    
    // Si c'est déjà une ApiError, la relancer
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Erreur inconnue
    if (import.meta.env.DEV) {
      console.error(`[API] Unknown error on ${url}:`, error);
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : "Erreur inconnue",
      0,
      "Unknown Error"
    );
  }
}

