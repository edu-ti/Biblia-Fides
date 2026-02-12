import React, { useState } from 'react';
import { Message, MessageType, BibleResponseData } from '../types';
import { getChapter } from '../services/bibleApi'; // <--- Importando a API

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  // Estados para controlar o Modal de Leitura
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chapterContent, setChapterContent] = useState<any>(null);
  const [isLoadingBible, setIsLoadingBible] = useState(false);

  const isUser = message.type === MessageType.USER;

  // Função para buscar o capítulo na API
  const handleOpenBible = async (book: string, chapter: number) => {
    setIsModalOpen(true);
    setIsLoadingBible(true);

    try {
      // Chama sua API (por padrão NVI)
      const data = await getChapter('nvi', book, chapter);
      setChapterContent(data);
    } catch (error) {
      console.error("Erro ao carregar bíblia", error);
      alert("Não foi possível carregar o capítulo. Tente novamente.");
      setIsModalOpen(false);
    } finally {
      setIsLoadingBible(false);
    }
  };

  // Renderização da Mensagem do Usuário
  if (isUser) {
    return (
      <div className="flex justify-end mb-6 animate-fade-in-up">
        <div className="bg-indigo-600 text-white py-3 px-5 rounded-2xl rounded-tr-none shadow-md max-w-[85%] md:max-w-[70%]">
          <p className="text-sm md:text-base leading-relaxed">{message.content as string}</p>
        </div>
      </div>
    );
  }

  // Renderização da Mensagem do Bot
  const data = message.content as BibleResponseData;

  return (
    <>
      <div className="flex justify-start mb-8 animate-fade-in-up">
        <div className="flex gap-3 max-w-full md:max-w-[85%]">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-serif font-bold shadow mt-1">
            BF
          </div>

          <div className="flex flex-col gap-2 w-full">
            <div className="text-sm font-semibold text-slate-500 ml-1">
              {data.saudacao}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-lg overflow-hidden">
              {/* Tag de Sentimento */}
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Insight Bíblico</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {data.sentimento_detectado}
                </span>
              </div>

              <div className="p-5 md:p-6">
                {/* Versículo Destacado */}
                <blockquote className="relative mb-6">
                  <svg className="absolute top-0 left-0 transform -translate-x-3 -translate-y-4 h-8 w-8 text-indigo-100" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                    <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                  </svg>
                  <p className="font-serif text-lg md:text-xl text-slate-800 italic leading-relaxed relative z-10 pl-2">
                    "{data.texto_biblico}"
                  </p>
                  <footer className="mt-3 text-right">
                    <cite className="not-italic text-sm font-bold text-indigo-600">
                      — {data.referencia}
                    </cite>
                  </footer>
                </blockquote>

                {/* Explicação */}
                <div className="bg-slate-50 rounded-xl p-4 text-slate-700 text-sm md:text-base leading-relaxed border border-slate-100">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                    Explicação & Contexto
                  </h4>
                  {data.explicacao}
                </div>

                {/* Botão de Ler Capítulo - AGORA FUNCIONAL */}
                {data.referencia_api && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <button
                      className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-3 px-4 rounded-lg transition-colors border border-indigo-100"
                      onClick={() => handleOpenBible(data.referencia_api!.livro_abrev, data.referencia_api!.capitulo)}
                    >
                      <span>📖</span> Ler {data.referencia_api.livro_abrev.toUpperCase()} {data.referencia_api.capitulo} Completo (NVI)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE LEITURA DA BÍBLIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">

            {/* Cabeçalho do Modal */}
            <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg capitalize">
                {isLoadingBible ? 'Carregando...' : (
                  chapterContent ? `${chapterContent.book.name} ${chapterContent.chapter.number}` : 'Bíblia Sagrada'
                )}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-indigo-700 p-2 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            {/* Conteúdo do Modal (Texto) */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {isLoadingBible ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
              ) : chapterContent ? (
                <div className="prose prose-indigo max-w-none">
                  {chapterContent.verses.map((verse: any) => (
                    <p key={verse.number} className="mb-2 text-slate-700 leading-relaxed">
                      <span className="text-xs font-bold text-indigo-400 align-top mr-1 select-none">{verse.number}</span>
                      {verse.text}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500">Não foi possível carregar o texto.</p>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-slate-100 bg-white text-center text-xs text-slate-400">
              Fonte: ABiblia Digital (NVI)
            </div>
          </div>
        </div>
      )}
    </>
  );
};