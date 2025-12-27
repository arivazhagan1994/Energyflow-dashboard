export interface DataRow {
  [key: string]: string | number | null | undefined;
}

export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface ColumnConfig {
  source: string;
  target: string;
  value: string;
  filterColumn?: string;
  filterValue?: string;
}

export type PageView = 'preview' | 'visualization';

export interface FileState {
  name: string;
  data: DataRow[];
  columns: string[];
  sheetNames?: string[];
  activeSheet?: string;
}