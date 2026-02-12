import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User, onAuthStateChanged } from 'firebase/auth';

// Componentes
// Removi o Header pois teremos o Menu Lateral
import { InputArea } from './components/InputArea';
import { ChatMessage } from './components/ChatMessage';
import { Login } from './components/Login';
import { BibleReader } from './components/BibleReader'; // <--- O componente novo!

// Serviços e Tipos
import { Message, MessageType } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { getHistory, auth, logout } from './services/firebase';
import { INITIAL_PROMPT } from './constants';

const App: React.FC = () => {
  // Estado do Usuário
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Estado de Navegação (Chat ou Bíblia)
  const [currentView, setCurrentView] = useState<'chat' | 'bible'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Estados do Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Monitorar Login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Carregar Histórico
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const historyData = await getHistory(user.uid);
        const formattedMessages: Message[] = [];
        historyData.forEach((item) => {
          formattedMessages.push({
            id: item.id + '_user',
            type: MessageType.USER,
            content: item.pergunta,
            timestamp: item.data ? new Date(item.data.seconds * 1000) : new Date(),
          });
          if (item.resposta) {
            formattedMessages.push({
              id: item.id + '_bot',
              type: MessageType.BOT,
              content: item.resposta,
              timestamp: item.data ? new Date(item.data.seconds * 1000) : new Date(),
            });
          }
        });
        setMessages(formattedMessages);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      }
    };
    fetchHistory();
  }, [user]);

  // Scroll automático (só no chat)
  useEffect(() => {
    if (currentView === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentView]);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: uuidv4(),
      type: MessageType.USER,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const responseData = await sendMessageToGemini(content);
      const botMessage: Message = {
        id: uuidv4(),
        type: MessageType.BOT,
        content: responseData,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Failed to get response", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (loadingAuth) return <div className="h-screen flex items-center justify-center bg-slate-50">Carregando...</div>;
  if (!user) return <Login onLoginSuccess={(u) => setUser(u)} />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">

      {/* --- MENU LATERAL (SIDEBAR) --- */}
      <aside className={`
        fixed md:relative z-30 w-72 h-full bg-white border-r border-slate-200 shadow-xl md:shadow-none transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl shadow-md">
                <img src="imagens/logo.png" alt="Biblia Fides Logo" className="w-82 h-auto object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-slate-800 text-lg leading-tight">Biblia Fides</h1>
                <p className="text-xs text-slate-400">Versão 1.0</p>
              </div>
            </div>
          </div>

          {/* Navegação */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Menu</div>

            <button
              onClick={() => { setCurrentView('chat'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${currentView === 'chat' ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">💬</span>
              Copiloto IA
            </button>

            <button
              onClick={() => { setCurrentView('bible'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${currentView === 'bible' ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">📖</span>
              Bíblia Sagrada
            </button>
          </nav>

          {/* Rodapé com Usuário e Logout */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4 p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                {user.displayName?.charAt(0)}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-semibold text-slate-700 truncate">{user.displayName}</p>
                <p className="text-[10px] text-slate-400 truncate uppercase tracking-wide">Conta Gratuita</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay para Celular */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- ÁREA PRINCIPAL --- */}
      <div className="flex-1 flex flex-col h-full relative w-full bg-slate-50">

        {/* Header Mobile (Só aparece no celular) */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <span className="font-bold text-slate-700">{currentView === 'chat' ? 'Copiloto' : 'Bíblia Sagrada'}</span>
          <div className="w-8"></div>
        </header>

        <main className="flex-1 overflow-hidden relative">

          {/* TELA 1: CHAT */}
          {currentView === 'chat' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
                <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end">

                  {/* Placeholder de Boas-vindas */}
                  {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-60">
                      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 mb-4 animate-bounce-slow">
                        <span className="text-2xl">✝️</span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-2">Olá, {user.displayName?.split(' ')[0]}!</h2>
                      <p className="text-slate-500 max-w-md">A paz esteja com você. O que gostaria de explorar nas escrituras hoje?</p>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}

                  {isLoading && (
                    <div className="flex justify-start mb-4 pl-2">
                      <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex items-center gap-3">
                        <div className="flex space-x-1.5">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">Escrevendo...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div className="p-4 bg-white border-t border-slate-200">
                <div className="max-w-4xl mx-auto">
                  <InputArea
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    initialValue={messages.length === 0 ? INITIAL_PROMPT : ''}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TELA 2: LEITOR DA BÍBLIA */}
          {currentView === 'bible' && (
            <BibleReader />
          )}

        </main>
      </div>
    </div>
  );
};

export default App;