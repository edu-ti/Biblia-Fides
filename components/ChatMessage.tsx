import React from 'react';
import { Message, MessageType, BibleResponseData } from '../types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.type === MessageType.USER;

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 animate-fade-in-up">
        <div className="bg-indigo-600 text-white py-3 px-5 rounded-2xl rounded-tr-none shadow-md max-w-[85%] md:max-w-[70%]">
          <p className="text-sm md:text-base leading-relaxed">{message.content as string}</p>
        </div>
      </div>
    );
  }

  // Render Bot Message (Structured JSON)
  const data = message.content as BibleResponseData;

  return (
    <div className="flex justify-start mb-8 animate-fade-in-up">
      <div className="flex gap-3 max-w-full md:max-w-[85%]">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-serif font-bold shadow mt-1">
          BF
        </div>

        <div className="flex flex-col gap-2 w-full">
          {/* Greeting */}
          <div className="text-sm font-semibold text-slate-500 ml-1">
            {data.saudacao}
          </div>

          {/* Main Content Card */}
          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-lg overflow-hidden">
            {/* Sentiment Tag */}
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Insight Bíblico</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {data.sentimento_detectado}
              </span>
            </div>

            <div className="p-5 md:p-6">
              {/* Verse */}
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

              {/* Explanation */}
              <div className="bg-slate-50 rounded-xl p-4 text-slate-700 text-sm md:text-base leading-relaxed border border-slate-100">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                  Explicação & Contexto
                </h4>
                {data.explicacao}
              </div>

              {/* Botão de Ler Capítulo */}
              {data.referencia_api && (
                <button
                  className="mt-4 w-full flex items-center justify-center gap-2 text-xs bg-indigo-50 text-indigo-700 font-semibold px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                  onClick={() => {
                    alert(`Abrindo ${data.referencia_api?.livro_abrev} capítulo ${data.referencia_api?.capitulo}...`);
                  }}
                >
                  <span>📖</span> Ler {data.referencia_api.livro_abrev.toUpperCase()} {data.referencia_api.capitulo} Completo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};