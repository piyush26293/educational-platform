import type {
  AdminOverview,
  DashboardData,
  QuestionDetail,
  QuestionListItem,
  QuizDetail,
  QuizListItem,
  QuizQuestion,
  Topic,
  User,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function register(payload: { name: string; email: string; password: string }) {
  return request<{ token: string; user: User }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function login(payload: { email: string; password: string }) {
  return request<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMe() {
  return request<{ user: User }>('/api/auth/me');
}

export async function getTopics() {
  return request<{ topics: Topic[] }>('/api/topics');
}

export async function getTopic(slug: string) {
  return request<{ topic: Topic; questions: QuestionListItem[] }>(`/api/topics/${slug}`);
}

export async function getQuestions(params?: { search?: string; topic?: string; difficulty?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.topic) query.set('topic', params.topic);
  if (params?.difficulty) query.set('difficulty', params.difficulty);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request<{ questions: QuestionListItem[] }>(`/api/questions${suffix}`);
}

export async function getQuestion(slug: string) {
  return request<{ question: QuestionDetail }>(`/api/questions/${slug}`);
}

export async function getQuizzes() {
  return request<{ quizzes: QuizListItem[] }>('/api/quizzes');
}

export async function getQuiz(id: number) {
  return request<{ quiz: QuizDetail; questions: QuizQuestion[] }>(`/api/quizzes/${id}`);
}

export async function submitQuiz(id: number, answers: Record<string, number>) {
  return request<{ score: number; total: number; percentage: number }>(`/api/quizzes/${id}/attempt`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function getDashboard() {
  return request<DashboardData>('/api/dashboard');
}

export async function getAdminOverview() {
  return request<AdminOverview>('/api/admin/overview');
}
