import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User, onAuthStateChanged } from 'firebase/auth';

// Componentes
import { InputArea } from './components/InputArea';
import { ChatMessage } from './components/ChatMessage';
import { Login } from './components/Login';
import { BibleReader } from './components/BibleReader';

// Serviços
import { Message, MessageType } from './types';
import { sendMessageToGemini } from './services/geminiService';
import {
  auth,
  logout,
  getUserChats,
  getChatMessages,
  createNewChat,
  saveMessageToChat
} from './services/firebase';
import { INITIAL_PROMPT } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Navegação
  const [currentView, setCurrentView] = useState<'chat' | 'bible'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Controle de Chat
  const [chatHistoryList, setChatHistoryList] = useState<any[]>([]); // Lista do menu
  const [currentChatId, setCurrentChatId] = useState<string | null>(null); // ID da conversa ativa
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Carregar a Lista de Conversas ao Logar
  useEffect(() => {
    if (user) {
      loadChatList();
    }
  }, [user]);

  const loadChatList = async () => {
    if (!user) return;
    const chats = await getUserChats(user.uid);
    setChatHistoryList(chats);
  };

  // 3. Ação: "Nova Conversa"
  const handleNewChat = () => {
    setCurrentChatId(null); // Remove o ID atual
    setMessages([]); // Limpa a tela
    setCurrentView('chat');
    setIsSidebarOpen(false); // Fecha menu no mobile
  };

  // 4. Ação: Carregar Conversa do Histórico
  const handleLoadChat = async (chatId: string) => {
    setIsLoading(true);
    setCurrentChatId(chatId);
    setCurrentView('chat');
    setIsSidebarOpen(false);
    setMessages([]); // Limpa visualmente antes de carregar

    const dbMessages = await getChatMessages(chatId);

    // Converte formato do Firebase para formato do App
    const formatted: Message[] = [];
    dbMessages.forEach((item: any) => {
      // Pergunta do Usuário
      formatted.push({
        id: item.id + '_user',
        type: MessageType.USER,
        content: item.pergunta,
        timestamp: item.createdAt ? new Date(item.createdAt.seconds * 1000) : new Date(),
      });
      // Resposta do Copiloto
      if (item.texto_biblico) {
        formatted.push({
          id: item.id + '_bot',
          type: MessageType.BOT,
          content: {
            saudacao: item.saudacao,
            texto_biblico: item.texto_biblico,
            referencia: item.referencia,
            explicacao: item.explicacao,
            sentimento_detectado: item.sentimento_detectado,
            referencia_api: item.referencia_api
          },
          timestamp: item.createdAt ? new Date(item.createdAt.seconds * 1000) : new Date(),
        });
      }
    });

    setMessages(formatted);
    setIsLoading(false);
  };

  // 5. Enviar Mensagem (Cria chat ou continua)
  const handleSendMessage = useCallback(async (content: string) => {
    if (!user) return;

    // Mostra mensagem na tela imediatamente
    const userMessage: Message = {
      id: uuidv4(),
      type: MessageType.USER,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Se não tem chat aberto, CRIA UM NOVO agora
      let activeChatId = currentChatId;
      if (!activeChatId) {
        activeChatId = await createNewChat(user.uid, content);
        if (activeChatId) {
          setCurrentChatId(activeChatId);
          loadChatList(); // Atualiza menu lateral com o título novo
        }
      }

      // Pergunta pra IA
      const responseData = await sendMessageToGemini(content);

      // Salva a interação no chat atual
      if (activeChatId) {
        await saveMessageToChat(activeChatId, content, responseData);
      }

      // Mostra resposta na tela
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
  }, [currentChatId, user]);

  useEffect(() => {
    if (currentView === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentView]);

  if (loadingAuth) return <div className="h-screen flex items-center justify-center bg-slate-50">Carregando...</div>;
  if (!user) return <Login onLoginSuccess={(u) => setUser(u)} />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">

      {/* --- MENU LATERAL --- */}
      <aside className={`
        fixed md:relative z-30 w-72 h-full bg-white border-r border-slate-200 shadow-xl md:shadow-none flex flex-col transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-serif font-bold text-lg">BF</div>
            <h1 className="font-bold text-slate-800 text-lg">Biblia Fides</h1>
          </div>

          {/* Botão Nova Conversa */}
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
          >
            <span>+</span> Nova Conversa
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Navegação</div>
            <button
              onClick={() => { setCurrentView('bible'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentView === 'bible' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span>📖</span> Bíblia Sagrada
            </button>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Histórico</div>
            <div className="space-y-1">
              {chatHistoryList.length === 0 && (
                <p className="text-xs text-slate-400 px-4 py-2 italic">Nenhuma conversa recente.</p>
              )}
              {chatHistoryList.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => handleLoadChat(chat.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm truncate transition-colors ${currentChatId === chat.id && currentView === 'chat' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {chat.title}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
              {user.displayName?.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-slate-700 truncate">{user.displayName}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full text-xs text-red-500 hover:text-red-700 text-center py-2">Sair da conta</button>
        </div>
      </aside>

      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* --- ÁREA PRINCIPAL --- */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
        <header className="md:hidden bg-white border-b p-4 flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <span className="font-bold text-slate-700">{currentView === 'chat' ? 'Copiloto' : 'Bíblia'}</span>
          <div className="w-8"></div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          {currentView === 'chat' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
                <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end">

                  {/* Placeholder */}
                  {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-60">
                      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 mb-4">
                        <span className="text-2xl">✝️</span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-2">Olá, {user.displayName?.split(' ')[0]}!</h2>
                      <p className="text-slate-500 max-w-md">Pergunte algo ou escolha um tópico do histórico.</p>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}

                  {isLoading && (
                    <div className="flex justify-start mb-4 pl-2">
                      <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
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

          {currentView === 'bible' && (
            <BibleReader />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;