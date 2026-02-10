import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User, onAuthStateChanged } from 'firebase/auth'; // Tipos do Firebase Auth

// Componentes
import { Header } from './components/Header';
import { InputArea } from './components/InputArea';
import { ChatMessage } from './components/ChatMessage';
import { Login } from './components/Login'; // <--- Importando a tela de Login

// Serviços e Tipos
import { Message, MessageType } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { getHistory, auth, logout } from './services/firebase'; // <--- Importando Auth
import { INITIAL_PROMPT } from './constants';

const App: React.FC = () => {
  // Estado do Usuário Logado
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Estados do Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. EFEITO: Monitorar Autenticação (Login/Logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe(); // Limpa o listener ao fechar
  }, []);

  // 2. EFEITO: Carregar histórico quando o usuário muda
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return; // Se não tem usuário, não busca nada

      try {
        // Passamos o UID do usuário para buscar SÓ as conversas dele
        const historyData = await getHistory(user.uid); 
        const formattedMessages: Message[] = [];

        historyData.forEach((item) => {
          // A. Mensagem do Usuário
          formattedMessages.push({
            id: item.id + '_user',
            type: MessageType.USER,
            content: item.pergunta,
            timestamp: item.data ? new Date(item.data.seconds * 1000) : new Date(),
          });

          // B. Mensagem do Bot
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
  }, [user]); // Roda sempre que o 'user' muda (logou ou deslogou)

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  // Renderização Condicional

  // A. Carregando (verificando se está logado)
  if (loadingAuth) {
    return <div className="h-screen flex items-center justify-center bg-slate-50">Carregando...</div>;
  }

  // B. Não logado -> Mostra Tela de Login
  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  // C. Logado -> Mostra o Chat
  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden relative">
      <Header />
      
      {/* Botão de Sair (Logout) posicionado no topo direito */}
      <button 
        onClick={logout}
        className="absolute top-4 right-4 text-xs font-medium text-slate-500 hover:text-red-500 bg-white/80 px-3 py-1 rounded-full border border-slate-200 z-50"
      >
        Sair ({user.displayName?.split(' ')[0]})
      </button>

      <main className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end">
            
            {/* Placeholder de Boas-vindas (Personalizado) */}
            {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-60">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                      Olá, {user.displayName?.split(' ')[0]}!
                    </h2>
                    <p className="text-slate-500 max-w-md">
                        A paz esteja com você. O que gostaria de explorar nas escrituras hoje?
                    </p>
                </div>
            )}
            
            {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
            ))}

            {isLoading && (
              <div className="flex justify-start mb-4">
                 <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                 </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
        </div>
      </main>

      <InputArea 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading} 
        initialValue={messages.length === 0 ? INITIAL_PROMPT : ''}
      />
    </div>
  );
};

export default App;