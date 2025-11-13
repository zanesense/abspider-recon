// src/components/ProtectedPage.tsx - Dark Mode Version

import React, { useState } from 'react';

const ProtectedPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Secure API call to your Vercel Serverless Function
      const response = await fetch('/api/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Incorrect password.');
      }
    } catch (err) {
      setError('A network error occurred.');
      console.error('Login Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div style={styles.protectedContent}>
        <h2>🎉 Access Granted!</h2>
        <p>Welcome to the **Secret Content**.</p>
        <p>You are successfully authenticated.</p>
      </div>
    );
  }

  return (
    <div style={styles.outerContainer}>
      <div style={styles.loginCard}>
        <h3 style={styles.title}>🔒 Developer Access</h3>
        <p style={styles.subtitle}>Enter credentials to proceed.</p>
        
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            disabled={loading}
          />
          <button 
            type="submit"
            style={{ ...styles.button, ...(loading ? styles.buttonLoading : {}) }}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Login'}
          </button>
        </form>
        
        {error && <p style={styles.errorText}>{error}</p>}
        
        <small style={styles.note}>
          This interface is protected by a server-side environment variable.
        </small>
      </div>
    </div>
  );
};

export default ProtectedPage;

// --- DARK MODE STYLES ---

const styles: { [key: string]: React.CSSProperties } = {
  outerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh', 
    backgroundColor: '#1e1e1e', // Very dark background
    color: '#e0e0e0', // Light text color
    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: '20px',
    boxSizing: 'border-box',
  },
  loginCard: {
    // Proper Width and Spacing
    maxWidth: '450px', // Increased max width for better visual weight
    width: '100%',
    padding: '40px', // Ample padding
    backgroundColor: '#252526', // Slightly lighter dark background for the card
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)', // Stronger, darker shadow
    textAlign: 'center',
  },
  title: {
    fontSize: '32px', // Larger title
    color: '#ffffff',
    marginBottom: '8px', // Proper spacing
    fontWeight: '700',
  },
  subtitle: {
    fontSize: '18px',
    color: '#aaaaaa',
    marginBottom: '35px', // More vertical separation
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px', // Increased space between input and button
  },
  input: {
    padding: '16px 20px', // More padding
    border: '1px solid #3c3c3c', // Darker border
    backgroundColor: '#333333', // Dark input background
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '18px',
    width: 'calc(100% - 40px)', 
    boxSizing: 'border-box',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  },
  button: {
    padding: '16px', // Ample vertical padding
    backgroundColor: '#6200EE', // A vibrant, dark-mode friendly primary color (Deep Purple)
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease, transform 0.2s ease',
  },
  buttonLoading: {
    backgroundColor: '#4a148c', // Darker purple when loading
    cursor: 'not-allowed',
    opacity: 0.8,
  },
  errorText: {
    color: '#ff6b6b', // Soft red for errors
    marginTop: '30px',
    fontSize: '15px',
    fontWeight: '500',
    backgroundColor: '#331a1a', // Darker error background
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ff6b6b',
  },
  note: {
    marginTop: '30px', // More spacing before the note
    display: 'block',
    color: '#888888',
    fontSize: '14px',
  },
  protectedContent: {
    padding: '50px',
    backgroundColor: '#2e432e', // Dark green success background
    borderRadius: '12px',
    textAlign: 'center',
    margin: '50px auto',
    maxWidth: '600px',
    border: '1px solid #4caf50',
    boxShadow: '0 8px 20px rgba(0,100,0,0.3)',
    fontSize: '18px',
    lineHeight: '1.6',
    color: '#ffffff',
  }
};

// Add CSS keyframe animation and enhanced focus states
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  /* Enhanced Focus/Hover States for Dark Mode */
  input:focus {
    border-color: #6200EE !important;
    box-shadow: 0 0 0 3px rgba(98, 0, 238, 0.5) !important;
    outline: none !important;
  }
  button:not([disabled]):hover {
    background-color: #7b1fa2 !important; /* Lighter/Brighter purple on hover */
    transform: translateY(-2px) !important;
  }
  button:not([disabled]):active {
    transform: translateY(0px) !important;
  }
`;
document.head.appendChild(styleSheet);