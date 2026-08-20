export type AudienceTier = 'student' | 'general' | 'expert';

export interface CardImage {
  url: string;
  alt?: string;
  source: 'web' | 'generated' | 'uploaded';
}

export interface CardRecord {
  id: string;
  title: string;
  oneLiner?: string;
  audience: AudienceTier;
  content: string;
  diagram?: string | null;
  images: CardImage[];
  tags: string[];
  language: string;
  query: string;
  isFavorite: boolean;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CardMessage {
  id: string;
  cardId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export type PipelineStep = 'intent' | 'search' | 'reasoning' | 'image_gen' | 'synthesis' | 'complete';

export interface PipelineStatus {
  step: PipelineStep;
  message: string;
  stepNumber: number;
  totalSteps: number;
}

export interface AppSettings {
  openRouterKey: string;
  tavilyKey: string;
  model: string;
  imageModel: string;
  theme: 'dark' | 'light';
  language: 'zh' | 'en' | 'auto';
  authTtlDays?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  role: 'admin' | 'guest';
  username?: string;
}
