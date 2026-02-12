import { GoogleGenAI, Type, Schema } from "@google/genai";
import { db, auth } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { BibleResponseData } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

// Configuração da API Key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// 1. CORREÇÃO DO SCHEMA: Adicionamos o objeto 'referencia_api' aqui
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    saudacao: { type: Type.STRING },
    texto_biblico: { type: Type.STRING },
    referencia: { type: Type.STRING },
    explicacao: { type: Type.STRING },
    sentimento_detectado: { type: Type.STRING },
    // Adicionando a estrutura para a API da Bíblia
    referencia_api: {
      type: Type.OBJECT,
      properties: {
        livro_abrev: { type: Type.STRING },
        capitulo: { type: Type.NUMBER },
        versiculo: { type: Type.NUMBER },
      },
      required: ["livro_abrev", "capitulo", "versiculo"],
    },
  },
  required: ["saudacao", "texto_biblico", "referencia", "explicacao", "sentimento_detectado", "referencia_api"],
};

export const sendMessageToGemini = async (userMessage: string): Promise<BibleResponseData> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    // 2. CORREÇÃO DO MÉTODO: Adicionamos os parênteses ()
    // Verifica se existe a função text() antes de chamar
    const responseText = typeof response.text === 'function' ? response.text() : response.text;

    if (!responseText) {
      throw new Error("No response text received from Gemini.");
    }

    const data: BibleResponseData = JSON.parse(responseText);

    saveToHistory(userMessage, data);

    return data;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return {
      saudacao: "Olá.",
      texto_biblico: "Não foi possível processar sua solicitação no momento.",
      referencia: "Erro do Sistema",
      explicacao: "Por favor, verifique sua conexão ou tente novamente mais tarde.",
      sentimento_detectado: "Erro",
    };
  }
};

async function saveToHistory(userMessage: string, aiResponse: BibleResponseData) {
  try {
    const user = auth.currentUser;

    if (!user) {
      console.warn("Usuário não logado. Histórico não será salvo.");
      return;
    }

    await addDoc(collection(db, "historico_copiloto"), {
      usuario_id: user.uid,
      pergunta: userMessage,
      ...aiResponse,
      data_interacao: serverTimestamp()
    });

    console.log("✅ Conversa salva no Firestore para o usuário:", user.uid);
  } catch (error) {
    console.error("❌ Erro ao salvar no Firestore:", error);
  }
}