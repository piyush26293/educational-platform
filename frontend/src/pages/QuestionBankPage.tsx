import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getQuestions } from '../api';
import { QuestionListItem } from '../types';

export function QuestionBankPage() {
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = (options?: { search?: string; difficulty?: string }) => {
    getQuestions(options)
      .then((res) => setQuestions(res.questions))
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    load({ search, difficulty });
  };

  return (
    <section>
      <h1>Question Bank</h1>
      <form className="filters" onSubmit={onSubmit}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title" />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button type="submit">Apply</button>
      </form>
      {error && <p className="error">{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Topic</th>
            <th>Difficulty</th>
            <th>Acceptance</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((question) => (
            <tr key={question.id}>
              <td>
                <Link to={`/questions/${question.slug}`}>{question.title}</Link>
              </td>
              <td>{question.topic_name}</td>
              <td>{question.difficulty}</td>
              <td>{Math.round(question.acceptance_rate * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
