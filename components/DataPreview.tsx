import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FileState } from '../types';

interface DataPreviewProps {
  fileState: FileState | null;
}

const ROWS_PER_PAGE = 20;
const MAX_PREVIEW_ROWS = 500;

const DataPreview: React.FC<DataPreviewProps> = ({ fileState }) => {
  const [page, setPage] = useState(1);

  if (!fileState) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white rounded-lg border border-dashed border-slate-300 min-h-[400px]">
        <p className="text-lg font-medium">No data uploaded</p>
        <p className="text-sm">Upload a CSV or Excel file to preview data.</p>
      </div>
    );
  }

  // Limit to first 500 rows as per requirements
  const limitedData = fileState.data.slice(0, MAX_PREVIEW_ROWS);
  const totalPages = Math.ceil(limitedData.length / ROWS_PER_PAGE);
  const startIndex = (page - 1) * ROWS_PER_PAGE;
  const currentData = limitedData.slice(startIndex, startIndex + ROWS_PER_PAGE);

  const formatCellValue = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return <span className="text-slate-300 italic">null</span>;
    if (typeof val === 'number') {
        // Return integers as is, round floats to max 3 decimal places
        if (Number.isInteger(val)) return val;
        return parseFloat(val.toFixed(3));
    }
    return String(val);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h3 className="font-bold text-slate-700">Data Preview</h3>
          <p className="text-xs text-slate-500">
            Showing first {Math.min(fileState.data.length, MAX_PREVIEW_ROWS)} rows of {fileState.data.length} total.
          </p>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 font-semibold border-b border-slate-200 w-16 text-center">#</th>
              {fileState.columns.map((col) => (
                <th key={col} className="p-3 font-semibold border-b border-slate-200 min-w-[150px] whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, idx) => (
              <tr key={idx} className="hover:bg-cyan-50 transition-colors border-b border-slate-100 last:border-0">
                <td className="p-3 text-center text-slate-400 bg-slate-50 border-r border-slate-100">
                  {startIndex + idx + 1}
                </td>
                {fileState.columns.map((col) => (
                  <td key={`${idx}-${col}`} className="p-3 text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">
                    {formatCellValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataPreview;