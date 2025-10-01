import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';

const MatchedProfiles = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [matches, setMatches] = useState([]);
  const [matchedProfiles, setMatchedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError('');

      // Get matches
      const matchesResponse = await axios.get('/api/matches/my-matches');
      const matchesData = matchesResponse.data || [];
      setMatches(matchesData);

      // For each match, get the profile details
      const profilePromises = matchesData.map(async (match) => {
        try {
          const targetUserId = user.role === 'MENTOR' ? match.menteeProfile?.user?.id : match.mentorProfile?.user?.id;
          const targetProfile = user.role === 'MENTOR' ? match.menteeProfile : match.mentorProfile;

          if (targetProfile) {
            return {
              ...match,
              profile: targetProfile
            };
          }

          // Fallback: try to fetch profile by user ID if available
          if (targetUserId) {
            const profileResponse = await axios.get(`/api/profile/${targetUserId}`);
            return {
              ...match,
              profile: profileResponse.data
            };
          }

          return null;
        } catch (error) {
          console.error('Failed to load profile for match:', error);
          return null;
        }
      });

      const profiles = await Promise.all(profilePromises);
      const validProfiles = profiles.filter(profile => profile !== null);
      setMatchedProfiles(validProfiles);

    } catch (error) {
      console.error('Failed to load matches:', error);
      setError('Failed to load matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMatch = async (matchId) => {
    try {
      await axios.post(`/api/matches/${matchId}/accept`);
      await loadMatches();
    } catch (error) {
      console.error('Failed to accept match:', error);
      setError('Failed to accept match. Please try again.');
    }
  };

  const handleRejectMatch = async (matchId) => {
    try {
      await axios.post(`/api/matches/${matchId}/reject`);
      await loadMatches();
    } catch (error) {
      console.error('Failed to reject match:', error);
      setError('Failed to reject match. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  const roleTitle = user?.role === 'MENTOR' ? 'Matched Mentees' : 'Matched Mentors';
  const oppositeRole = user?.role === 'MENTOR' ? 'mentees' : 'mentors';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{roleTitle}</h1>
              <p className="mt-2 text-gray-600">
                View your matched {oppositeRole} and their profiles.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button 
              onClick={loadMatches}
              className="ml-4 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Your Matches ({matchedProfiles.length})
            </h2>
          </div>
          
          <div className="px-6 py-6">
            {matchedProfiles.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No matches yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't been matched with any {oppositeRole} yet. Check back later!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {matchedProfiles.map((matchData, index) => {
                  const profile = matchData.profile;
                  if (!profile) return null;
                  
                  return (
                    <div key={matchData.id || index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          {profile.profileImageUrl && (
                            <img
                              className="h-16 w-16 rounded-full object-cover"
                              src={profile.profileImageUrl}
                              alt={`${profile.user?.email || 'User'} profile`}
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {profile.user?.email || 'Anonymous User'}
                              </h3>
                              {matchData.matchScore && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {(matchData.matchScore * 100).toFixed(0)}% match
                                </span>
                              )}
                            </div>
                            {profile.experienceLevel && (
                              <p className="text-sm text-gray-600 capitalize">
                                {profile.experienceLevel.toLowerCase()} level
                              </p>
                            )}
                            {profile.location && (
                              <p className="text-sm text-gray-600">📍 {profile.location}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          {matchData.status === 'PENDING' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                          {matchData.status === 'ACCEPTED' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Accepted
                            </span>
                          )}
                          {matchData.status === 'REJECTED' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {profile.bio && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">About</h4>
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {profile.bio.length > 200 
                              ? `${profile.bio.substring(0, 200)}...` 
                              : profile.bio
                            }
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.interests && profile.interests.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Interests</h4>
                            <div className="flex flex-wrap gap-1">
                              {profile.interests.slice(0, 3).map((interest, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-indigo-100 text-indigo-800"
                                >
                                  {interest}
                                </span>
                              ))}
                              {profile.interests.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{profile.interests.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {profile.goals && profile.goals.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Goals</h4>
                            <div className="flex flex-wrap gap-1">
                              {profile.goals.slice(0, 2).map((goal, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800"
                                >
                                  {goal}
                                </span>
                              ))}
                              {profile.goals.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{profile.goals.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex justify-end space-x-3">
                        {matchData.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleRejectMatch(matchData.id)}
                              className="px-4 py-2 text-sm border border-red-300 rounded-md text-red-700 hover:bg-red-50"
                            >
                              Reject Match
                            </button>
                            <button
                              onClick={() => handleAcceptMatch(matchData.id)}
                              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                              Accept Match
                            </button>
                          </>
                        )}
                        {matchData.status === 'ACCEPTED' && (
                          <>
                            <button
                              onClick={() => navigate(`/messages?userId=${profile.user?.id}`)}
                              className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                              Send Message
                            </button>
                            <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                              Schedule Session
                            </button>
                          </>
                        )}
                        {matchData.status === 'REJECTED' && (
                          <span className="px-4 py-2 text-sm text-gray-500 italic">
                            Match rejected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchedProfiles;