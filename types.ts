export enum MessageType {
  USER = 'USER',
  BOT = 'BOT'
}

export interface BibleResponseData {
  saudacao: string;
  texto_biblico: string;
  referencia: string;
  explicacao: string;
  sentimento_detectado: string;
  // Novo campo para integração com a API
  referencia_api?: {
    livro_abrev: string;
    capitulo: number;
    versiculo: number;
  };
}

export interface Message {
  id: string;
  type: MessageType;
  content: string | BibleResponseData; // User sends string, Bot returns structured data
  timestamp: Date;
}
