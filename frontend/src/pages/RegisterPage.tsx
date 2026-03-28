import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signUp({ name, email, password });
      navigate('/dashboard');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="narrow">
      <h1>Register</h1>
      <form onSubmit={onSubmit} className="form">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </label>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} />
        </label>
        <button disabled={submitting} type="submit">
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </section>
  );
}
