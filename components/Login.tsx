import React from 'react';
import { loginWithGoogle } from '../services/firebase';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const handleLogin = async () => {
    const user = await loginWithGoogle();
    if (user) {
      onLoginSuccess(user);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-center px-4">
      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
         {/* Ícone de Cruz/Fé estilizado */}
         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
         </svg>
      </div>
      
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Bem-vindo ao Biblia Fides</h1>
      <p className="text-slate-500 mb-8 max-w-md">
        Seu copiloto inteligente para explorar as escrituras. Faça login para salvar seu histórico e devocionais.
      </p>

      <button
        onClick={handleLogin}
        className="flex items-center gap-3 bg-white text-slate-700 font-medium py-3 px-6 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-all"
      >
        <img 
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
          alt="Google Logo" 
          className="w-5 h-5"
        />
        Entrar com Google
      </button>
    </div>
  );
};