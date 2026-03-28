import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';

export function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="layout">
      <header className="topbar">
        <Link to="/" className="brand">
          DSA Platform
        </Link>
        <nav>
          <NavLink to="/topics">Topics</NavLink>
          <NavLink to="/questions">Question Bank</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>
        <div className="auth-actions">
          {user ? (
            <>
              <span>{user.name}</span>
              <button onClick={signOut}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </header>
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
