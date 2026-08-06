import { useRouter } from 'expo-router';
import {
  BookOpen,
  ChevronLeft,
  Gamepad2,
  Layout,
  MessageSquare,
  Star, TrendingUp,
  User, Users
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Firebase Imports
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

// Components
import { ProgressChart } from '../components/ProgressChart';
import { QuickAction } from '../components/QuickAction';
import { StatCard } from '../components/StatCard';

export default function UnifiedDashboard() {
  const router = useRouter();
  const [role, setRole] = useState<'parent' | 'teacher'>('parent');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get the current logged-in user
    const user = auth.currentUser;

    if (user) {
      // 2. Listen to the specific user document in Firestore
      const userRef = doc(db, "users", user.uid);
      
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
        setLoading(false);
      }, (error) => {
        console.error("Firestore Error:", error);
        setLoading(false);
      });

      return () => unsubscribe(); // Cleanup listener on unmount
    } else {
      setLoading(false);
      router.replace('/login' as any); // Redirect if not logged in
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D8ABC" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color="#333" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parent Analytics</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ROLE SWITCHER */}
        <View style={styles.roleSwitcher}>
          <TouchableOpacity 
            style={[styles.roleBtn, role === 'parent' && styles.activeRole]} 
            onPress={() => setRole('parent')}
          >
            <User size={16} color={role === 'parent' ? "#fff" : "#666"} />
            <Text style={[styles.roleText, role === 'parent' && styles.activeRoleText]}>Parent View</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleBtn, role === 'teacher' && styles.activeRole]} 
            onPress={() => setRole('teacher')}
          >
            <Users size={16} color={role === 'teacher' ? "#fff" : "#666"} />
            <Text style={[styles.roleText, role === 'teacher' && styles.activeRoleText]}>Teacher View</Text>
          </TouchableOpacity>
        </View>

        {/* DYNAMIC WELCOME TITLE */}
        <Text style={styles.welcomeTitle}>
          {role === 'parent' ? `${userData?.name || 'Child'}'s Progress` : "Class Performance"}
        </Text>

        {/* DYNAMIC STATS */}
        <View style={styles.row}>
          <StatCard 
            label={role === 'parent' ? "Total Stars" : "Class Avg."} 
            value={role === 'parent' ? (userData?.stars || "0") : "88%"} 
            icon={Star} 
            color="#FFD700" 
          />
          <StatCard 
            label={role === 'parent' ? "Tasks Done" : "Student Count"} 
            value={role === 'parent' ? (userData?.tasksCompleted || "0/0") : "25"} 
            icon={TrendingUp} 
            color="#4CAF50" 
          />
        </View>

        {/* DYNAMIC CHART */}
        <ProgressChart 
          chartData={userData?.progress || [0, 0, 0]} 
        />

        {/* QUICK ACCESS */}
        <Text style={styles.sectionTitle}>Manage Modules</Text>
        <View style={styles.quickActionGrid}>
          {role === 'parent' ? (
            <>
              <QuickAction title="Routine" color="#2ECC71" icon={<Layout color="white" />} onPress={() => router.push('/parent/dailyroutine' as any)} />
              <QuickAction title="Academic" color="#4A90E2" icon={<BookOpen color="white" />} onPress={() => router.push('/parent/academic' as any)} />
              <QuickAction title="Games" color="#F1C40F" icon={<Gamepad2 color="white" />} onPress={() => router.push('/parent/games' as any)} />
            </>
          ) : (
            <>
              <QuickAction title="Students" color="#9B59B6" icon={<Users color="white" />} onPress={() => router.push('/teacher/students' as any)} />
              <QuickAction title="Assignments" color="#E67E22" icon={<BookOpen color="white" />} onPress={() => router.push('/teacher/assignments' as any)} />
            </>
          )}
        </View>
      </ScrollView>

      {/* FLOATING FEEDBACK ICON (FAB) */}
      <TouchableOpacity 
        style={styles.fabFeedback} 
        onPress={() => router.push('/feedback' as any)}
      >
        <MessageSquare color="#fff" size={26} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  scrollContent: { paddingBottom: 100 },
  roleSwitcher: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 25, padding: 5, marginHorizontal: 20, marginBottom: 10 },
  roleBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 20 },
  activeRole: { backgroundColor: '#0D8ABC' },
  roleText: { marginLeft: 8, fontSize: 13, color: '#666', fontWeight: 'bold' },
  activeRoleText: { color: '#fff' },
  welcomeTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginHorizontal: 20, marginVertical: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginHorizontal: 20, marginVertical: 15 },
  quickActionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', paddingHorizontal: 20, gap: 12 },
  fabFeedback: { 
    position: 'absolute', bottom: 30, right: 25, 
    backgroundColor: '#7C4DFF', width: 56, height: 56, borderRadius: 28, 
    justifyContent: 'center', alignItems: 'center', elevation: 5 
  },
});