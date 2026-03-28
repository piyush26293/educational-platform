import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTopic } from '../api';
import type { QuestionListItem, Topic } from '../types';

export function TopicDetailPage() {
  const { slug = '' } = useParams();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getTopic(slug)
      .then((res) => {
        setTopic(res.topic);
        setQuestions(res.questions);
      })
      .catch((err: Error) => setError(err.message));
  }, [slug]);

  if (error) return <p className="error">{error}</p>;
  if (!topic) return <p>Loading topic...</p>;

  return (
    <section>
      <h1>
        {topic.icon} {topic.name}
      </h1>
      <p>{topic.description}</p>
      <h2>Questions</h2>
      <ul className="list">
        {questions.map((question) => (
          <li key={question.id}>
            <Link to={`/questions/${question.slug}`}>{question.title}</Link> · {question.difficulty}
          </li>
        ))}
      </ul>
    </section>
  );
}
