/**
 * Utilities for creating EC10eq plots from JSON data
 * Converts API JSON response to Plotly format
 * Based on plot_ec10eq_by_trophic_species.py implementation
 */

import { PlotlyData } from "./plotly-utils";

/**
 * Interface for EC10eq data from the API (detailed format)
 */
export interface EC10eqDataDetailed {
  cas: string;
  chemical_name: string | null;
  trophic_groups: {
    [trophicGroup: string]: {
      [species: string]: Array<{
        EC10eq: number;
        test_id: number;
        year: number;
        author: string;
      }>;
    };
  };
}

/**
 * Interface for EC10eq data from the API (simple format)
 */
export interface EC10eqDataSimple {
  cas: string;
  chemical_name: string | null;
  endpoints: Array<{
    trophic_group: string;
    species: string;
    EC10eq: number;
    test_id: number;
    year: number;
    author: string;
  }>;
}

/**
 * Type union for EC10eq data
 */
export type EC10eqData = EC10eqDataDetailed | EC10eqDataSimple;

/**
 * Check if data is EC10eq JSON format (not Plotly format)
 */
export function isEC10eqData(data: any): data is EC10eqData {
  return (
    data &&
    typeof data === 'object' &&
    'cas' in data &&
    ('trophic_groups' in data || 'endpoints' in data) &&
    !('data' in data && 'layout' in data) // Not Plotly format
  );
}

/**
 * Check if data is detailed format
 */
export function isDetailedFormat(data: EC10eqData): data is EC10eqDataDetailed {
  return 'trophic_groups' in data;
}

/**
 * Trophic group colors matching the backend implementation
 */
const TROPHIC_GROUP_COLORS: Record<string, string> = {
  algae: "#2ca02c", // Green
  crustaceans: "#1f77b4", // Blue
  fish: "#ff7f0e", // Orange
  plants: "#9467bd", // Purple
  molluscs: "#8c564b", // Brown
  insects: "#e377c2", // Pink
  amphibians: "#7f7f7f", // Gray
  annelids: "#bcbd22", // Yellow-green
};

/**
 * Trophic group symbols matching the backend implementation
 */
const TROPHIC_GROUP_SYMBOLS: Record<string, string> = {
  algae: "circle",
  crustaceans: "square",
  fish: "triangle-up",
  plants: "diamond",
  molluscs: "diamond",
  insects: "x", // Changed from "hash" to "x" which is a valid Plotly symbol
  amphibians: "star",
  annelids: "hourglass",
};

/**
 * Convert simple format to detailed format for easier processing
 */
function convertToDetailed(data: EC10eqData): EC10eqDataDetailed {
  if (isDetailedFormat(data)) {
    return data;
  }

  const simpleData = data as EC10eqDataSimple;
  const detailed: EC10eqDataDetailed = {
    cas: simpleData.cas,
    chemical_name: simpleData.chemical_name,
    trophic_groups: {},
  };

  // Group endpoints by trophic group and species
  for (const endpoint of simpleData.endpoints) {
    const tg = endpoint.trophic_group;
    const species = endpoint.species;

    if (!detailed.trophic_groups[tg]) {
      detailed.trophic_groups[tg] = {};
    }
    if (!detailed.trophic_groups[tg][species]) {
      detailed.trophic_groups[tg][species] = [];
    }

    detailed.trophic_groups[tg][species].push({
      EC10eq: endpoint.EC10eq,
      test_id: endpoint.test_id,
      year: endpoint.year,
      author: endpoint.author,
    });
  }

  return detailed;
}

/**
 * Convert EC10eq JSON data to Plotly format
 * Based on create_ec10eq_plot implementation
 */
