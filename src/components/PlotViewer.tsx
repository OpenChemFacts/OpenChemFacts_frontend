import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, AlertCircle } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch, ApiError } from "@/lib/api";

interface PlotViewerProps {
  cas: string;
  type: "ssd" | "ec10eq";
}

interface PlotlyData {
  data: any[];
  layout: any;
  config?: any;
}

export const PlotViewer = ({ cas, type }: PlotViewerProps) => {
  const plotRef = useRef<HTMLDivElement>(null);

  const endpoint = type === "ssd" 
    ? API_ENDPOINTS.SSD_PLOT(cas)
    : API_ENDPOINTS.EC10EQ_PLOT(cas);
  const title = type === "ssd" 
    ? "Species Sensitivity Distribution (SSD)" 
    : "EC10 Equivalent";

  const { data, isLoading, error } = useQuery({
    queryKey: ["plot", cas, type],
    queryFn: () => apiFetch<PlotlyData>(endpoint),
    enabled: !!cas,
  });

  useEffect(() => {
    if (data && plotRef.current && (window as any).Plotly) {
      try {
        // Vérifier que les données Plotly sont valides
        if (data.data && data.layout) {
          (window as any).Plotly.newPlot(plotRef.current, data.data, data.layout, {
            responsive: true,
            displayModeBar: true,
            ...(data.config || {}),
          });
        } else {
          console.error("Invalid Plotly data structure:", data);
        }
      } catch (plotError) {
        console.error("Error rendering Plotly chart:", plotError);
      }
    }
  }, [data]);

  // Load Plotly dynamically
  useEffect(() => {
    if (!(window as any).Plotly) {
      const script = document.createElement("script");
      script.src = "https://cdn.plot.ly/plotly-2.27.0.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const errorMessage = error instanceof ApiError 
      ? error.message 
      : "Erreur lors du chargement du graphique";
    const isNotFound = error instanceof ApiError && error.status === 404;
    
    return (
      <Card className="shadow-card border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">
                {isNotFound ? "Graphique non disponible" : "Erreur"}
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
          <BarChart3 className="h-5 w-5 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={plotRef} className="w-full min-h-[400px]" />
      </CardContent>
    </Card>
  );
};
