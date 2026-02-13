import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  where,
  addDoc
} from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { BibleResponseData } from "../types";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e exporta os serviços
export const auth = getAuth(app);
export const db = getFirestore(app);

// Inicialização segura do Analytics
export let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch((err) => {
  console.warn("Analytics not supported in this environment:", err);
});

// ==========================================================
// MÉTODOS DE AUTENTICAÇÃO
// ==========================================================

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Erro no login:", error);
    return null;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro ao sair:", error);
  }
};

// ==========================================================
// MÉTODOS DE HISTÓRICO
// ==========================================================

export interface HistoricoItem {
  id: string;
  pergunta: string;
  resposta: BibleResponseData;
  data: any;
}

export const getHistory = async (userId: string): Promise<HistoricoItem[]> => {
  if (!userId) return [];

  try {
    const historyRef = collection(db, "historico_copiloto");

    const q = query(
      historyRef,
      where("usuario_id", "==", userId)
      // orderBy("data_interacao", "asc") // Removido temporariamente para evitar erro de índice
    );

    const querySnapshot = await getDocs(q);

    console.log("Histórico buscado (docs):", querySnapshot.size);

    const items = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        pergunta: data.pergunta,
        resposta: {
          saudacao: data.saudacao || "",
          texto_biblico: data.texto_biblico || "",
          referencia: data.referencia || "",
          explicacao: data.explicacao || "",
          sentimento_detectado: data.sentimento_detectado || "",
          referencia_api: data.referencia_api || null
        },
        data: data.data_interacao
      };
    });

    // Ordenar em memória
    return items.sort((a, b) => {
      const dateA = a.data ? new Date(a.data.seconds * 1000) : new Date(0);
      const dateB = b.data ? new Date(b.data.seconds * 1000) : new Date(0);
      return dateA.getTime() - dateB.getTime();
    });

  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return [];
  }
};

export const saveHistory = async (userId: string, pergunta: string, resposta: BibleResponseData) => {
  try {
    // Sanitize data to remove undefined values which Firestore does not support
    const sanitizedResponse = {
      saudacao: resposta.saudacao || "",
      texto_biblico: resposta.texto_biblico || "",
      referencia: resposta.referencia || "",
      explicacao: resposta.explicacao || "",
      sentimento_detectado: resposta.sentimento_detectado || "",
      referencia_api: resposta.referencia_api || null
    };

    await addDoc(collection(db, "historico_copiloto"), {
      usuario_id: userId,
      pergunta: pergunta,
      ...sanitizedResponse,
      data_interacao: new Date()
    });
  } catch (error) {
    console.error("Erro ao salvar histórico:", error);
  }
};

export default app;