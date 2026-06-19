import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookOpen } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div>
      <nav style={{ background: 'var(--bg-card)', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container flex justify-between items-center">
          <Link to="/" className="flex items-center gap-4" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            <BookOpen color="var(--primary-color)" />
            EduPlatform
          </Link>
          
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span style={{ color: 'var(--text-secondary)' }}>Role: {user.role}</span>
                <button onClick={logout} className="btn btn-secondary">
                  <LogOut size={18} /> Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link to="/login" className="btn btn-secondary">Login</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      <main className="container mt-4 mb-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
