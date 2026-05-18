import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      navigate('/login?error=' + error);
      return;
    }

    if (token) {
      login(token);
      navigate('/gallery');
    } else {
      navigate('/login?error=no_token');
    }
  }, [params, login, navigate]);

  return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Completing sign in...</p>
    </div>
  );
}
