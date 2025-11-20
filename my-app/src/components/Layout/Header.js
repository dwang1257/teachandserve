import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Don't show header on landing page (it has its own nav)
  if (location.pathname === '/') {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-14">
          {/* Logo/Home Button */}
          <Link
            to="/"
            className="flex items-center hover:opacity-70 transition-opacity"
          >
            <span className="text-lg font-medium text-gray-900 tracking-tight">Teach & Serve</span>
          </Link>

          {/* Right side - User menu or auth buttons */}
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  to="/messages"
                  className="relative text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </Link>
                
                <div 
                  className="relative"
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <div className="flex items-center space-x-2 cursor-pointer py-2">
                    <span className="text-gray-600 text-sm font-normal">
                      {user.email}
                    </span>
                    <svg 
                      className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50">
                      <Link
                        to="/profile/view"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={logout}
                        className="block w-full text-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>

                <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                  user.role === 'MENTOR'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {user.role === 'MENTOR' ? 'Mentor' : 'Mentee'}
                </span>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 text-sm font-normal transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-1.5 rounded-md text-sm font-normal transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;