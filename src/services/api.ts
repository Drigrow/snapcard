import { CardRecord, PipelineStatus, AppSettings, CardMessage, AuthState } from '../types';

export const API_BASE = '/api';

export class ApiService {
  /**
   * Check current session status
   */
  public static async getAuthStatus(): Promise<AuthState> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
      if (!res.ok) return { isAuthenticated: false, role: 'guest' };
      return res.json();
    } catch (e) {
      return { isAuthenticated: false, role: 'guest' };
    }
  }

  /**
   * Admin Login
   */
  public static async login(params: { username: string; password: string; ttlDays?: number }): Promise<{ success: boolean; user: any; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '登录失败');
    }

    return res.json();
  }

  /**
   * Logout
   */
  public static async logout(): Promise<void> {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
  }

  /**
   * Change password
   */
  public static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '修改密码失败');
    }
  }

  /**
   * Toggle Card Public Status (Admin only)
   */
  public static async togglePublic(cardId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/cards/${cardId}/public`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) throw new Error('Failed to toggle public visibility');
    const data = await res.json();
    return data.isPublic;
  }

  /**
   * SSE Streaming card generation (Admin only)
   */
  public static async generateCardStream(
    params: {
      query: string;
      audience: string;
      needImage: boolean;
      photoUrl?: string;
    },
    settings: AppSettings,
    callbacks: {
      onStatus?: (status: PipelineStatus) => void;
      onCard?: (card: CardRecord) => void;
      onError?: (err: string) => void;
      onComplete?: (result: { cardId: string; success: boolean }) => void;
    }
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/cards/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-openrouter-key': settings.openRouterKey || '',
          'x-tavily-key': settings.tavilyKey || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...params,
          openRouterKey: settings.openRouterKey,
          tavilyKey: settings.tavilyKey,
          model: settings.model,
          imageModel: settings.imageModel,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('访客无权生成卡片，请点击右上角登录管理员 (Admin Login Required)');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;
          const matchEvent = block.match(/event:\s*(.+)/);
          const matchData = block.match(/data:\s*(.+)/);

          if (matchEvent && matchData) {
            const event = matchEvent[1].trim();
            try {
              const data = JSON.parse(matchData[1]);
              if (event === 'status' && callbacks.onStatus) {
                callbacks.onStatus(data);
              } else if (event === 'card' && callbacks.onCard) {
                callbacks.onCard(data);
              } else if (event === 'complete' && callbacks.onComplete) {
                callbacks.onComplete(data);
              } else if (event === 'error' && callbacks.onError) {
                callbacks.onError(data.message || 'Generation error');
              }
            } catch (e) {
              console.warn('[SSE Parse Error]', e, matchData[1]);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[Generate Stream Error]:', err);
      if (callbacks.onError) callbacks.onError(err.message || 'Stream connection failed');
    }
  }

  /**
   * Get Cards (auto-filtered for guests)
   */
  public static async getCards(params?: {
    search?: string;
    tag?: string;
    audience?: string;
    favoriteOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ cards: CardRecord[]; total: number; isGuest?: boolean }> {
    const url = new URL(`${window.location.origin}${API_BASE}/cards`);
    if (params) {
      if (params.search) url.searchParams.set('search', params.search);
      if (params.tag) url.searchParams.set('tag', params.tag);
      if (params.audience) url.searchParams.set('audience', params.audience);
      if (params.favoriteOnly) url.searchParams.set('favoriteOnly', 'true');
      if (params.limit) url.searchParams.set('limit', params.limit.toString());
      if (params.offset) url.searchParams.set('offset', params.offset.toString());
    }

    const res = await fetch(url.toString(), { credentials: 'include' });
    if (!res.ok) throw new Error(`Failed to fetch cards: ${res.status}`);
    return res.json();
  }

  /**
   * Get Single Card + Message History
   */
  public static async getCardById(id: string): Promise<{ card: CardRecord; messages: CardMessage[]; isGuest?: boolean }> {
    const res = await fetch(`${API_BASE}/cards/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error(`Card not found or access restricted: ${res.status}`);
    return res.json();
  }

  /**
   * Toggle Favorite (Admin only)
   */
  public static async toggleFavorite(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/cards/${id}/favorite`, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to toggle favorite');
    const data = await res.json();
    return data.isFavorite;
  }

  /**
   * Delete Card (Admin only)
   */
  public static async deleteCard(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/cards/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to delete card');
    const data = await res.json();
    return data.success;
  }

  /**
   * In-Card Follow-up Q&A (Admin only)
   */
  public static async askFollowUp(
    cardId: string,
    question: string,
    settings: AppSettings
  ): Promise<string> {
    const res = await fetch(`${API_BASE}/cards/${cardId}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-openrouter-key': settings.openRouterKey || '',
      },
      credentials: 'include',
      body: JSON.stringify({
        question,
        openRouterKey: settings.openRouterKey,
        model: settings.model,
      }),
    });

    if (!res.ok) throw new Error('Follow-up request failed');
    const data = await res.json();
    return data.answer;
  }

  /**
   * Photo Upload (Admin only)
   */
  public static async uploadPhoto(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!res.ok) throw new Error('Photo upload failed');
    const data = await res.json();
    return data.url;
  }

  /**
   * Verify Keys
   */
  public static async verifySettings(openRouterKey: string, tavilyKey: string) {
    const res = await fetch(`${API_BASE}/settings/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ openRouterKey, tavilyKey }),
    });
    return res.json();
  }
}
