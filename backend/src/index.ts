import bcrypt from 'bcryptjs';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getDb, initDb } from './database';

type UserRecord = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  points: number;
  streak: number;
};

type AuthPayload = {
  id: number;
  email: string;
  role: 'user' | 'admin';
};

const app = express();
const port = Number(process.env.PORT ?? 3001);
const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret-change-me';

app.use(cors());
app.use(express.json());

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function createToken(user: UserRecord): string {
  const payload: AuthPayload = { id: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

function readBearerToken(req: Request): string | null {
  const authHeader = req.header('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = readBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthPayload;
    res.locals.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const authUser = res.locals.user as AuthPayload;
    if (authUser.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password || password.length < 6) {
    res.status(400).json({ error: 'Name, email, and password (min 6 chars) are required' });
    return;
  }

  const db = getDb();
  const normalizedEmail = email.toLowerCase().trim();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail) as { id: number } | undefined;
  if (existing) {
    res.status(409).json({ error: 'Email already in use' });
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password, role, points, streak) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name.trim(), normalizedEmail, hashedPassword, 'user', 0, 0);

  const user = db.prepare('SELECT id, name, email, role, points, streak, password FROM users WHERE id = ?').get(result.lastInsertRowid) as UserRecord;
  const token = createToken(user);

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, points: user.points, streak: user.streak },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT id, name, email, password, role, points, streak FROM users WHERE email = ?').get(email.toLowerCase().trim()) as UserRecord | undefined;
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = createToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, points: user.points, streak: user.streak },
  });
});

