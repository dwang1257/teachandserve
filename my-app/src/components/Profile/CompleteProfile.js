import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';

const CompleteProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    bio: '',
    interests: [],
    goals: []
  });
  
  const [currentInterest, setCurrentInterest] = useState('');
  const [currentGoal, setCurrentGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addToList = (listName, value, setValue) => {
    if (value.trim() && !formData[listName].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [listName]: [...prev[listName], value.trim()]
      }));
      setValue('');
    }
  };

  const removeFromList = (listName, index) => {
    setFormData(prev => ({
      ...prev,
      [listName]: prev[listName].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.bio.length < 50) {
      setError('Bio must be at least 50 characters long');
      setLoading(false);
      return;
    }

    if (formData.interests.length === 0) {
      setError('Please add at least one interest');
      setLoading(false);
      return;
    }

    if (formData.goals.length === 0) {
      setError('Please add at least one goal');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/profile/complete', formData);
      
      // Redirect to dashboard after successful profile completion
      navigate('/dashboard', { 
        state: { message: 'Profile completed! Matching with mentors/mentees...' }
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard', { 
      state: { warning: 'Your profile is incomplete — you won\'t be matched until it\'s submitted.' }
    });
  };

  const getRoleSpecificPlaceholders = () => {
    if (user?.role === 'MENTOR') {
      return {
        bio: "Share your professional background, expertise, and what motivates you to mentor others...",
        interests: "Programming, Leadership, Career Development",
        goals: "Help 10 developers advance their careers, Share knowledge in AI/ML"
      };
    } else {
      return {
        bio: "Tell us about your background, what you're passionate about, and what you hope to achieve...",
        interests: "Web Development, Data Science, Career Growth",
        goals: "Learn React, Build a portfolio, Land first tech job"
      };
    }
  };

  const placeholders = getRoleSpecificPlaceholders();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Help us find your perfect {user?.role === 'MENTOR' ? 'mentees' : 'mentors'} by sharing more about yourself
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-8">
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bio Section */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Tell us about yourself <span className="text-red-500">*</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={6}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={placeholders.bio}
                value={formData.bio}
                onChange={handleInputChange}
              />
              <p className="mt-1 text-sm text-gray-500">
                Minimum 50 characters ({formData.bio.length}/50)
              </p>
            </div>

            {/* Interests Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Interests <span className="text-red-500">*</span>
              </label>
              <div className="flex mb-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={placeholders.interests}
                  value={currentInterest}
                  onChange={(e) => setCurrentInterest(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToList('interests', currentInterest, setCurrentInterest);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addToList('interests', currentInterest, setCurrentInterest)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeFromList('interests', index)}
                      className="ml-2 text-indigo-600 hover:text-indigo-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Goals Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Goals <span className="text-red-500">*</span>
              </label>
              <div className="flex mb-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={placeholders.goals}
                  value={currentGoal}
                  onChange={(e) => setCurrentGoal(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToList('goals', currentGoal, setCurrentGoal);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addToList('goals', currentGoal, setCurrentGoal)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.goals.map((goal, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {goal}
                    <button
                      type="button"
                      onClick={() => removeFromList('goals', index)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Optional Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Image (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <button
                      type="button"
                      onClick={() => alert('Image upload coming soon!')}
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      <span>Upload a file</span>
                    </button>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB (Coming Soon)</p>
                </div>
              </div>
            </div>

            {/* Submit and Skip Buttons */}
            <div className="flex justify-between space-x-4">
              <button
                type="button"
                onClick={handleSkip}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Skip for Now
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Complete Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;