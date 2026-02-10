import { GoogleGenAI, Type, Schema } from "@google/genai";
import { db, auth } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { BibleResponseData } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";


// Configuração da API Key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    saudacao: { type: Type.STRING },
    texto_biblico: { type: Type.STRING },
    referencia: { type: Type.STRING },
    explicacao: { type: Type.STRING },
    sentimento_detectado: { type: Type.STRING },
  },
  required: ["saudacao", "texto_biblico", "referencia", "explicacao", "sentimento_detectado"],
};

export const sendMessageToGemini = async (userMessage: string): Promise<BibleResponseData> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const responseText = response.text();

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