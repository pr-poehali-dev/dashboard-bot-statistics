const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000/api';

interface Bot {
  uid: number;
  bot_id: number;
  username: string;
  admin_id: number;
  ref_percent: number;
  balance: number;
  status: string;
  meta?: Record<string, any>;
}

interface Payment {
  bill_id: string;
  user_id: number;
  bot_id: number;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  meta?: Record<string, any>;
}

interface User {
  uid: number;
  user_id: number;
  username?: string;
  invited?: string;
  reg_date: string;
  ref_percent: number;
  bot_id: number;
  meta?: Record<string, any>;
}

interface Subscription {
  uid: number;
  sub_uid: string;
  sub_url: string;
  user_id: number;
  bot_id: number;
  status: 'Active' | 'Expired' | 'Notified';
  start_date: string;
  stop_date: string;
  meta: Record<string, any>;
  keys: Record<string, any>;
}

interface AnalyticsData {
  registrations: number;
  payments: number;
  trials: number;
  keys: number;
  renewals: number;
  date: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    headers: Record<string, string> = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: 'Network error' 
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Авторизация
  async verifyTelegramAuth(initData: string): Promise<{ user: User; token: string }> {
    return this.request('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ init_data: initData }),
    });
  }

  // Получить список ботов пользователя
  async getUserBots(headers: Record<string, string>): Promise<Bot[]> {
    return this.request('/bots', {}, headers);
  }

  // Получить аналитику конкретного бота
  async getBotAnalytics(
    botId: number,
    startDate: string,
    endDate: string,
    headers: Record<string, string>
  ): Promise<AnalyticsData[]> {
    const params = new URLSearchParams({
      bot_id: botId.toString(),
      start_date: startDate,
      end_date: endDate,
    });

    return this.request(`/analytics?${params}`, {}, headers);
  }

  // Получить пользователей бота
  async getBotUsers(
    botId: number,
    page: number = 1,
    limit: number = 100,
    headers: Record<string, string>
  ): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams({
      bot_id: botId.toString(),
      page: page.toString(),
      limit: limit.toString(),
    });

    return this.request(`/users?${params}`, {}, headers);
  }

  // Получить платежи бота
  async getBotPayments(
    botId: number,
    startDate?: string,
    endDate?: string,
    headers: Record<string, string> = {},
    page: number = 1,
    limit: number = 100
  ): Promise<{ payments: Payment[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams({
      bot_id: botId.toString(),
      page: page.toString(),
      limit: limit.toString(),
    });

    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    return this.request(`/payments?${params}`, {}, headers);
  }

  // Получить подписки бота
  async getBotSubscriptions(
    botId: number,
    status?: 'Active' | 'Expired' | 'Notified',
    headers: Record<string, string> = {},
    page: number = 1,
    limit: number = 100
  ): Promise<{ subscriptions: Subscription[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams({
      bot_id: botId.toString(),
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) params.append('status', status);

    return this.request(`/subscriptions?${params}`, {}, headers);
  }

  // Получить сводную статистику
  async getBotSummary(
    botId: number,
    headers: Record<string, string>
  ): Promise<{
    total_users: number;
    active_users: number;
    new_users_month: number;
    total_revenue: number;
    monthly_revenue: number;
    average_check: number;
  }> {
    return this.request(`/bots/${botId}/summary`, {}, headers);
  }
}

export const apiService = new ApiService();
export type { Bot, Payment, User, Subscription, AnalyticsData };