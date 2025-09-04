import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import axios from '../../config/axios';

const MenteeDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(location.state?.message || '');
  const [warning, setWarning] = useState(location.state?.warning || '');

  useEffect(() => {
    loadProfile();
    loadMatches();
    
    // Clear navigation state messages after 5 seconds
    if (message) {
      setTimeout(() => setMessage(''), 5000);
    }
    if (warning) {
      setTimeout(() => setWarning(''), 10000);
    }
  }, [message, warning]);

  const loadProfile = async () => {
    try {
      const response = await axios.get('/api/profile/me');
      // Check if response has profile data or is the "not found" format
      if (response.data.hasProfile === false) {
        setProfile(null);
      } else {
        // Response is the profile data itself
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      const response = await axios.get('/api/matches/my-matches');
      setMatches(response.data || []);
    } catch (error) {
      console.error('Failed to load matches:', error);
      setMatches([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mentee Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome! Discover mentors and track your learning journey.</p>
          
          {message && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{message}</p>
                </div>
              </div>
            </div>
          )}
          
          {warning && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">{warning}</p>
                </div>
              </div>
            </div>
          )}
          
          {!loading && (!profile || !profile.isProfileComplete) && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Complete your profile to get matched with perfect mentors!
                  </h3>
                  <div className="mt-2">
                    <Link
                      to="/complete-profile"
                      className="text-sm bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-3 py-1 rounded-md font-medium"
                    >
                      Complete Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {!loading && profile && profile.isProfileComplete && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded-md">
              <div className="flex justify-between items-center">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Profile Complete - Ready for matching!
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your profile is live and you can receive mentor matches.
                    </p>
                  </div>
                </div>
                <div>
                  <Link
                    to="/profile/view"
                    className="text-sm bg-green-200 hover:bg-green-300 text-green-800 px-3 py-1 rounded-md font-medium"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">M</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      My Mentors
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {matches.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">S</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Sessions Completed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">G</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Goals Achieved
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Your Mentor Matches
                </h3>
                {matches.length > 0 && (
                  <Link
                    to="/matches"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    View All Matches
                  </Link>
                )}
              </div>
              <div>
                {matches.length > 0 ? (
                  <div className="space-y-3">
                    {matches.slice(0, 3).map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {match.mentorProfile?.user?.email || 'Unknown Mentor'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Match Score: {(match.matchScore * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {match.status}
                        </div>
                      </div>
                    ))}
                    {matches.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{matches.length - 3} more matches
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    {profile && profile.isProfileComplete 
                      ? "No mentor matches found yet. Check back soon!"
                      : "Complete your profile to get matched with mentors."}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Sessions
              </h3>
              <div className="mt-5">
                <p className="text-sm text-gray-500">
                  No recent sessions to display. Book your first session to get started!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenteeDashboard;