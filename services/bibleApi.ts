import axios from 'axios';

// URL base da ABiblia Digital
const BASE_URL = 'https://www.abibliadigital.com.br/api';

// Tipagem do Versículo que vem da API
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

// 1. Função para pegar um versículo específico
// Ex: getVerse('nvi', 'sl', 23, 1) -> Salmos 23:1
export const getVerse = async (
  version: string = 'nvi', 
  bookAbbrev: string, 
  chapter: number, 
  number: number
): Promise<BibleVerse | null> => {
  try {
    const response = await axios.get(`${BASE_URL}/verses/${version}/${bookAbbrev}/${chapter}/${number}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar versículo ${bookAbbrev} ${chapter}:${number}`, error);
    return null;
  }
};

// 2. Função para pegar um capítulo inteiro (para leitura)
export const getChapter = async (
  version: string = 'nvi', 
  bookAbbrev: string, 
  chapter: number
) => {
  try {
    const response = await axios.get(`${BASE_URL}/verses/${version}/${bookAbbrev}/${chapter}`);
    return response.data; // Retorna array de versículos
  } catch (error) {
    console.error("Erro ao buscar capítulo:", error);
    return null;
  }
};

// 3. Função para listar todos os livros (para criar um menu)
export const getBooks = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/books`);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar livros:", error);
    return [];
  }
};