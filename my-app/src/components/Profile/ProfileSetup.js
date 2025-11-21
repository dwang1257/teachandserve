import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';

const ProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    bio: '',
    interests: [],
    goals: [],
    skills: [],
    experienceLevel: '',
    location: '',
    timezone: '',
    availability: '',
    profileImageUrl: ''
  });
  
  const [currentInterest, setCurrentInterest] = useState('');
  const [currentGoal, setCurrentGoal] = useState('');
  const [currentSkill, setCurrentSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Load existing profile if available
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const response = await axios.get('/api/profile/me');
      if (response.data.profile) {
        const profile = response.data.profile;
        setFormData({
          bio: profile.bio || '',
          interests: profile.interests || [],
          goals: profile.goals || [],
          skills: profile.skills || [],
          experienceLevel: profile.experienceLevel || '',
          location: profile.location || '',
          timezone: profile.timezone || '',
          availability: profile.availability || '',
          profileImageUrl: profile.profileImageUrl || ''
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

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
    setSuccess('');

    try {
      const response = await axios.post('/api/profile/me', formData);
      setSuccess('Profile saved successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const experienceLevels = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'EXPERT', label: 'Expert' }
  ];

  const getRoleSpecificPlaceholders = () => {
    if (user?.role === 'MENTOR') {
      return {
        bio: "Share your professional background, expertise, and what motivates you to mentor others...",
        interests: "Programming, Leadership, Career Development",
        goals: "Help 10 developers advance their careers, Share knowledge in AI/ML",
        skills: "React, Node.js, Team Leadership"
      };
    } else {
      return {
        bio: "Tell us about your background, what you're passionate about, and what you hope to achieve...",
        interests: "Web Development, Data Science, Career Growth",
        goals: "Learn React, Build a portfolio, Land first tech job",
        skills: "HTML, CSS, JavaScript"
      };
    }
  };

  const placeholders = getRoleSpecificPlaceholders();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Complete Your {user?.role === 'MENTOR' ? 'Mentor' : 'Mentee'} Profile
              </h1>
              <p className="mt-2 text-gray-600">
                Help us match you with the perfect {user?.role === 'MENTOR' ? 'mentees' : 'mentors'} by sharing more about yourself.
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Bio Section */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio <span className="text-red-500">*</span>
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
                  Minimum 50 characters. This will be used for AI-powered matching.
                </p>
              </div>

              {/* Interests Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interests <span className="text-red-500">*</span>
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
                  Goals <span className="text-red-500">*</span>
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

              {/* Skills Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills
                </label>
                <div className="flex mb-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={placeholders.skills}
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToList('skills', currentSkill, setCurrentSkill);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => addToList('skills', currentSkill, setCurrentSkill)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeFromList('skills', index)}
                        className="ml-2 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.experienceLevel}
                  onChange={handleInputChange}
                >
                  <option value="">Select your experience level</option>
                  {experienceLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location and Timezone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="San Francisco, CA"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <input
                    type="text"
                    id="timezone"
                    name="timezone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="PST / UTC-8"
                    value={formData.timezone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Availability */}
              <div>
                <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <input
                  type="text"
                  id="availability"
                  name="availability"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Weekends, Evenings (PST)"
                  value={formData.availability}
                  onChange={handleInputChange}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;