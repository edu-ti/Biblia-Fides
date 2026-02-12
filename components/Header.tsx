import React from 'react';
import { APP_NAME } from '../constants';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="imagens/logo.png" alt="Biblia Fides Logo" className="w-30 h-30 object-contain" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{APP_NAME}</h1>
            <p className="text-xs text-slate-500 font-medium">Seu guia espiritual inteligente</p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
        </button>
      </div>
    </header>
  );
};
