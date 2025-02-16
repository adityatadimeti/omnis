// Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Login = () => {
  const [error, setError] = useState('');
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to log in with Google');
      console.error(error);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0F172A',
    },
    card: {
      width: '100%',
      maxWidth: '400px',
      padding: '2rem',
      backgroundColor: '#1E293B',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      textAlign: 'center',
    },
    title: {
      color: 'white',
      marginBottom: '2rem',
    },
    googleButton: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#fff',
      color: '#333',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      fontSize: '16px',
    },
    error: {
      color: '#EF4444',
      marginBottom: '1rem',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome</h1>
        {error && <div style={styles.error}>{error}</div>}
        <button onClick={handleGoogleLogin} style={styles.googleButton}>
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            style={{ width: '24px', height: '24px' }}
          />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;