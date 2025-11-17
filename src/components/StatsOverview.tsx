import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, FlaskConical, Users, TestTubes } from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/config";

interface Stats {
  total_records: number;
  unique_chemicals: number;
  unique_species: number;
  unique_taxa: number;
  [key: string]: any;
}

export const StatsOverview = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.STATS}`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json() as Promise<Stats>;
    },
  });

  const statsCards = [
    {
      title: "Chemical Substances",
      value: data?.unique_chemicals,
      icon: FlaskConical,
      color: "text-primary",
    },
    {
      title: "Total Records",
      value: data?.total_records,
      icon: TestTubes,
      color: "text-accent",
    },
    {
      title: "Species Tested",
      value: data?.unique_species,
      icon: Users,
      color: "text-secondary",
    },
  ];

  return (
    <div className="mt-12">
      <div className="text-center mb-8">
        <Database className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-3xl font-bold mb-2">Database Statistics</h2>
        <p className="text-muted-foreground">
          Overview of available ecotoxicity data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="shadow-card hover:shadow-elevated transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-32" />
              ) : (
                <p className="text-4xl font-bold">{stat.value?.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 shadow-card bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-2">How to use OpenChemFacts</h3>
          <p className="text-muted-foreground">
            Search for a chemical substance by its CAS number to visualize ecotoxicity data, 
            species sensitivity distributions (SSD), and EC10 equivalent values.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
