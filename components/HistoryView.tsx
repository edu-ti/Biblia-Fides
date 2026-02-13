import React from 'react';
import { Message, MessageType, BibleResponseData } from '../types';

interface HistoryViewProps {
    messages: Message[];
    onBackToChat: () => void;
    onSelectMessage: (messageId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ messages, onBackToChat, onSelectMessage }) => {



    // Group messages by date? For now, just a linear list, but styled differently than the chat.
    // Actually, a simple list of interactions (User Question -> Bot Answer) might be better,
    // but since we have a flat list of messages, we'll render them linearly.
    // Reverse order (newest first) might be better for "History".

    // Filter out empty messages if any
    const validMessages = messages.filter(m => m.content);

    // Group by "conversation" (approximate - usually User then Bot)
    // iterate and pair them up
    const interactions = [];
    for (let i = 0; i < validMessages.length; i++) {
        const msg = validMessages[i];
        if (msg.type === MessageType.USER) {
            const nextMsg = validMessages[i + 1];
            const botResponse = (nextMsg && nextMsg.type === MessageType.BOT) ? nextMsg : null;
            interactions.push({ user: msg, bot: botResponse });
            // Skip next if it was bot
            if (botResponse) i++;
        } else if (msg.type === MessageType.BOT && i === 0) {
            // Orphaned bot message at start (shouldn't happen often but possible)
            interactions.push({ user: null, bot: msg });
        }
    }

    // Reverse to show newest interactions at top
    const reversedInteractions = [...interactions].reverse();

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Histórico de Conversas</h2>
                    <p className="text-sm text-slate-500">Suas interações anteriores com o Fides Chat IA</p>
                </div>
                <button
                    onClick={onBackToChat}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                >
                    Voltar ao Chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
                {reversedInteractions.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <p>Nenhuma conversa encontrada no histórico.</p>
                    </div>
                ) : (
                    reversedInteractions.map((interaction, idx) => (
                        <div
                            key={idx}
                            onClick={() => interaction.user && onSelectMessage(interaction.user.id)}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
                        >
                            {/* User Question */}
                            {interaction.user && (
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex gap-3">
                                    <div className="mt-1 min-w-[32px] w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
                                        VC
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-semibold mb-1">
                                            {new Date(interaction.user.timestamp).toLocaleString()}
                                        </p>
                                        <p className="text-slate-800 font-medium">
                                            {typeof interaction.user.content === 'string'
                                                ? interaction.user.content
                                                : 'Conteúdo estruturado'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Bot Response Preview */}
                            {interaction.bot && (
                                <div className="p-4 flex gap-3">
                                    <div className="mt-1 min-w-[32px] w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                        IA
                                    </div>
                                    <div className="flex-1">
                                        <div className="prose prose-sm max-w-none text-slate-600">
                                            {typeof interaction.bot.content === 'string' ? (
                                                <p className="line-clamp-3">{interaction.bot.content}</p>
                                            ) : (
                                                <div>
                                                    <p className="font-serif italic text-slate-800 mb-2">
                                                        "{(interaction.bot.content as BibleResponseData).referencia}"
                                                    </p>
                                                    <p className="line-clamp-2">
                                                        {(interaction.bot.content as BibleResponseData).explicacao}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
