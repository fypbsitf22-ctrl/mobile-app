import { getAuth, onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import SharedDashboard from '../../components/SharedDashboard';

export default function ParentIndex() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const auth = getAuth();

  useEffect(() => {
    // onAuthStateChanged is better because it waits for Firebase to initialize
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!user) {
    return null; // Or redirect to Login screen
  }

  return (
    <SharedDashboard 
      userRole="parent" 
      userId={user.uid} 
    />
  );
}