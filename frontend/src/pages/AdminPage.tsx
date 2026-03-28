import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminOverview } from '../api';
import { useAuth } from '../auth';
import type { AdminOverview } from '../types';

export function AdminPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    getAdminOverview()
      .then((payload) => setData(payload))
      .catch((err: Error) => setError(err.message));
  }, [user]);

  if (!user) {
    return (
      <section>
        <h1>Admin</h1>
        <p>
          Please <Link to="/login">login</Link> as admin to access this page.
        </p>
      </section>
    );
  }

  if (user.role !== 'admin') {
    return (
      <section>
        <h1>Admin</h1>
        <p className="error">You do not have admin access.</p>
      </section>
    );
  }

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading admin overview...</p>;

  return (
    <section>
      <h1>Admin</h1>
      <div className="grid">
        <article className="card">
          <h3>Users</h3>
          <p>{data.counts.users}</p>
        </article>
        <article className="card">
          <h3>Topics</h3>
          <p>{data.counts.topics}</p>
        </article>
        <article className="card">
          <h3>Questions</h3>
          <p>{data.counts.questions}</p>
        </article>
        <article className="card">
          <h3>Quizzes</h3>
          <p>{data.counts.quizzes}</p>
        </article>
      </div>

      <h2>Recent Users</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {data.recent_users.map((recentUser) => (
            <tr key={recentUser.id}>
              <td>{recentUser.name}</td>
              <td>{recentUser.email}</td>
              <td>{recentUser.role}</td>
              <td>{recentUser.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
