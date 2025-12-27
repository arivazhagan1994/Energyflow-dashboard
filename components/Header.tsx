
import React from 'react';
import { Menu, Zap } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white z-30 border-b border-slate-200 flex items-center px-6 justify-between transition-all">
      <div className="flex items-center gap-6">
        <button 
          onClick={onToggleSidebar}
          className="p-2 hover:bg-slate-50 rounded-lg lg:hidden transition-colors"
          aria-label="Toggle Controls"
        >
          <Menu className="text-slate-900" size={24} />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200">
            <Zap className="text-white" size={18} fill="currentColor" />
          </div>
          <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight uppercase">
            Energy <span className="text-emerald-600">Analytics</span>
          </h1>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Analysis Session</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
