export interface AIMessage {
  _id?: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  structuredData?: any;
  createdAt?: string;
}

export interface AISession {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

