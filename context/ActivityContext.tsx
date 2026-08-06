import React, { createContext, useContext, useEffect, useState } from 'react';
import { firebaseService } from '../services/firebaseService';

interface ActivityContextType {
  submissions: any[];
  activities: any[];
  loading: boolean;
}

const ActivityContext = createContext<ActivityContextType | null>(null);

export const ActivityProvider = ({ children }: { children: React.ReactNode }) => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Start Real-time Listeners
    const unsubSubmissions = firebaseService.subscribeToSubmissions((data) => {
      setSubmissions(data);
      setLoading(false);
    });

    const unsubActivities = firebaseService.subscribeToActivities((data) => {
      setActivities(data);
    });

    return () => {
      unsubSubmissions();
      unsubActivities();
    };
  }, []);

  return (
    <ActivityContext.Provider value={{ submissions, activities, loading }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivityData = () => {
  const context = useContext(ActivityContext);
  if (!context) throw new Error("useActivityData must be used within ActivityProvider");
  return context;
};