import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Minimal API wrapper returning axios-like shape for compatibility
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const api = {
    baseURL: API_BASE,
    get: async (url) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
      const data = await res.json();
      return { data, ...data, status: res.status };
    },
    post: async (url, body) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}${url}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`);
      const data = await res.json();
      return { data, ...data, status: res.status };
    },
    put: async (url, body) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}${url}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`PUT ${url} failed: ${res.status}`);
      const data = await res.json().catch(() => ({}));
      return { data, ...data, status: res.status };
    },
    delete: async (url) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}${url}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error(`DELETE ${url} failed: ${res.status}`);
      const data = await res.json().catch(() => ({}));
      return { data, ...data, status: res.status };
    }
  };

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const currentToken = localStorage.getItem('token');
      console.log('🔍 AuthContext useEffect - Token exists:', !!currentToken);
      
      if (currentToken) {
        setToken(currentToken);
        console.log('🔍 Calling /auth/me endpoint...');
        
        try {
          const response = await api.get('/auth/me');
          console.log('✅ /auth/me response:', response);
          setUser(response.user);
        } catch (error) {
          console.error('❌ /auth/me failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      } else {
        setToken(null);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email });
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response);
      const { token: newToken, user } = response;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const loginWithToken = async (token) => {
    try {
      console.log('Attempting login with token');
      localStorage.setItem('token', token);
      setToken(token);
      
      const response = await api.get('/auth/me');
      console.log('Token verification response:', response);
      setUser(response.user);
      
      return { success: true };
    } catch (error) {
      console.error('Token login error:', error);
      localStorage.removeItem('token');
      setToken(null);
      return { 
        success: false, 
        error: error.message || 'Token login failed' 
      };
    }
  };

  const register = async (name, email, password, role = 'TENANT') => {
    try {
      console.log('Attempting registration with:', { name, email, role });
      const response = await api.post('/auth/register', { 
        name, 
        email, 
        password, 
        role 
      });
      console.log('Registration response:', response);
      const { token: newToken, user } = response;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    login,
    loginWithToken,
    register,
    logout,
    api,
    loading,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 