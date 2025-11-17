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
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
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

      throw new ApiError(errorMessage, response.status, response.statusText);
    }

    return await response.json();
  } catch (error) {
    // Gestion des erreurs réseau
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError(
        "Impossible de se connecter au serveur. Vérifiez votre connexion réseau.",
        0,
        "Network Error"
      );
    }
    
    // Si c'est déjà une ApiError, la relancer
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Erreur inconnue
    throw new ApiError(
      error instanceof Error ? error.message : "Erreur inconnue",
      0,
      "Unknown Error"
    );
  }
}

