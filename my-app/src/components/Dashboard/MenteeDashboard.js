import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../config/axios';

const MenteeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    loadMatches();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await axios.get('/api/profile/me');
      if (response.data.hasProfile === false) {
        navigate('/complete-profile', { replace: true });
        return;
      }

      const profileData = response.data.profile || response.data;
      if (!profileData.isProfileComplete) {
        navigate('/complete-profile', { replace: true });
        return;
      }

      setProfile(profileData);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-900">Mentee Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome! Discover mentors and track your learning journey.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">M</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">My Mentors</dt>
                    <dd className="text-lg font-medium text-gray-900">{matches.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">S</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Sessions Completed</dt>
                    <dd className="text-lg font-medium text-gray-900">0</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">G</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Goals Achieved</dt>
                    <dd className="text-lg font-medium text-gray-900">0</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Your Mentor Matches</h3>
                  <p className="text-sm text-gray-500">Stay in touch with the people rooting for you.</p>
                </div>
                {matches.length > 0 && (
                  <Link
                    to="/matches"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                            {match.mentorProfile?.firstName || 'Unknown Mentor'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Match Score: {(match.matchScore * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="text-xs text-gray-500 uppercase">
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
                      ? 'No mentor matches found yet. Check back soon!'
                      : 'Complete your profile to get matched with mentors.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Sessions</h3>
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
