import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';

const ViewProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await axios.get('/api/profile/me');
      if (response.data.hasProfile === false) {
        // No profile exists, redirect to create profile
        navigate('/complete-profile');
        return;
      }
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setError('Failed to load profile data');
      // If profile doesn't exist, redirect to create profile
      navigate('/complete-profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            {error}
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null; // This should not happen as we redirect above
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Your {user?.role === 'MENTOR' ? 'Mentor' : 'Mentee'} Profile
                </h1>
                <p className="mt-2 text-gray-600">
                  This is how others will see your profile when matching.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => navigate('/profile/setup')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            {/* Profile Image */}
            {profile.profileImageUrl && (
              <div className="mb-8 text-center">
                <img
                  className="mx-auto h-32 w-32 rounded-full object-cover"
                  src={profile.profileImageUrl}
                  alt="Profile"
                />
              </div>
            )}

            {/* Bio Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-3">About Me</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
              </div>
            </div>

            {/* Interests Section */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Goals Section */}
            {profile.goals && profile.goals.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Goals</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.goals.map((goal, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Section */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {profile.experienceLevel && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Experience Level</h4>
                  <p className="text-gray-700 capitalize">{profile.experienceLevel.toLowerCase()}</p>
                </div>
              )}
              
              {profile.location && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Location</h4>
                  <p className="text-gray-700">{profile.location}</p>
                </div>
              )}
              
              {profile.timezone && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Timezone</h4>
                  <p className="text-gray-700">{profile.timezone}</p>
                </div>
              )}
              
              {profile.availability && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Availability</h4>
                  <p className="text-gray-700">{profile.availability}</p>
                </div>
              )}
            </div>

            {/* Profile Status */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`h-3 w-3 rounded-full ${profile.isProfileComplete ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Profile Status: {profile.isProfileComplete ? 'Complete' : 'Incomplete'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {profile.isProfileComplete 
                      ? 'Your profile is live and available for matching'
                      : 'Complete your profile to start getting matched'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProfile;