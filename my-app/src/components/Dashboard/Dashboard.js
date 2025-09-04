import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MentorDashboard from './MentorDashboard';
import MenteeDashboard from './MenteeDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div>
      {user.role === 'MENTOR' ? <MentorDashboard /> : <MenteeDashboard />}
    </div>
  );
};

export default Dashboard;