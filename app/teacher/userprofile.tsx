import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../firebaseConfig';

export default function TeacherProfile() {
  const router = useRouter();

  const handleLogout = () => {
  Alert.alert("Logout", "Are you sure you want to exit the teacher panel?", [
    { text: "No", style: "cancel" },
    { 
      text: "Yes", 
      onPress: async () => { 
        try {
          // 1. Navigate to login FIRST
          router.replace('/login'); 
          
          // 2. Small delay to let the navigation finish
          setTimeout(async () => {
             await signOut(auth); 
          }, 500);
        } catch (e) {
          console.log("Logout error:", e);
        }
      } 
    }
  ]);
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={28} color="#444" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Instructor Profile</Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView contentContainerStyle={styles.padding}>
        <View style={styles.profileInfo}>
            <View style={styles.avatar}><Ionicons name="school" size={60} color="#FFF" /></View>
            <Text style={styles.name}>{auth.currentUser?.email}</Text>
            <Text style={styles.roleLabel}>Certified Instructor</Text>
        </View>

        <View style={styles.menuBox}>
            <Text style={styles.sectionTitle}>Management</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/teacher/activity/activity' as any)}>
                <MaterialIcons name="assignment" size={24} color="#A2D2FF" />
                <Text style={styles.menuText}>View Student Activities</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
                <MaterialIcons name="analytics" size={24} color="#C4A6FB" />
                <Text style={styles.menuText}>Progress Reports</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
                <MaterialIcons name="chat" size={24} color="#66BB6A" />
                <Text style={styles.menuText}>Parent Communication</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
                <MaterialIcons name="logout" size={24} color="#E87D88" />
                <Text style={[styles.menuText, { color: '#E87D88' }]}>Sign Out</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', backgroundColor: '#FFF' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#334155' },
  padding: { padding: 20 },
  profileInfo: { alignItems: 'center', marginBottom: 30, backgroundColor: '#FFF', padding: 30, borderRadius: 30, elevation: 2 },
  avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#A2D2FF', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  name: { fontSize: 20, fontWeight: 'bold', marginTop: 15, color: '#1E293B' },
  roleLabel: { fontSize: 14, color: '#64748B', marginTop: 5, fontWeight: '600' },
  menuBox: { backgroundColor: '#FFF', borderRadius: 25, padding: 10, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#94A3B8', marginLeft: 20, marginVertical: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuText: { fontSize: 17, marginLeft: 15, fontWeight: '600', color: '#334155' }
});