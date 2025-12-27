
import React from 'react';
import { Upload, FileSpreadsheet, LayoutDashboard, Settings, Filter, Table, ChevronRight } from 'lucide-react';
import { ColumnConfig, FileState, PageView } from '../types';

interface SidebarProps {
  fileState: FileState | null;
  pageView: PageView;
  setPageView: (view: PageView) => void;
  config: ColumnConfig;
  setConfig: (config: ColumnConfig) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSheetChange: (sheet: string) => void;
  isLoading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  fileState,
  pageView,
  setPageView,
  config,
  setConfig,
  onFileUpload,
  onSheetChange,
  isLoading
}) => {
  
  const handleConfigChange = (key: keyof ColumnConfig, value: string) => {
    setConfig({ ...config, [key]: value });
  };

  return (
    <aside className="w-full md:w-[320px] bg-slate-950 text-white flex flex-col h-full shadow-2xl border-r border-slate-800 flex-shrink-0 z-20 overflow-y-auto">
      <div className="p-8 border-b border-slate-900">
        <h2 className="text-xl font-black flex items-center gap-3 text-emerald-400 uppercase tracking-tighter">
          <Settings size={22} />
          Terminal
        </h2>
      </div>

      <div className="flex-1 p-8 space-y-10">
        
        <section>
          <h3 className="text-[10px] uppercase text-slate-500 font-black tracking-[0.3em] mb-4">
            Ingestion Engine
          </h3>
          <div className="space-y-4">
             <label className="flex items-center justify-center w-full px-5 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl cursor-pointer transition-all shadow-lg shadow-emerald-900/20 group active:scale-95">
                <Upload size={20} className="mr-3 group-hover:-translate-y-1 transition-transform" />
                <span className="font-black text-sm uppercase">Import Dataset</span>
                <input 
                  type="file" 
                  accept=".csv, .xlsx, .xls" 
                  onChange={onFileUpload} 
                  className="hidden" 
                  disabled={isLoading}
                />
            </label>
            
            {fileState && (
              <div className="bg-slate-900 rounded-2xl p-4 text-sm border border-slate-800 shadow-inner">
                <div className="flex items-center gap-3 text-slate-200 mb-2 overflow-hidden">
                  <FileSpreadsheet size={18} className="text-emerald-500 shrink-0" />
                  <span className="truncate font-bold" title={fileState.name}>{fileState.name}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Verified: {fileState.data.length.toLocaleString()} nodes
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] uppercase text-slate-500 font-black tracking-[0.3em] mb-4">
            Navigation
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => setPageView('preview')}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm transition-all ${
                pageView === 'preview' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-black' 
                  : 'text-slate-500 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center">
                <Table size={18} className="mr-4" />
                Data Inspector
              </div>
              <ChevronRight size={14} opacity={pageView === 'preview' ? 1 : 0} />
            </button>
            <button
              onClick={() => setPageView('visualization')}
              disabled={!fileState}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm transition-all ${
                pageView === 'visualization' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-black' 
                  : 'text-slate-500 hover:text-white hover:bg-slate-900 disabled:opacity-20 disabled:cursor-not-allowed'
              }`}
            >
              <div className="flex items-center">
                <LayoutDashboard size={18} className="mr-4" />
                Flow Architect
              </div>
              <ChevronRight size={14} opacity={pageView === 'visualization' ? 1 : 0} />
            </button>
          </div>
        </section>

        {fileState && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <h3 className="text-[10px] uppercase text-slate-500 font-black tracking-[0.3em] mb-4">
              Map Configuration
            </h3>
            <div className="space-y-5">
              {[
                { label: 'Source', key: 'source' },
                { label: 'Target', key: 'target' },
                { label: 'Magnitude', key: 'value' }
              ].map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{item.label} Column</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none transition-all cursor-pointer hover:border-slate-700"
                    value={config[item.key as keyof ColumnConfig] || ''}
                    onChange={(e) => handleConfigChange(item.key as keyof ColumnConfig, e.target.value)}
                  >
                    <option value="">Select Target...</option>
                    {fileState.columns.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>
              ))}
              
              <div className="pt-6 border-t border-slate-900">
                <div className="flex items-center gap-2 mb-3 text-emerald-500">
                  <Filter size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Cross-Segment Analysis</span>
                </div>
                <select 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none cursor-pointer"
                  value={config.filterColumn || ''}
                  onChange={(e) => setConfig({ ...config, filterColumn: e.target.value, filterValue: '' })}
                >
                  <option value="">No Filter Applied</option>
                  {fileState.columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>

            </div>
          </section>
        )}
      </div>

      <div className="p-6 bg-black/40 text-slate-600 text-[9px] font-black tracking-[0.5em] text-center border-t border-slate-900 uppercase">
        Enterprise Deployment Mode
      </div>
    </aside>
  );
};

export default Sidebar;
