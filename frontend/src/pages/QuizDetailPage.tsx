import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getQuiz, submitQuiz } from '../api';
import { QuizDetail, QuizQuestion } from '../types';
import { useAuth } from '../auth';

export function QuizDetailPage() {
  const { id = '' } = useParams();
  const quizId = Number(id);
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; total: number; percentage: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(quizId)) return;
    getQuiz(quizId)
      .then((res) => {
        setQuiz(res.quiz);
        setQuestions(res.questions);
      })
      .catch((err: Error) => setError(err.message));
  }, [quizId]);

  const canSubmit = useMemo(() => user && questions.length > 0, [questions.length, user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    const data = await submitQuiz(quizId, answers).catch((err: Error) => {
      setError(err.message);
      return null;
    });
    if (data) setResult(data);
  }

  if (error) return <p className="error">{error}</p>;
  if (!quiz) return <p>Loading quiz...</p>;

  return (
    <section>
      <h1>{quiz.title}</h1>
      <p>{quiz.description}</p>
      <p>
        {quiz.difficulty} · {Math.round(quiz.time_limit / 60)} mins · {quiz.topic_name}
      </p>

      {!user && <p>Please login to submit quiz attempts.</p>}

      <form onSubmit={onSubmit} className="form">
        {questions.map((question, index) => (
          <fieldset key={question.id}>
            <legend>
              {index + 1}. {question.question}
            </legend>
            {question.options.map((option, optionIndex) => (
              <label key={option}>
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={answers[String(question.id)] === optionIndex}
                  onChange={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      [String(question.id)]: optionIndex,
                    }))
                  }
                />
                {option}
              </label>
            ))}
          </fieldset>
        ))}
        <button type="submit" disabled={!canSubmit}>
          Submit Quiz
        </button>
      </form>

      {result && (
        <p>
          Score: {result.score}/{result.total} ({result.percentage}%)
        </p>
      )}
    </section>
  );
}
