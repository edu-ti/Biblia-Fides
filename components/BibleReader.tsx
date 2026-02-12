import React, { useState, useEffect } from 'react';
// Note que voltamos um nível (..) para acessar a pasta data
import { bibleBooks } from '../data/bibleBooks';
import { getChapter } from '../services/bibleApi';

export const BibleReader: React.FC = () => {
    const [selectedBook, setSelectedBook] = useState(bibleBooks[0]);
    const [selectedChapter, setSelectedChapter] = useState(1);
    const [chapterContent, setChapterContent] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        async function loadChapter() {
            setChapterContent(null); // Limpa conteúdo anterior para evitar titulo errado
            setLoading(true);
            try {
                // Busca na API (padrão NVI)
                const data = await getChapter('nvi', selectedBook.abbrev, selectedChapter);
                setChapterContent(data);
            } catch (error: any) {
                console.error("Falha ao carregar capítulo", error);
                setErrorMessage(error.message || "Erro desconhecido");
            } finally {
                setLoading(false);
            }
        }
        loadChapter();
    }, [selectedBook, selectedChapter]);

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Barra de Seleção Fixa no Topo */}
            <div className="p-4 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10 flex gap-2 justify-center">

                <select
                    className="p-2 border border-slate-300 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={selectedBook.abbrev}
                    onChange={(e) => {
                        const book = bibleBooks.find(b => b.abbrev === e.target.value);
                        if (book) {
                            setSelectedBook(book);
                            setSelectedChapter(1);
                        }
                    }}
                >
                    {bibleBooks.map(book => (
                        <option key={book.abbrev} value={book.abbrev}>{book.name}</option>
                    ))}
                </select>

                <select
                    className="p-2 border border-slate-300 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(Number(e.target.value))}
                >
                    {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>Cap. {num}</option>
                    ))}
                </select>
            </div>

            {/* Área de Texto */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
                <div className="max-w-3xl mx-auto bg-white p-6 md:p-10 rounded-xl shadow-sm border border-slate-100 min-h-[500px]">
                    <h2 className="text-3xl font-serif text-slate-800 mb-6 text-center pb-4 border-b border-slate-100">
                        {selectedBook.name} {selectedChapter}
                    </h2>

                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : chapterContent ? (
                        <div className="prose prose-lg prose-indigo max-w-none text-slate-700 leading-relaxed font-serif">
                            {chapterContent.verses.map((verse: any) => (
                                <p key={verse.number} className="mb-2 hover:bg-yellow-50 transition-colors rounded px-1">
                                    <span className="text-xs font-bold text-indigo-500 align-top mr-1 select-none">{verse.number}</span>
                                    {verse.text}
                                </p>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-red-500 mb-2">Não foi possível carregar o texto.</p>
                            <p className="text-xs text-red-400 font-mono mb-2">{errorMessage}</p>
                            <p className="text-sm text-slate-400">Verifique sua conexão ou tente novamente.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};