app.get('/api/auth/me', requireAuth, (_req, res) => {
  const db = getDb();
  const authUser = res.locals.user as AuthPayload;
  const user = db.prepare('SELECT id, name, email, role, points, streak FROM users WHERE id = ?').get(authUser.id) as Omit<UserRecord, 'password'> | undefined;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

app.get('/api/topics', (_req, res) => {
  const db = getDb();
  const topics = db
    .prepare(
      `SELECT t.*, (
        SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id
      ) as question_count
      FROM topics t
      ORDER BY t.order_index ASC`
    )
    .all() as Array<Record<string, unknown>>;

  res.json({
    topics: topics.map((topic) => ({
      ...topic,
      prerequisites: parseJson<string[]>(String(topic.prerequisites ?? '[]'), []),
    })),
  });
});

app.get('/api/topics/:slug', (req, res) => {
  const db = getDb();
  const topic = db.prepare('SELECT * FROM topics WHERE slug = ?').get(req.params.slug) as Record<string, unknown> | undefined;
  if (!topic) {
    res.status(404).json({ error: 'Topic not found' });
    return;
  }

  const questions = db
    .prepare('SELECT id, title, slug, difficulty, acceptance_rate, tags FROM questions WHERE topic_id = ? ORDER BY id ASC')
    .all(topic.id) as Array<Record<string, unknown>>;

  res.json({
    topic: {
      ...topic,
      prerequisites: parseJson<string[]>(String(topic.prerequisites ?? '[]'), []),
    },
    questions: questions.map((question) => ({
      ...question,
      tags: parseJson<string[]>(String(question.tags ?? '[]'), []),
    })),
  });
});

app.get('/api/questions', (req, res) => {
  const db = getDb();
  const search = String(req.query.search ?? '').toLowerCase();
  const topicSlug = String(req.query.topic ?? '').toLowerCase();
  const difficulty = String(req.query.difficulty ?? '').toLowerCase();
  const limit = Math.min(Number(req.query.limit ?? 100), 200);

  const rows = db
    .prepare(
      `SELECT q.id, q.title, q.slug, q.difficulty, q.acceptance_rate, q.tags, t.slug as topic_slug, t.name as topic_name
       FROM questions q
       LEFT JOIN topics t ON q.topic_id = t.id
       ORDER BY q.id ASC`
    )
    .all() as Array<Record<string, unknown>>;

  const filtered = rows
    .filter((row) => {
      const title = String(row.title ?? '').toLowerCase();
      const rowTopic = String(row.topic_slug ?? '').toLowerCase();
      const rowDifficulty = String(row.difficulty ?? '').toLowerCase();
      const matchSearch = !search || title.includes(search);
      const matchTopic = !topicSlug || rowTopic === topicSlug;
      const matchDifficulty = !difficulty || rowDifficulty === difficulty;
      return matchSearch && matchTopic && matchDifficulty;
    })
    .slice(0, limit)
    .map((row) => ({
      ...row,
      tags: parseJson<string[]>(String(row.tags ?? '[]'), []),
    }));

  res.json({ questions: filtered });
});

app.get('/api/questions/:slug', (req, res) => {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT q.*, t.slug as topic_slug, t.name as topic_name
       FROM questions q
       LEFT JOIN topics t ON q.topic_id = t.id
       WHERE q.slug = ?`
    )
    .get(req.params.slug) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Question not found' });
    return;
  }

  res.json({
    question: {
      ...row,
      examples: parseJson<Array<{ input: string; output: string; explanation?: string }>>(String(row.examples ?? '[]'), []),
      test_cases: parseJson<Array<{ input: string; expected: string }>>(String(row.test_cases ?? '[]'), []),
      starter_code: parseJson<Record<string, string>>(String(row.starter_code ?? '{}'), {}),
      tags: parseJson<string[]>(String(row.tags ?? '[]'), []),
    },
  });
});

app.get('/api/quizzes', (_req, res) => {
  const db = getDb();
  const quizzes = db
    .prepare(
      `SELECT q.id, q.title, q.description, q.difficulty, q.time_limit, t.slug as topic_slug, t.name as topic_name,
        (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) as question_count
       FROM quizzes q
       LEFT JOIN topics t ON q.topic_id = t.id
       ORDER BY q.id ASC`
    )
    .all();

  res.json({ quizzes });
});

app.get('/api/quizzes/:id', (req, res) => {
  const quizId = Number(req.params.id);
  if (Number.isNaN(quizId)) {
    res.status(400).json({ error: 'Invalid quiz id' });
    return;
  }

  const db = getDb();
  const quiz = db
    .prepare(
      `SELECT q.id, q.title, q.description, q.difficulty, q.time_limit, t.slug as topic_slug, t.name as topic_name
       FROM quizzes q
       LEFT JOIN topics t ON q.topic_id = t.id
       WHERE q.id = ?`
    )
    .get(quizId) as Record<string, unknown> | undefined;

  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found' });
    return;
  }

  const questions = db
    .prepare('SELECT id, question, options, correct_answer, explanation FROM quiz_questions WHERE quiz_id = ? ORDER BY id ASC')
    .all(quizId) as Array<Record<string, unknown>>;

  res.json({
    quiz,
    questions: questions.map((question) => ({
      ...question,
      options: parseJson<string[]>(String(question.options ?? '[]'), []),
    })),
  });
});

app.post('/api/quizzes/:id/attempt', requireAuth, (req, res) => {
  const quizId = Number(req.params.id);
  if (Number.isNaN(quizId)) {
    res.status(400).json({ error: 'Invalid quiz id' });
    return;
  }

  const answers = (req.body?.answers ?? {}) as Record<string, number>;
  const db = getDb();
  const questions = db
    .prepare('SELECT id, correct_answer FROM quiz_questions WHERE quiz_id = ?')
    .all(quizId) as Array<{ id: number; correct_answer: number }>;

  if (!questions.length) {
    res.status(404).json({ error: 'Quiz not found' });
    return;
  }

  const total = questions.length;
  let score = 0;

  for (const question of questions) {
    if (answers[String(question.id)] === question.correct_answer) {
      score += 1;
    }
  }

  const authUser = res.locals.user as AuthPayload;
  db.prepare('INSERT INTO quiz_attempts (user_id, quiz_id, score, total, answers) VALUES (?, ?, ?, ?, ?)').run(
    authUser.id,
    quizId,
    score,
    total,
    JSON.stringify(answers)
  );

  res.json({ score, total, percentage: Math.round((score / total) * 100) });
});

app.get('/api/dashboard', requireAuth, (_req, res) => {
  const authUser = res.locals.user as AuthPayload;
  const db = getDb();

  const user = db.prepare('SELECT id, name, email, role, points, streak, created_at FROM users WHERE id = ?').get(authUser.id) as Record<string, unknown>;
  const solved = db.prepare('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND status = ?').get(authUser.id, 'solved') as { count: number };
  const attempted = db.prepare('SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = ?').get(authUser.id) as { count: number };
  const avgQuiz = db.prepare('SELECT COALESCE(AVG((score * 100.0)/NULLIF(total, 0)), 0) as average FROM quiz_attempts WHERE user_id = ?').get(authUser.id) as { average: number };
  const badges = db
    .prepare(
      `SELECT b.id, b.name, b.description, b.icon, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ?
       ORDER BY ub.earned_at DESC`
    )
    .all(authUser.id);

  const recentQuestions = db
    .prepare(
      `SELECT q.title, q.slug, up.status, up.language, up.solved_at
       FROM user_progress up
       JOIN questions q ON up.question_id = q.id
       WHERE up.user_id = ?
       ORDER BY up.solved_at DESC
       LIMIT 10`
    )
    .all(authUser.id);

  res.json({
    user,
    stats: {
      solved_questions: solved.count,
      quiz_attempts: attempted.count,
      average_quiz_score: Number(avgQuiz.average.toFixed(2)),
    },
    badges,
    recent_questions: recentQuestions,
  });
});

app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const db = getDb();

  const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  const topics = db.prepare('SELECT COUNT(*) as count FROM topics').get() as { count: number };
  const questions = db.prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number };
  const quizzes = db.prepare('SELECT COUNT(*) as count FROM quizzes').get() as { count: number };
  const recentUsers = db
    .prepare('SELECT id, name, email, role, points, streak, created_at FROM users ORDER BY created_at DESC LIMIT 10')
    .all();

  res.json({
    counts: {
      users: users.count,
      topics: topics.count,
      questions: questions.count,
      quizzes: quizzes.count,
    },
    recent_users: recentUsers,
  });
});

initDb();
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});
