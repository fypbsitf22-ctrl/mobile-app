import { getAuth } from 'firebase/auth';
import React from 'react';
import SharedDashboard from '../../components/SharedDashboard';

export default function TeacherIndex() {
  const auth = getAuth();
  const user = auth.currentUser; 

  // If teacher is not logged in, return null or a login message
  if (!user) return null; 

  return (
    <SharedDashboard 
      userRole="teacher" 
      userId={user.uid} // This sends your real Teacher UID to the dashboard
    />
  );
}