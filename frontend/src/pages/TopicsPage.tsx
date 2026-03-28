import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTopics } from '../api';
import type { Topic } from '../types';

export function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTopics()
      .then((res) => setTopics(res.topics))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <section>
      <h1>Topics</h1>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {topics.map((topic) => (
          <article key={topic.id} className="card">
            <h3>
              {topic.icon} {topic.name}
            </h3>
            <p>{topic.description}</p>
            <p>
              <small>{topic.difficulty}</small>
            </p>
            <Link to={`/topics/${topic.slug}`}>View questions</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
