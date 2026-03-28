import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api';
import { useAuth } from '../auth';
import type { DashboardData } from '../types';

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getDashboard()
      .then((payload) => setData(payload))
      .catch((err: Error) => setError(err.message));
  }, [user]);

  if (!user) {
    return (
      <section>
        <h1>Dashboard</h1>
        <p>
          Please <Link to="/login">login</Link> to view your progress dashboard.
        </p>
      </section>
    );
  }

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading dashboard...</p>;

  return (
    <section>
      <h1>Dashboard</h1>
      <div className="grid">
        <article className="card">
          <h3>Solved Questions</h3>
          <p>{data.stats.solved_questions}</p>
        </article>
        <article className="card">
          <h3>Quiz Attempts</h3>
          <p>{data.stats.quiz_attempts}</p>
        </article>
        <article className="card">
          <h3>Average Quiz Score</h3>
          <p>{data.stats.average_quiz_score}%</p>
        </article>
      </div>

      <h2>Badges</h2>
      <ul className="list">
        {data.badges.length === 0 && <li>No badges yet.</li>}
        {data.badges.map((badge) => (
          <li key={badge.id}>
            {badge.icon} {badge.name} - {badge.description}
          </li>
        ))}
      </ul>

      <h2>Recent Questions</h2>
      <ul className="list">
        {data.recent_questions.length === 0 && <li>No recent activity.</li>}
        {data.recent_questions.map((question) => (
          <li key={`${question.slug}-${question.solved_at}`}>
            {question.title} · {question.status} · {new Date(question.solved_at).toLocaleString()}
          </li>
        ))}
      </ul>
    </section>
  );
}
