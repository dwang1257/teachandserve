import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import PasswordInput from '../UI/PasswordInput';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (pwd) => {
    const minLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[@$!%*?&]/.test(pwd);
    
    const requirements = [minLength, hasUpper, hasLower, hasNumber, hasSpecial];
    const metRequirements = requirements.filter(Boolean).length;
    
    if (metRequirements === 5) return 'Strong';
    if (metRequirements >= 3) return 'Medium';
    if (metRequirements >= 1) return 'Weak';
    return 'Too weak';
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(validatePassword(newPassword));
  };

  const isPasswordValid = (pwd) => {
    return pwd.length >= 8 && 
           /[A-Z]/.test(pwd) && 
           /[a-z]/.test(pwd) && 
           /\d/.test(pwd) && 
           /[@$!%*?&]/.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation with detailed error messages
    if (!email) {
      setError('Email address is required');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (!isPasswordValid(password)) {
      setError('Password must contain at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)');
      return;
    }

    if (!confirmPassword) {
      setError('Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!role) {
      setError('Please select whether you want to be a mentor or mentee');
      return;
    }

    setLoading(true);

    try {
      const result = await signup(email, password, role);
      
      if (result.success) {
        navigate('/complete-profile');
      } else {
        setError(result.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Signup Failed
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-900 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Password"
                label="Password"
                autoComplete="new-password"
                required
                showStrength={true}
                passwordStrength={passwordStrength}
              />
            </div>

            <div>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                label="Confirm Password"
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                I want to be a:
              </label>
              <div className="space-y-3">
                <div
                  onClick={() => setRole('MENTOR')}
                  className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
                    role === 'MENTOR'
                      ? 'border-gray-900 bg-gray-100'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      id="mentor"
                      name="role"
                      type="radio"
                      value="MENTOR"
                      checked={role === 'MENTOR'}
                      onChange={(e) => setRole(e.target.value)}
                      className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300"
                    />
                    <label htmlFor="mentor" className="ml-3 block text-sm font-medium text-gray-700 text-center flex-1">
                      <span className="font-semibold">Mentor</span>
                      <span className="block text-xs text-gray-500">Share your expertise and guide others</span>
                    </label>
                  </div>
                </div>
                <div
                  onClick={() => setRole('MENTEE')}
                  className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
                    role === 'MENTEE'
                      ? 'border-gray-900 bg-gray-100'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      id="mentee"
                      name="role"
                      type="radio"
                      value="MENTEE"
                      checked={role === 'MENTEE'}
                      onChange={(e) => setRole(e.target.value)}
                      className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300"
                    />
                    <label htmlFor="mentee" className="ml-3 block text-sm font-medium text-gray-700 text-center flex-1">
                      <span className="font-semibold">Mentee</span>
                      <span className="block text-xs text-gray-500">Learn from experienced mentors</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-gray-900 hover:text-gray-700">
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;