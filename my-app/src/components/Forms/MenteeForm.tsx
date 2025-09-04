import { useState } from 'react';
import { MenteeProfile } from '../../types/MenteeProfile';

export default function MenteeProfileForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    bio: '',
  } as MenteeProfile);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const response = await fetch('http://localhost:8080/api/mentees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    if (!response.ok) {
      throw new Error('Failed to submit form');
    }
    const data = await response.json();
    console.log('Works:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

  return (
    <form className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md space-y-4" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Mentee Profile</h2>

      <div>
        <label className="block font-medium">First Name</label>
        <input
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Last Name</label>
        <input
          name="lastName"
          type="text"
          value={formData.lastName}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Email</label>
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Phone Number</label>
        <input
          name="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Date of Birth</label>
        <input
          name="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Bio</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={4}
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition"
      >
        Submit
      </button>
    </form>
  );
}