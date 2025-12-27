
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Loader2 } from 'lucide-react';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DataPreview from './components/DataPreview';
import SankeyView from './components/SankeyView';
import { FileState, PageView, ColumnConfig, DataRow } from './types';

function App() {
  const [fileState, setFileState] = useState<FileState | null>(null);
  const [pageView, setPageView] = useState<PageView>('preview');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [config, setConfig] = useState<ColumnConfig>({
    source: '',
    target: '',
    value: '',
    filterColumn: '',
    filterValue: '',
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const processWorkbook = (workbook: XLSX.WorkBook, fileName: string) => {
    const sheetNames = workbook.SheetNames;
    const firstSheet = sheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];
    const rawData = XLSX.utils.sheet_to_json<DataRow>(worksheet, { defval: null });
    
    if (rawData.length === 0) {
      setIsLoading(false);
      return;
    }

    const columns = Object.keys(rawData[0]);

    setFileState({
      name: fileName,
      data: rawData,
      columns: columns,
      sheetNames: sheetNames,
      activeSheet: firstSheet,
    });
    
    setConfig({ source: '', target: '', value: '' });
    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        if (bstr) {
          const workbook = XLSX.read(bstr, { type: 'binary' });
          processWorkbook(workbook, file.name);
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    // Advanced version handles sheet switching via workbook ref
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 pt-16 h-full overflow-hidden relative">
        
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-10" onClick={() => setSidebarOpen(false)} />
        )}

        <div className={`
          fixed lg:relative top-16 bottom-0 left-0 h-[calc(100vh-64px)] 
          transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) z-20
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:hidden'}
        `}>
          <Sidebar 
            fileState={fileState}
            pageView={pageView}
            setPageView={(view) => {
              setPageView(view);
              if (isMobile) setSidebarOpen(false);
            }}
            config={config}
            setConfig={setConfig}
            onFileUpload={handleFileUpload}
            onSheetChange={handleSheetChange}
            isLoading={isLoading}
          />
        </div>

        <main className="flex-1 overflow-auto p-6 md:p-10 bg-[#fbfcfd] relative scroll-smooth">
          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={56} strokeWidth={2.5} />
                <p className="text-slate-900 font-black uppercase tracking-[0.2em] text-xs">Analyzing Architecture</p>
              </div>
            </div>
          )}

          <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-top-4 duration-700 h-full">
             {pageView === 'preview' ? (
               <DataPreview fileState={fileState} />
             ) : (
               <SankeyView fileState={fileState} config={config} setConfig={setConfig} />
             )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
