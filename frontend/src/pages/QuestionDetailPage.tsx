import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getQuestion } from '../api';
import type { QuestionDetail } from '../types';

export function QuestionDetailPage() {
  const { slug = '' } = useParams();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getQuestion(slug)
      .then((res) => setQuestion(res.question))
      .catch((err: Error) => setError(err.message));
  }, [slug]);

  if (error) return <p className="error">{error}</p>;
  if (!question) return <p>Loading question...</p>;

  return (
    <section>
      <h1>{question.title}</h1>
      <p>
        {question.topic_name} · {question.difficulty} · Acceptance {Math.round(question.acceptance_rate * 100)}%
      </p>
      <h2>Description</h2>
      <p style={{ whiteSpace: 'pre-line' }}>{question.description}</p>
      <h2>Constraints</h2>
      <pre>{question.constraints}</pre>
      <h2>Starter Code (Python)</h2>
      <pre>{question.starter_code.python ?? 'Not available'}</pre>
    </section>
  );
}
