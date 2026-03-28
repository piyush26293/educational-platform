export type User = {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  points: number;
  streak: number;
};

export type Topic = {
  id: number;
  name: string;
  slug: string;
  description: string;
  difficulty: string;
  prerequisites: string[];
  content: string;
  icon: string;
  order_index: number;
  question_count?: number;
};

export type QuestionListItem = {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  acceptance_rate: number;
  tags: string[];
  topic_slug: string;
  topic_name: string;
};

export type QuestionDetail = {
  id: number;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  topic_slug: string;
  topic_name: string;
  acceptance_rate: number;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string;
  starter_code: Record<string, string>;
  test_cases: Array<{ input: string; expected: string }>;
  time_complexity: string;
  space_complexity: string;
  tags: string[];
};

export type QuizListItem = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  time_limit: number;
  topic_slug: string;
  topic_name: string;
  question_count: number;
};

export type QuizDetail = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  time_limit: number;
  topic_slug: string;
  topic_name: string;
};

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
};

export type DashboardData = {
  user: User & { created_at: string };
  stats: {
    solved_questions: number;
    quiz_attempts: number;
    average_quiz_score: number;
  };
  badges: Array<{ id: number; name: string; description: string; icon: string; earned_at: string }>;
  recent_questions: Array<{ title: string; slug: string; status: string; language: string; solved_at: string }>;
};

export type AdminOverview = {
  counts: {
    users: number;
    topics: number;
    questions: number;
    quizzes: number;
  };
  recent_users: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    points: number;
    streak: number;
    created_at: string;
  }>;
};
