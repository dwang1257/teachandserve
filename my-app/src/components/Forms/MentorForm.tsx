import { useState } from 'react';
import { MentorProfile } from '../../types/MentorProfile'; // Adjust path as needed

export default function MentorProfileForm() {
  const [formData, setFormData] = useState<MentorProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    bio: '',
    experience: '',
    linkedin: '', // Optional but can still have a default value
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/api/mentors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to submit form');
      const data = await response.json();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md space-y-4" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Mentor Profile</h2>

      {[
        { label: 'First Name', name: 'firstName', type: 'text' },
        { label: 'Last Name', name: 'lastName', type: 'text' },
        { label: 'Email', name: 'email', type: 'email' },
        { label: 'Phone Number', name: 'phoneNumber', type: 'tel' },
        { label: 'Date of Birth', name: 'dateOfBirth', type: 'date' },
      ].map(({ label, name, type }) => (
        <div key={name}>
          <label className="block font-medium">{label}</label>
          <input
            name={name}
            type={type}
            value={(formData as any)[name]}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
      ))}

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

      <div>
        <label className="block font-medium">Experience</label>
        <textarea
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          rows={3}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block font-medium">LinkedIn (optional)</label>
        <input
          name="linkedin"
          type="url"
          value={formData.linkedin || ''}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded hover:bg-indigo-700 transition"
      >
        Submit
      </button>
    </form>
  );
}