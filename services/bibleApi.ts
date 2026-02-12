import axios from 'axios';

// URL base da ABiblia Digital
const BASE_URL = 'https://www.abibliadigital.com.br/api';
const TOKEN = import.meta.env.VITE_BIBLE_API_TOKEN;

// Configuração do Header com Token
const config = {
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
};

export interface BibleVerse {
  book: {
    name: string;
    author: string;
    group: string;
  };
  chapter: number;
  number: number;
  text: string;
}

// 1. Versículo Específico
export const getVerse = async (
  version: string = 'nvi',
  bookAbbrev: string,
  chapter: number,
  number: number
): Promise<BibleVerse | null> => {
  try {
    const safeAbbrev = bookAbbrev.toLowerCase(); // <--- AJUSTE IMPORTANTE
    const response = await axios.get(`${BASE_URL}/verses/${version}/${safeAbbrev}/${chapter}/${number}`, config);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar versículo ${bookAbbrev} ${chapter}:${number}`, error);
    return null;
  }
};

// 2. Capítulo Inteiro (Usado no Leitor)
export const getChapter = async (
  version: string = 'nvi',
  bookAbbrev: string,
  chapter: number
) => {
  try {
    const safeAbbrev = bookAbbrev.toLowerCase(); // <--- AJUSTE IMPORTANTE
    const response = await axios.get(`${BASE_URL}/verses/${version}/${safeAbbrev}/${chapter}`, config);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar capítulo:", error);
    return null;
  }
};

// 3. Listar Livros
export const getBooks = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/books`, config);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar livros:", error);
    return [];
  }
};