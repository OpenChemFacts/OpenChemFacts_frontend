import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Activity } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch, ApiError } from "@/lib/api";
import { normalizeCas } from "@/lib/cas-utils";

interface EffectFactorsProps {
  cas: string;
}

/**
 * Structure attendue pour un effect factor
 * Adaptable selon la structure réelle de l'API
 */
interface EffectFactor {
  id?: string | number;
  name?: string;
  value?: number | string;
  unit?: string;
  description?: string;
  type?: string;
  [key: string]: any; // Permet d'accepter d'autres champs
}

/**
 * Structure de la réponse API /cas/{cas}
 * Peut contenir un champ effect_factors ou effectFactors
 */
interface CasInfoResponse {
  cas_number?: string;
  name?: string;
  effect_factors?: EffectFactor[];
  effectFactors?: EffectFactor[];
  [key: string]: any;
}

export const EffectFactors = ({ cas }: EffectFactorsProps) => {
  const normalizedCas = cas ? normalizeCas(cas) : '';

  // Fetch CAS info to get effect factors
  const { data: casInfo, isLoading, error } = useQuery({
    queryKey: ["cas-info", normalizedCas],
    queryFn: async () => {
      const endpoint = API_ENDPOINTS.CAS_INFO(normalizedCas);
      if (import.meta.env.DEV) {
        console.log(`[EffectFactors] Fetching CAS info from: ${endpoint}`);
      }
      return apiFetch<CasInfoResponse>(endpoint);
    },
    enabled: !!normalizedCas,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false,
  });

  // Extract effect factors from the response
  // Support both snake_case and camelCase
  const effectFactors: EffectFactor[] = casInfo?.effect_factors || casInfo?.effectFactors || [];

  // Debug log in development
  if (import.meta.env.DEV && casInfo) {
    console.log(`[EffectFactors] Effect factors for CAS ${normalizedCas}:`, effectFactors);
  }

  // Don't render if no CAS number
  if (!normalizedCas) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state (but don't show error for 404, as endpoint may not exist for all CAS)
  const shouldShowError = error && !(error instanceof ApiError && error.status === 404);
  
  if (shouldShowError) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Effect Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorDisplay 
            error={error} 
            title="Error loading effect factors"
          />
        </CardContent>
      </Card>
    );
  }

  // No effect factors available
  if (effectFactors.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Effect Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No effect factors available for this substance.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Display effect factors (maximum 3)
  const displayFactors = effectFactors.slice(0, 3);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Effect Factors
          <Badge variant="secondary" className="ml-2">
            {displayFactors.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayFactors.map((factor, index) => (
            <div
              key={factor.id || index}
              className="rounded-lg border bg-muted/50 p-4 hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {factor.name && (
                    <h4 className="font-semibold text-lg">{factor.name}</h4>
                  )}
                  {factor.description && (
                    <p className="text-sm text-muted-foreground">{factor.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 items-center">
                    {factor.value !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-primary text-lg">
                          {typeof factor.value === 'number' 
                            ? factor.value.toLocaleString() 
                            : factor.value}
                        </span>
                        {factor.unit && (
                          <Badge variant="outline" className="text-xs">
                            {factor.unit}
                          </Badge>
                        )}
                      </div>
                    )}
                    {factor.type && (
                      <Badge variant="secondary" className="text-xs">
                        {factor.type}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {/* Display any additional fields */}
              {Object.keys(factor).some(key => 
                !['id', 'name', 'value', 'unit', 'description', 'type'].includes(key) &&
                factor[key] !== undefined &&
                factor[key] !== null
              ) && (
                <div className="mt-3 pt-3 border-t space-y-1">
                  {Object.entries(factor).map(([key, value]) => {
                    if (['id', 'name', 'value', 'unit', 'description', 'type'].includes(key) ||
                        value === undefined || value === null) {
                      return null;
                    }
                    return (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="font-medium">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

