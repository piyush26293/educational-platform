import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTopics } from '../api';
import type { Topic } from '../types';

export function HomePage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTopics()
      .then((res) => setTopics(res.topics.slice(0, 6)))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <section>
      <h1>Learn DSA with guided practice</h1>
      <p>Explore topics, solve coding questions, and track progress in one place.</p>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {topics.map((topic) => (
          <article key={topic.id} className="card">
            <h3>
              {topic.icon} {topic.name}
            </h3>
            <p>{topic.description}</p>
            <p>
              <small>
                Difficulty: {topic.difficulty} · Questions: {topic.question_count ?? 0}
              </small>
            </p>
            <Link to={`/topics/${topic.slug}`}>Open topic</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
