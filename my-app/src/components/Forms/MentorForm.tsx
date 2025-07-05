import { useState } from 'react';
import { MentorProfile } from '../../types/MentorProfile';

export default function MentorProfileForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    bio: '',
    experience: '',
    linkedin: '',
  } as MentorProfile);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("mentor form data:", formData); // send this to backend later
  };

  return (
    <form className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md space-y-4" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Mentor Profile</h2>

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

      <div>
        <label className="block font-medium">Experience</label>
        <input
          name="experience"
          type="text"
          value={formData.experience}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block font-medium">LinkedIn (optional)</label>
        <input
          name="linkedin"
          type="url"
          value={formData.linkedin}
          onChange={handleChange}
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