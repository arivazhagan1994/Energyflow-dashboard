
import { DataRow, SankeyData, ColumnConfig } from '../types';

// Premium high-contrast jewel-tone palette for data-heavy visualizations
const COLORS = [
  '#0d9488', // Teal 600
  '#2563eb', // Blue 600
  '#7c3aed', // Violet 600
  '#db2777', // Pink 600
  '#ea580c', // Orange 600
  '#ca8a04', // Yellow 600
  '#059669', // Emerald 600
  '#dc2626', // Red 600
  '#4f46e5', // Indigo 600
  '#9333ea', // Purple 600
  '#0891b2', // Cyan 600
  '#16a34a', // Green 600
  '#be185d', // Rose 700
  '#1e40af', // Blue 800
  '#115e59', // Teal 800
  '#854d0e', // Yellow 800
];

export const processSankeyData = (data: DataRow[], config: ColumnConfig): SankeyData & { nodes: { fill: string }[] } => {
  const { source, target, value, filterColumn, filterValue } = config;

  if (!source || !target || !value) {
    return { nodes: [], links: [] };
  }

  let filteredData = data;
  if (filterColumn && filterValue && filterValue !== 'All') {
    filteredData = data.filter(row => String(row[filterColumn]) === filterValue);
  }

  const linkMap = new Map<string, number>();
  
  filteredData.forEach(row => {
    const src = String(row[source] || '').trim();
    const tgt = String(row[target] || '').trim();
    const val = parseFloat(String(row[value] || '0'));

    if (src && tgt && !isNaN(val) && val > 0) {
      if (src === tgt) return;
      const key = `${src}|||${tgt}`;
      linkMap.set(key, (linkMap.get(key) || 0) + val);
    }
  });

  const nodeSet = new Set<string>();
  const nodeWeights = new Map<string, number>();
  const aggregatedLinks: { source: string; target: string; value: number }[] = [];

  linkMap.forEach((val, key) => {
    const [src, tgt] = key.split('|||');
    nodeSet.add(src);
    nodeSet.add(tgt);
    nodeWeights.set(src, (nodeWeights.get(src) || 0) + val);
    nodeWeights.set(tgt, (nodeWeights.get(tgt) || 0) + val);
    aggregatedLinks.push({ source: src, target: tgt, value: val });
  });

  // Sort nodes by volume to ensure high-value flows are centered
  const sortedNodes = Array.from(nodeSet).sort((a, b) => {
    const weightA = nodeWeights.get(a) || 0;
    const weightB = nodeWeights.get(b) || 0;
    return weightB - weightA;
  });
  
  const nodes = sortedNodes.map((name, i) => ({ 
    name,
    fill: COLORS[i % COLORS.length]
  }));
  
  const nodeIndices = new Map(nodes.map((n, i) => [n.name, i]));

  const rawLinks = aggregatedLinks.map(link => ({
    source: nodeIndices.get(link.source)!,
    target: nodeIndices.get(link.target)!,
    value: link.value
  })).sort((a, b) => b.value - a.value);

  const finalLinks: { source: number; target: number; value: number }[] = [];
  const adjacency = new Map<number, Set<number>>();

  const hasPath = (start: number, end: number): boolean => {
    if (start === end) return true;
    const queue = [start];
    const visited = new Set<number>();
    visited.add(start);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === end) return true;
      const neighbors = adjacency.get(curr);
      if (neighbors) {
        for (const next of neighbors) {
          if (!visited.has(next)) {
            visited.add(next);
            queue.push(next);
          }
        }
      }
    }
    return false;
  };

  for (const link of rawLinks) {
    if (hasPath(link.target, link.source)) continue;
    finalLinks.push(link);
    if (!adjacency.has(link.source)) adjacency.set(link.source, new Set());
    adjacency.get(link.source)!.add(link.target);
  }

  return { nodes, links: finalLinks };
};

export const getUniqueValues = (data: DataRow[], column: string): string[] => {
  const values = new Set<string>();
  data.forEach(row => {
    const val = row[column];
    if (val !== undefined && val !== null) values.add(String(val));
  });
  return Array.from(values).sort();
};
