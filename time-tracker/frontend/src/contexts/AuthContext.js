import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    // Set axios base URL
    axios.defaults.baseURL = API_URL;
    
    // Check if user is already logged in (token exists)
    const token = localStorage.getItem('token');
    if (token) {
      // Set default auth header for axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch user data
      axios.get('/users/me')
        .then(response => {
          setCurrentUser(response.data);
        })
        .catch(err => {
          // If token is invalid or expired, remove it
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);  // Register new user
  const register = async (name, email, password, companyName, invitationToken = null) => {
    try {
      const registrationData = {
        name,
        email,
        password,
        companyName
      };

      // Add invitation token if provided
      if (invitationToken) {
        registrationData.invitationToken = invitationToken;
      }

      const response = await axios.post('/auth/register', registrationData);
      
      const { token, user, organization } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set default auth header for axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch complete user data with permissions
      const userResponse = await axios.get('/users/me');
      
      setCurrentUser(userResponse.data);
      setError('');
      return userResponse.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
      throw err;
    }
  };// Login user
  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set default auth header for axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch complete user data with permissions
      const userResponse = await axios.get('/users/me');
      
      setCurrentUser(userResponse.data);
      setError('');
      return userResponse.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
      throw err;
    }
  };
  // Logout user
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove auth header for axios
    delete axios.defaults.headers.common['Authorization'];
    
    setCurrentUser(null);
  };
  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/users/me', profileData);
      setCurrentUser(response.data);
      setError('');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      throw err;
    }
  };

  // Refresh user data (useful after organization changes)
  const refreshUser = async () => {
    try {
      const response = await axios.get('/users/me');
      setCurrentUser(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to refresh user data:', err);
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}