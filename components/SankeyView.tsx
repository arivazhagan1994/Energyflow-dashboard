
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { sankey as d3Sankey, sankeyLinkHorizontal, sankeyJustify } from 'd3-sankey';
import { ColumnConfig, FileState } from '../types';
import { processSankeyData, getUniqueValues } from '../utils/dataProcessing';
import { AlertCircle, Activity, Download, Filter, ChevronDown, PieChart } from 'lucide-react';

interface SankeyViewProps {
  fileState: FileState | null;
  config: ColumnConfig;
  setConfig: (config: ColumnConfig) => void;
}

/**
 * Requirement: Precision Rounding of 3
 */
const formatValue = (num: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(num);
};

interface ChartData {
  nodes: { name: string; fill: string; index?: number; [key: string]: any }[];
  links: { source: any; target: any; value: number; index?: number; [key: string]: any }[];
}

interface D3SankeyChartProps {
  data: ChartData;
  title: string;
  subtitle: string;
  chartId: string;
  height: number;
}

const D3SankeyChart: React.FC<D3SankeyChartProps> = ({ data, title, subtitle, chartId, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [containerWidth, setContainerWidth] = useState(0);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: React.ReactNode } | null>(null);
  const [highlightedNode, setHighlightedNode] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const graph = useMemo(() => {
    if (!data || !containerWidth || containerWidth === 0) return { nodes: [], links: [] };

    const nodes = data.nodes.map(d => ({ ...d }));
    const links = data.links.map(d => ({ ...d }));

    /**
     * Requirement: 600px Fixed Size & No Overlap
     * We use generous horizontal margins (200px) to prevent label bleed.
     */
    const margin = { top: 40, right: 200, bottom: 40, left: 200 };
    const width = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    /**
     * Collision Avoidance Strategy:
     * Increase padding dynamically if node count is high.
     */
    const padding = Math.max(12, (innerHeight / (nodes.length + 1)) - 6);

    const layout = d3Sankey()
      .nodeId((d: any) => d.index)
      .nodeWidth(16)
      .nodePadding(padding)
      .nodeAlign(sankeyJustify)
      .extent([[0, 0], [width, innerHeight]])
      .iterations(128);

    try {
      // @ts-ignore
      return layout({
        nodes: nodes.map((d, i) => ({ ...d, index: i })),
        links: links.filter(l => l.value > 0)
      });
    } catch (e) {
      return { nodes: [], links: [] };
    }
  }, [data, containerWidth, height]);

  const handleExport = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const svgSize = svgRef.current.getBoundingClientRect();
    canvas.width = svgSize.width * 2;
    canvas.height = svgSize.height * 2;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = `${chartId}_analytics.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden mb-12 group transition-all duration-500 hover:shadow-emerald-900/5">
      <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-200">
            <PieChart size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{title}</h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] block mt-0.5">{subtitle}</span>
          </div>
        </div>
        <button onClick={handleExport} className="px-5 py-2 bg-slate-900 text-white text-[11px] font-black rounded-lg hover:bg-black transition-all transform active:scale-95 shadow-md">
          EXPORT ASSET
        </button>
      </div>

      <div ref={containerRef} className="w-full relative bg-white" style={{ height: height }} onMouseLeave={() => { setTooltip(null); setHighlightedNode(null); }}>
        {containerWidth > 0 && (
          <svg ref={svgRef} width={containerWidth} height={height} className="block">
            <defs>
              {graph.links.map((link: any, i) => (
                <linearGradient key={`grad-${i}`} id={`grad-${chartId}-${i}`} gradientUnits="userSpaceOnUse" x1={link.source.x1} x2={link.target.x0}>
                  <stop offset="0%" stopColor={link.source.fill} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={link.target.fill} stopOpacity={0.8} />
                </linearGradient>
              ))}
            </defs>
            <g transform={`translate(200, 40)`}>
              <g>
                  {graph.links.map((link: any, i) => (
                      <path
                        key={`link-${i}`}
                        className="flow-path transition-opacity duration-300"
                        d={sankeyLinkHorizontal()(link) || undefined}
                        stroke={`url(#grad-${chartId}-${i})`}
                        strokeWidth={Math.max(1, link.width)}
                        strokeOpacity={highlightedNode !== null ? ((link.source.index === highlightedNode || link.target.index === highlightedNode) ? 0.9 : 0.05) : 0.4}
                        onMouseEnter={(e) => {
                            const rect = containerRef.current?.getBoundingClientRect();
                            if (rect) setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, content: (
                                <div className="space-y-1">
                                    <div className="text-[10px] text-slate-400 font-black uppercase">Dependency Path</div>
                                    <div className="font-black text-slate-900 text-sm whitespace-nowrap">{link.source.name} → {link.target.name}</div>
                                    <div className="pt-1.5 border-t border-slate-100 flex justify-between gap-8 items-center mt-1">
                                        <span className="text-[10px] text-slate-500 font-bold">PRECISION VALUE</span>
                                        <span className="font-black text-slate-900 text-base">{formatValue(link.value)}</span>
                                    </div>
                                </div>
                            )});
                        }}
                      />
                  ))}
              </g>
              <g>
                  {graph.nodes.map((node: any, i) => {
                  const nodeHeight = Math.max(2, node.y1 - node.y0);
                  const isLeft = node.x0 < containerWidth / 3;
                  const labelFontSize = graph.nodes.length > 20 ? 10 : 12;
                  
                  return (
                      <g key={`node-${i}`} transform={`translate(${node.x0}, ${node.y0})`} 
                         className="cursor-pointer" 
                         onMouseEnter={() => setHighlightedNode(i)}>
                      <rect height={nodeHeight} width={node.x1 - node.x0} fill={node.fill} stroke="#000" strokeOpacity={0.1} rx={2}
                          onMouseEnter={(e) => {
                              const rect = containerRef.current?.getBoundingClientRect();
                              if (rect) setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, content: (
                                  <div className="space-y-1">
                                      <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: node.fill }}>System Node</div>
                                      <div className="text-base font-black text-slate-900">{node.name}</div>
                                      <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center gap-10 mt-1">
                                        <span className="text-[10px] text-slate-500 font-bold">TOTAL THROUGHPUT</span>
                                        <span className="font-black text-slate-900">{formatValue(node.value)}</span>
                                      </div>
                                  </div>
                              )});
                          }}
                      />
                      <g transform={`translate(${isLeft ? -15 : (node.x1 - node.x0) + 15}, ${nodeHeight / 2})`}>
                          <text className="node-label-bg" dy="0.35em" textAnchor={isLeft ? "end" : "start"} fontSize={labelFontSize} fontWeight="900" fill="#1e293b">{node.name}</text>
                          <text className="node-label-bg" dy="1.45em" textAnchor={isLeft ? "end" : "start"} fontSize={labelFontSize - 1} fontWeight="700" fill="#64748b">{formatValue(node.value)}</text>
                      </g>
                      </g>
                  );
                  })}
              </g>
            </g>
          </svg>
        )}
        {tooltip && (
            <div className="absolute z-50 pointer-events-none" style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%) translateY(-20px)' }}>
                <div className="bg-white/95 backdrop-blur-md px-4 py-3 border-2 border-slate-900 shadow-2xl rounded-2xl">
                    {tooltip.content}
                    <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 rotate-45 w-4 h-4 bg-white border-b-2 border-r-2 border-slate-900"></div>
                </div>
            </div>
        )}
      </div>
      <div className="bg-slate-900 px-8 py-3.5 text-[10px] text-slate-500 font-black tracking-[0.5em] text-center uppercase border-t border-slate-800">
        Enterprise Analytics Protocol • Fixed 600px Output
      </div>
    </div>
  );
};

