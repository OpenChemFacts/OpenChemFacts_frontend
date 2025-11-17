import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Info, AlertCircle } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch, ApiError } from "@/lib/api";

interface ChemicalInfoProps {
  cas: string;
}

interface ChemicalData {
  cas_number: string;
  chemical_name?: string;
  n_species: number;
  n_trophic_level: number;
  n_results: number;
  [key: string]: any;
}

export const ChemicalInfo = ({ cas }: ChemicalInfoProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["chemical-info", cas],
    queryFn: () => apiFetch<ChemicalData>(API_ENDPOINTS.CHEMICAL_INFO(cas)),
    enabled: !!cas,
  });

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const errorMessage = error instanceof ApiError 
      ? error.message 
      : "Erreur lors du chargement des informations";
    const isNotFound = error instanceof ApiError && error.status === 404;
    
    return (
      <Card className="shadow-card border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">
                {isNotFound ? "Produit chimique non trouvé" : "Erreur"}
              </p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          Chemical Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">CAS Number</p>
            <p className="font-mono font-semibold text-lg">{data?.cas_number}</p>
          </div>
          {data?.chemical_name && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Chemical Name</p>
              <p className="font-semibold">{data.chemical_name}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Badge variant="secondary" className="text-base py-1 px-4">
            <Info className="h-4 w-4 mr-2" />
            {data?.n_results} tests
          </Badge>
          <Badge variant="outline" className="text-base py-1 px-4">
            {data?.n_species} species
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
