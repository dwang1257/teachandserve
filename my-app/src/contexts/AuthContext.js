import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '../config/axios';

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
  const [profileStatus, setProfileStatus] = useState({ hasProfile: false, isComplete: false });
  const [profileStatusLoading, setProfileStatusLoading] = useState(true);

  const refreshProfileStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setProfileStatus({ hasProfile: false, isComplete: false });
      setProfileStatusLoading(false);
      return;
    }

    try {
      setProfileStatusLoading(true);
      const response = await axios.get('/api/profile/me');

      if (response.data.hasProfile === false) {
        setProfileStatus({ hasProfile: false, isComplete: false });
      } else {
        const profile = response.data.profile || response.data;
        setProfileStatus({
          hasProfile: true,
          isComplete: Boolean(profile.isProfileComplete)
        });
      }
    } catch (error) {
      setProfileStatus({ hasProfile: false, isComplete: false });
    } finally {
      setProfileStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
      setProfileStatusLoading(false);
    }
  }, [refreshProfileStatus]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
      await refreshProfileStatus();
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setProfileStatus({ hasProfile: false, isComplete: false });
      setProfileStatusLoading(false);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      await refreshProfileStatus();
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // If there are validation errors, format them nicely
        if (error.response.data.errors) {
          const errors = error.response.data.errors;
          const errorMessages = [];
          
          for (const [field, message] of Object.entries(errors)) {
            errorMessages.push(`${field}: ${message}`);
          }
          
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('; ');
          }
        }
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const signup = async (email, password, role) => {
    try {
      const response = await axios.post('/api/auth/signup', {
        email,
        password,
        role
      });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      await refreshProfileStatus();
      
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // If there are validation errors, format them nicely
        if (error.response.data.errors) {
          const errors = error.response.data.errors;
          const errorMessages = [];
          
          for (const [field, message] of Object.entries(errors)) {
            errorMessages.push(`${field}: ${message}`);
          }
          
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('; ');
          }
        }
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setProfileStatus({ hasProfile: false, isComplete: false });
    setProfileStatusLoading(false);
  };

  const value = {
    user,
    setUser, // Export setUser so other components can update user state (e.g., popup seen)
    login,
    signup,
    logout,
    loading,
    profileStatus,
    profileStatusLoading,
    refreshProfileStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};