export function createEC10eqPlotFromData(
  ec10eqData: EC10eqData,
  colorBy: 'trophic_group' | 'year' | 'author' = 'trophic_group'
): PlotlyData {
  // Convert to detailed format for easier processing
  const data = convertToDetailed(ec10eqData);
  const { cas, chemical_name, trophic_groups } = data;

  const traces: any[] = [];
  const uniqueCombinations: string[] = [];

  // Get sorted trophic groups
  const sortedTrophicGroups = Object.keys(trophic_groups).sort();

  // Process each trophic group
  for (const trophicGroup of sortedTrophicGroups) {
    const groupData = trophic_groups[trophicGroup];
    const sortedSpecies = Object.keys(groupData).sort();

    // Process each species in the trophic group
    for (const species of sortedSpecies) {
      const endpoints = groupData[species];
      const label = `${trophicGroup} - ${species}`;
      uniqueCombinations.push(label);

      // Prepare data for this species
      const ec10eqValues: number[] = [];
      const customData: any[] = [];

      for (const endpoint of endpoints) {
        ec10eqValues.push(endpoint.EC10eq);
        customData.push([
          endpoint.test_id,
          endpoint.year,
          endpoint.author,
        ]);
      }

      // Determine colors based on colorBy mode
      let markerColors: string[] = [];
      if (colorBy === 'trophic_group') {
        const color = TROPHIC_GROUP_COLORS[trophicGroup.toLowerCase()] || "#000000";
        markerColors = new Array(ec10eqValues.length).fill(color);
      } else if (colorBy === 'year') {
        // Create a color map for years
        const years = endpoints.map(e => e.year);
        const uniqueYears = [...new Set(years)].sort();
        const yearColors: Record<number, string> = {};
        const colorPalette = [
          "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
          "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
        ];
        uniqueYears.forEach((year, idx) => {
          yearColors[year] = colorPalette[idx % colorPalette.length];
        });
        markerColors = years.map(year => yearColors[year] || "#000000");
      } else if (colorBy === 'author') {
        // Create a color map for authors
        const authors = endpoints.map(e => e.author);
        const uniqueAuthors = [...new Set(authors)].sort();
        const authorColors: Record<string, string> = {};
        const colorPalette = [
          "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
          "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
        ];
        uniqueAuthors.forEach((author, idx) => {
          authorColors[author] = colorPalette[idx % colorPalette.length];
        });
        markerColors = authors.map(author => authorColors[author] || "#000000");
      }

      // Get symbol for trophic group
      const symbol = TROPHIC_GROUP_SYMBOLS[trophicGroup.toLowerCase()] || "circle";

      // Add trace for this species
      // Only show legend for first species of each trophic group
      const isFirstSpecies = species === sortedSpecies[0];
      const legendGroup = trophicGroup;

      traces.push({
        x: new Array(ec10eqValues.length).fill(label),
        y: ec10eqValues,
        mode: 'markers',
        name: trophicGroup.charAt(0).toUpperCase() + trophicGroup.slice(1),
        type: 'scatter',
        marker: {
          color: markerColors,
          symbol: symbol,
          size: 10,
          opacity: 0.7,
          line: {
            width: 1,
            color: 'white',
          },
        },
        customdata: customData,
        hovertemplate: (
          "<b>EC10eq:</b> %{y:.4f} mg/L<br>" +
          "<b>Test ID:</b> %{customdata[0]}<br>" +
          "<b>Year:</b> %{customdata[1]}<br>" +
          "<b>Author:</b> %{customdata[2]}<br>" +
          "<extra></extra>"
        ),
        legendgroup: legendGroup,
        showlegend: isFirstSpecies,
      });
    }
  }

  // Calculate statistics for title
  const numTrophicGroups = sortedTrophicGroups.length;
  const allSpecies = new Set<string>();
  let numEndpoints = 0;
  for (const tg of Object.values(trophic_groups)) {
    for (const species of Object.keys(tg)) {
      allSpecies.add(species);
      numEndpoints += tg[species].length;
    }
  }
  const numSpecies = allSpecies.size;

  // Create title
  let title = "EC10eq Distribution by Trophic Group and Species";
  if (colorBy !== "trophic_group") {
    title += ` (colored by ${colorBy})`;
  }
  if (chemical_name) {
    title += `<br><sub>CAS: ${cas} - ${chemical_name}</sub>`;
  } else {
    title += `<br><sub>CAS: ${cas}</sub>`;
  }
  title += `<br><sub>Trophic group(s): ${numTrophicGroups} | Species: ${numSpecies} | Endpoints: ${numEndpoints}</sub>`;

  // Calculate y-axis tick values for log scale
  const allEC10Values = traces.flatMap(trace => trace.y as number[]);
  const minVal = Math.min(...allEC10Values);
  const maxVal = Math.max(...allEC10Values);
  const minPower = Math.floor(Math.log10(Math.max(minVal, 1e-10)));
  const maxPower = Math.ceil(Math.log10(maxVal));
  const yaxisTickvals: number[] = [];
  for (let i = minPower; i <= maxPower; i++) {
    yaxisTickvals.push(Math.pow(10, i));
  }

  // Create layout
  const layout: any = {
    title: {
      text: title,
      x: 0.5,
      xanchor: 'center',
      font: { size: 14 },
    },
    xaxis: {
      title: "Trophic Group - Species",
      tickangle: -45,
      tickmode: "array",
      tickvals: uniqueCombinations,
      ticktext: uniqueCombinations.map(label => label.split(" - ")[1]),
      categoryorder: 'category ascending',
    },
    yaxis: {
      title: "EC10eq (mg/L) - Log Scale",
      type: "log",
      tickmode: "array",
      tickvals: yaxisTickvals,
      tickformat: ".0e", // Scientific notation for cleaner display
    },
    template: "plotly_white",
    width: 1800,
    height: 900,
    hovermode: "closest",
    legend: {
      title: "Trophic Group",
      orientation: "v",
      yanchor: "top",
      y: 1,
      xanchor: "left",
      x: colorBy === "trophic_group" ? 1.01 : 1.15,
    },
    margin: {
      l: 80,
      r: colorBy === "year" ? 250 : 200,
      t: 120,
      b: 150,
    },
  };

  return {
    data: traces,
    layout,
    config: undefined,
  };
}

