import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('cg_token'));

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  async function fetchUser() {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('cg_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  function login(newToken) {
    localStorage.setItem('cg_token', newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem('cg_token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, token, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
