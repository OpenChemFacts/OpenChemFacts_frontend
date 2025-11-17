import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, AlertCircle, Plus, X } from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/config";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

interface CasItem {
  cas_number: string;
  chemical_name?: string;
}

interface PlotlyData {
  data: any[];
  layout: any;
  config?: any;
}

export const BenchmarkComparison = () => {
  const [selectedCas, setSelectedCas] = useState<string[]>([]);
  const [searchTerms, setSearchTerms] = useState<string[]>(["", "", ""]);
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null);
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);
  const plotRef = useRef<HTMLDivElement>(null);

  // Fetch CAS list for autocomplete
  const { data: casListResponse } = useQuery({
    queryKey: ["cas-list"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CAS_LIST}`);
      if (!response.ok) throw new Error("Failed to fetch CAS list");
      const data = await response.json();
      
      if (data?.cas_with_names) {
        if (Array.isArray(data.cas_with_names)) {
          return data.cas_with_names as CasItem[];
        } else {
          return Object.entries(data.cas_with_names as Record<string, string>).map(
            ([cas_number, chemical_name]) => ({ cas_number, chemical_name })
          );
        }
      }
      return [];
    },
  });

  const casList: CasItem[] = casListResponse || [];

  // Fetch comparison plot when we have 2-3 substances selected
  const { data: plotData, isLoading, error } = useQuery({
    queryKey: ["ssd-comparison", selectedCas],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SSD_COMPARISON}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cas_list: selectedCas }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ApiError(
          errorText || "Failed to fetch comparison plot",
          response.status,
          response.statusText
        );
      }

      return response.json() as Promise<PlotlyData>;
    },
    enabled: selectedCas.length >= 2 && selectedCas.length <= 3,
  });

  // Render Plotly chart
  useEffect(() => {
    if (plotData && plotRef.current && plotlyLoaded && (window as any).Plotly) {
      try {
        console.log('[BenchmarkComparison] Plotly data received:', plotData);
        console.log('[BenchmarkComparison] Number of traces:', plotData.data?.length);
        console.log('[BenchmarkComparison] Traces details:', plotData.data?.map((trace: any) => ({
          name: trace.name,
          type: trace.type,
          mode: trace.mode,
          x_length: trace.x?.length || trace.x?.dtype,
          y_length: trace.y?.length || trace.y?.dtype,
        })));
        
        // Vérifier que les données Plotly sont valides
        if (plotData.data && plotData.layout) {
          // Nettoyer le graphique existant avant d'en créer un nouveau
          if (plotRef.current) {
            (window as any).Plotly.purge(plotRef.current);
          }

          // Préserver 100% des éléments du layout original
          // Fusionner intelligemment les améliorations sans écraser les éléments existants
          
          // D'abord, préserver tous les axes secondaires (xaxis2, yaxis2, xaxis3, etc.)
          // avec amélioration de automargin seulement si absent
          const secondaryAxes = Object.keys(plotData.layout)
            .filter(key => /^(x|y)axis\d+$/.test(key))
            .reduce((acc, key) => {
              acc[key] = {
                ...plotData.layout[key], // Préserver toutes les valeurs originales
                automargin: plotData.layout[key]?.automargin ?? true, // Ajouter automargin seulement si absent
              };
              return acc;
            }, {} as any);
          
          // Construire le layout amélioré en préservant TOUS les éléments originaux
          const enhancedLayout = {
            // D'abord, préserver TOUS les éléments du layout original
            ...plotData.layout,
            
            // Améliorations pour l'affichage (fusionnées avec les valeurs existantes)
            autosize: plotData.layout.autosize ?? true,
            showlegend: plotData.layout.showlegend !== false, // Préserver la valeur originale si définie
            
            // Marges : fusionner intelligemment (préserver les valeurs originales, ajouter des défauts si manquantes)
            margin: {
              l: 80,
              r: 120,
              t: 100,
              b: 120,
              pad: 10,
              ...plotData.layout.margin, // Les valeurs originales écrasent les défauts
            },
            
            // Font : fusionner avec la font existante
            font: {
              size: 12,
              ...plotData.layout.font, // Les valeurs originales écrasent les défauts
            },
            
            // Axe X principal : préserver toutes les propriétés et améliorer seulement automargin
            xaxis: {
              ...plotData.layout.xaxis, // D'abord préserver toutes les valeurs originales
              automargin: plotData.layout.xaxis?.automargin ?? true, // Ajouter automargin seulement si absent
            },
            
            // Axe Y principal : préserver toutes les propriétés et améliorer seulement automargin
            yaxis: {
              ...plotData.layout.yaxis, // D'abord préserver toutes les valeurs originales
              automargin: plotData.layout.yaxis?.automargin ?? true, // Ajouter automargin seulement si absent
            },
            
            // Ajouter les axes secondaires préservés
            ...secondaryAxes,
            
            // Légende : fusionner avec la configuration existante
            legend: plotData.layout.legend ? {
              ...plotData.layout.legend, // D'abord préserver toutes les valeurs originales
              // Ensuite, ajouter des valeurs par défaut seulement si elles n'existent pas
              orientation: plotData.layout.legend.orientation ?? 'v',
              x: plotData.layout.legend.x ?? 1.02,
              y: plotData.layout.legend.y ?? 1,
              xanchor: plotData.layout.legend.xanchor ?? 'left',
              yanchor: plotData.layout.legend.yanchor ?? 'top',
              visible: plotData.layout.legend.visible !== false,
              font: {
                size: 11, // Valeur par défaut
                ...plotData.layout.legend.font, // Les valeurs originales écrasent les défauts
              },
            } : {
              // Valeurs par défaut si aucune légende n'est définie
              orientation: 'v',
              x: 1.02,
              y: 1,
              xanchor: 'left',
              yanchor: 'top',
              visible: true,
              font: { size: 11 },
            },
          };

          // Préserver 100% des traces (data) sans modification
          // plotData.data contient toutes les traces (courbes, scatter, barres, etc.)
          const allTraces = Array.isArray(plotData.data) ? plotData.data : [];
          
          // Configuration : fusionner avec la config originale
          const plotConfig = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ["lasso2d", "select2d"],
            ...(plotData.config || {}), // Préserver toutes les options de config originales
          };

          console.log('[BenchmarkComparison] Rendering plot with:', {
            tracesCount: allTraces.length,
            layoutKeys: Object.keys(enhancedLayout),
            hasAnnotations: !!enhancedLayout.annotations,
            hasShapes: !!enhancedLayout.shapes,
            hasImages: !!enhancedLayout.images,
            secondaryAxes: Object.keys(secondaryAxes),
          });

          (window as any).Plotly.newPlot(
            plotRef.current,
            allTraces, // Utiliser toutes les traces sans modification
            enhancedLayout,
            plotConfig
          );

          const resizeHandler = () => {
            if (plotRef.current && (window as any).Plotly) {
              (window as any).Plotly.Plots.resize(plotRef.current);
            }
          };
          window.addEventListener("resize", resizeHandler);
          return () => {
            window.removeEventListener("resize", resizeHandler);
            // Nettoyer le graphique lors du démontage
            if (plotRef.current && (window as any).Plotly) {
              (window as any).Plotly.purge(plotRef.current);
            }
          };
        } else {
          console.error("[BenchmarkComparison] Invalid Plotly data structure:", plotData);
        }
      } catch (plotError) {
        console.error("[BenchmarkComparison] Error rendering Plotly chart:", plotError);
      }
    }
  }, [plotData, plotlyLoaded]);

  // Load Plotly dynamically
  useEffect(() => {
    if ((window as any).Plotly) {
      setPlotlyLoaded(true);
      return;
    }

    // Vérifier si le script est déjà en cours de chargement
    const existingScript = document.querySelector('script[src="https://cdn.plot.ly/plotly-2.27.0.min.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setPlotlyLoaded(true);
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.plot.ly/plotly-2.27.0.min.js";
    script.async = true;
    script.onload = () => {
      setPlotlyLoaded(true);
    };
    script.onerror = () => {
      console.error("[BenchmarkComparison] Failed to load Plotly script");
    };
    document.body.appendChild(script);

    return () => {
      // Nettoyer le graphique lors du démontage
      if (plotRef.current && (window as any).Plotly) {
        (window as any).Plotly.purge(plotRef.current);
      }
    };
  }, []);

  const getFilteredSuggestions = (index: number) => {
    const term = searchTerms[index];
    if (!term) return [];
    
    return casList
      .filter((item) => {
        const matchesTerm = 
          item.cas_number.toLowerCase().includes(term.toLowerCase()) ||
          item.chemical_name?.toLowerCase().includes(term.toLowerCase());
        const notAlreadySelected = !selectedCas.includes(item.cas_number);
        return matchesTerm && notAlreadySelected;
      })
      .slice(0, 10);
  };

  const handleAddCas = (cas: string, name: string | undefined, index: number) => {
    if (selectedCas.length >= 3) {
      toast.error("Maximum 3 substances pour la comparaison");
      return;
    }
    setSelectedCas([...selectedCas, cas]);
    setSearchTerms((prev) => {
      const newTerms = [...prev];
      newTerms[index] = "";
      return newTerms;
    });
    setShowSuggestions(null);
  };

  const handleRemoveCas = (cas: string) => {
    setSelectedCas(selectedCas.filter((c) => c !== cas));
  };

  const getChemicalName = (cas: string) => {
    const item = casList.find((item) => item.cas_number === cas);
    return item?.chemical_name || cas;
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent" />
          Benchmark - Comparaison SSD
        </CardTitle>
        <CardDescription>
          Comparez les distributions de sensibilité des espèces (SSD) entre 2 ou 3 substances
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selection des substances */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Sélectionnez 2-3 substances :</h3>
          
          {/* Selected substances */}
          {selectedCas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCas.map((cas) => (
                <div
                  key={cas}
                  className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-md text-sm"
                >
                  <span>{getChemicalName(cas)}</span>
                  <button
                    onClick={() => handleRemoveCas(cas)}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add substance inputs */}
          {selectedCas.length < 3 && (
            <div className="space-y-3">
              {[0, 1, 2].slice(0, 3 - selectedCas.length).map((index) => (
                <div key={index} className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchTerms[selectedCas.length + index]}
                      onChange={(e) => {
                        const newTerms = [...searchTerms];
                        newTerms[selectedCas.length + index] = e.target.value;
                        setSearchTerms(newTerms);
                        setShowSuggestions(selectedCas.length + index);
                      }}
                      onFocus={() => setShowSuggestions(selectedCas.length + index)}
                      placeholder="Rechercher par CAS ou nom..."
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <Button variant="outline" size="icon" disabled>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Suggestions dropdown */}
                  {showSuggestions === selectedCas.length + index &&
                    searchTerms[selectedCas.length + index] && (
                      <Card className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto">
                        <CardContent className="p-2">
                          {getFilteredSuggestions(selectedCas.length + index).map((item) => (
                            <button
                              key={item.cas_number}
                              onClick={() =>
                                handleAddCas(
                                  item.cas_number,
                                  item.chemical_name,
                                  selectedCas.length + index
                                )
                              }
                              className="w-full text-left px-3 py-2 hover:bg-accent rounded-md transition-colors"
                            >
                              <div className="font-medium text-sm">{item.cas_number}</div>
                              {item.chemical_name && (
                                <div className="text-xs text-muted-foreground">
                                  {item.chemical_name}
                                </div>
                              )}
                            </button>
                          ))}
                          {getFilteredSuggestions(selectedCas.length + index).length === 0 && (
                            <div className="text-sm text-muted-foreground p-3">
                              Aucune substance trouvée
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plot area */}
        {selectedCas.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
            <p>Sélectionnez au moins 2 substances pour voir la comparaison</p>
          </div>
        ) : isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive p-4 border border-destructive rounded-md">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Erreur</p>
              <p className="text-sm">
                {error instanceof ApiError ? error.message : "Erreur lors du chargement"}
              </p>
            </div>
          </div>
        ) : (
          <div ref={plotRef} className="w-full h-[500px] md:h-[600px]" />
        )}
      </CardContent>
    </Card>
  );
};
