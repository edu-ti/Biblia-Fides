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
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  doc,
  setDoc
} from 'firebase/firestore';
import { BibleResponseData } from "../types";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- Auth ---
const googleProvider = new GoogleAuthProvider();
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
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

// --- Gestão de Chat (NOVA LÓGICA) ---

// 1. Criar uma nova conversa (Sessão separada)
export const createNewChat = async (userId: string, firstMessage: string) => {
  try {
    const chatRef = await addDoc(collection(db, "chats"), {
      userId: userId,
      title: firstMessage.substring(0, 30) + "...", // Título automático
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return chatRef.id;
  } catch (error) {
    console.error("Erro ao criar chat:", error);
    return null;
  }
};

// 2. Salvar mensagem dentro de uma conversa específica
export const saveMessageToChat = async (chatId: string, userMessage: string, aiResponse: BibleResponseData) => {
  try {
    // Salva na subcoleção 'messages'
    await addDoc(collection(db, "chats", chatId, "messages"), {
      pergunta: userMessage,
      ...aiResponse,
      createdAt: serverTimestamp()
    });

    // Atualiza a data da conversa principal (para ela subir no topo da lista)
    const chatRef = doc(db, "chats", chatId);
    await setDoc(chatRef, { updatedAt: serverTimestamp() }, { merge: true });

  } catch (error) {
    console.error("Erro ao salvar mensagem:", error);
  }
};

// 3. Listar conversas para o Menu Lateral
export const getUserChats = async (userId: string) => {
  try {
    const q = query(
      collection(db, "chats"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title || "Nova Conversa",
      ...doc.data()
    }));
  } catch (error) {
    console.error("Erro ao buscar chats:", error);
    return [];
  }
};

// 4. Carregar mensagens de UMA conversa específica (ao clicar no histórico)
export const getChatMessages = async (chatId: string) => {
  try {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Erro ao carregar mensagens:", error);
    return [];
  }
};

// Mantemos a função antiga apenas para não quebrar nada legado, mas não usaremos mais
export const getHistory = async (userId: string) => { return []; };