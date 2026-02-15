import React from 'react';
import { signInWithGoogle } from '../services/firebase';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const handleLogin = async () => {
    const user = await signInWithGoogle();
    if (user) {
      onLoginSuccess(user);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-center px-4">
      <div className="mb-6">
        <img src="imagens/logo.png" alt="Biblia Fides Logo" className="w-82 h-auto object-contain" />
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