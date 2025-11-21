import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCasList } from "@/hooks/useCasList";
import { normalizeCas, compareCas } from "@/lib/cas-utils";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch } from "@/lib/api";
import { ErrorDisplay } from "@/components/ui/error-display";

interface ChemicalInfoProps {
  cas: string;
  chemical_name?: string;
}

interface CasInfoResponse {
  cas_number?: string;
  chemical_name?: string;
  n_species?: number;
  n_trophic_level?: number;
  n_results?: number;
  [key: string]: any;
}

export const ChemicalInfo = ({ cas, chemical_name: propChemicalName }: ChemicalInfoProps) => {
  const normalizedCas = cas ? normalizeCas(cas) : '';
  const [chemicalName, setChemicalName] = useState<string | undefined>(propChemicalName);
  
  // Use the shared hook to get the CAS list
  const { isLoading: isCasListLoading, casList } = useCasList();
  
  // Fetch detailed CAS information from /cas/{cas} endpoint
  const { data: casInfo, isLoading: isCasInfoLoading, error: casInfoError } = useQuery({
    queryKey: ["cas-info", normalizedCas],
    queryFn: () => apiFetch<CasInfoResponse>(API_ENDPOINTS.CAS_INFO(normalizedCas)),
    enabled: !!normalizedCas,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  
  // Systematically retrieve the chemical name if not already provided in props
  useEffect(() => {
    // Priority: casInfo > propChemicalName > casList
    if (casInfo?.chemical_name) {
      setChemicalName(casInfo.chemical_name);
    } else if (propChemicalName) {
      setChemicalName(propChemicalName);
    } else if (normalizedCas && casList.length > 0) {
      const item = casList.find((item) => compareCas(item.cas_number, normalizedCas));
      if (item?.chemical_name) {
        setChemicalName(item.chemical_name);
      }
    }
  }, [normalizedCas, propChemicalName, casList, casInfo]);

  const isLoading = isCasListLoading || isCasInfoLoading;

  if (isLoading && !casInfo) {
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

  if (casInfoError) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Chemical Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorDisplay 
            error={casInfoError} 
            title="Error loading chemical information"
          />
        </CardContent>
      </Card>
    );
  }


  // Use data from casInfo endpoint if available, otherwise fallback to basic info
  const displayCasNumber = casInfo?.cas_number || normalizedCas;
  const displayChemicalName = casInfo?.chemical_name || chemicalName;

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
            <p className="font-mono font-semibold text-lg">{displayCasNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Name</p>
            {isLoading && !displayChemicalName ? (
              <Skeleton className="h-6 w-48" />
            ) : displayChemicalName ? (
              <p className="font-semibold text-lg">{displayChemicalName}</p>
            ) : (
              <p className="font-semibold text-muted-foreground italic">Name not available</p>
            )}
          </div>
        </div>

        {/* Display additional information from /cas/{cas} endpoint */}
        {casInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            {casInfo.n_species !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Number of Species</p>
                <p className="font-semibold text-lg">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {casInfo.n_species}
                  </Badge>
                </p>
              </div>
            )}
            {casInfo.n_trophic_level !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Trophic Levels</p>
                <p className="font-semibold text-lg">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {casInfo.n_trophic_level}
                  </Badge>
                </p>
              </div>
            )}
            {casInfo.n_results !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Results</p>
                <p className="font-semibold text-lg">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {casInfo.n_results}
                  </Badge>
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