const SankeyView: React.FC<SankeyViewProps> = ({ fileState, config, setConfig }) => {
  const overallData = useMemo(() => {
    if (!fileState) return null;
    return processSankeyData(fileState.data, { ...config, filterColumn: undefined, filterValue: undefined });
  }, [fileState, config.source, config.target, config.value]); 

  const isFilterActive = !!(config.filterColumn && config.filterValue && config.filterValue !== 'All' && config.filterValue !== '');
  
  const filteredData = useMemo(() => {
    if (!fileState || !isFilterActive) return null;
    return processSankeyData(fileState.data, config);
  }, [fileState, config]);

  const filterOptions = useMemo(() => {
      if (!fileState || !config.filterColumn) return [];
      return getUniqueValues(fileState.data, config.filterColumn);
  }, [fileState, config.filterColumn]);

  // Requirement: Size is fixed 600 pixel
  const CHART_HEIGHT = 600;

  if (!fileState) return (
    <div className="flex flex-col items-center justify-center h-[500px] text-slate-400 bg-white rounded-[3rem] border-4 border-dashed border-slate-100 shadow-2xl mx-auto max-w-4xl mt-12 transition-all">
      <div className="p-10 bg-slate-50 rounded-full mb-8 text-slate-200 animate-pulse">
        <Activity size={100} strokeWidth={1} />
      </div>
      <p className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Diagnostic Interface Ready</p>
      <p className="text-slate-400 font-bold text-sm mt-2">Upload a dataset to begin the flow modeling sequence.</p>
    </div>
  );

  if (!config.source || !config.target || !config.value) return (
    <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 shadow-2xl max-w-2xl mx-auto mt-20">
      <div className="bg-emerald-50 p-10 rounded-[2rem] border-2 border-emerald-100 flex flex-col items-center">
        <AlertCircle size={48} className="text-emerald-500 mb-6" />
        <h3 className="text-2xl font-black text-emerald-900 uppercase">Schema Definition Required</h3>
        <p className="text-emerald-800 font-medium text-sm mt-2">Select the source, destination, and magnitude columns to generate the flow map.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-32 max-w-7xl mx-auto px-6">
      <D3SankeyChart 
        data={overallData as unknown as ChartData} 
        chartId="master" 
        title="Comprehensive Flow Network" 
        subtitle={`Analyzing: ${config.source} ➔ ${config.target}`} 
        height={CHART_HEIGHT} 
      />

      {config.filterColumn && (
        <div className="bg-slate-900 p-12 rounded-[3rem] shadow-2xl border border-slate-800 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-indigo-600"></div>
            <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-[11px] font-black uppercase tracking-[0.4em] border border-emerald-500/20 mb-6">
                  Dimension Filter
                </div>
                <h3 className="text-4xl font-black text-white uppercase tracking-tight mb-3">Modular Sub-Analysis</h3>
                <p className="text-slate-400 text-base max-w-lg font-medium opacity-80">Isolate specific categories to analyze local flow dynamics with high-precision metrics.</p>
            </div>
            <div className="relative w-full max-w-lg">
                <select 
                  value={config.filterValue || ''} 
                  onChange={(e) => setConfig({ ...config, filterValue: e.target.value })} 
                  className="w-full pl-8 pr-16 py-6 bg-slate-800 border-2 border-slate-700 rounded-3xl text-white text-lg font-black focus:ring-8 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none transition-all cursor-pointer hover:bg-slate-750 shadow-2xl"
                >
                    <option value="">Consolidated System View</option>
                    {filterOptions.map(val => <option key={val} value={val}>{val}</option>)}
                </select>
                <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-emerald-400 transition-colors" size={32} />
            </div>
        </div>
      )}

      {isFilterActive && filteredData && (
        <div className="animate-in fade-in zoom-in-95 duration-1000">
          <D3SankeyChart 
            data={filteredData as unknown as ChartData} 
            chartId="segment" 
            title="Localized Topology" 
            subtitle={`Filtered By: ${config.filterColumn} (${config.filterValue})`} 
            height={CHART_HEIGHT} 
          />
        </div>
      )}
    </div>
  );
};

export default SankeyView;
