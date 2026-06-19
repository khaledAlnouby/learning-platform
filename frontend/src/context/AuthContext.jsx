import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('userId');
    
    if (token && role && userId) {
      setUser({ token, role, id: userId });
      // Ideally, we validate token here via API. 
      api.get('/users/validate?token=' + token)
        .then(res => {
           if (!res.data.valid) logout();
        })
        .catch(() => logout());
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/users/auth/login', { email, password });
    const { token, id, role } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('userId', id);
    localStorage.setItem('role', role);
    setUser({ token, id, role });
    return response.data;
  };

  const register = async (userData) => {
    const response = await api.post('/users/auth/register', userData);
    const { token, id, role } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('userId', id);
    localStorage.setItem('role', role);
    setUser({ token, id, role });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
