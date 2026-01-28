import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import {
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { auth } from '../../firebaseConfig'; // Adjust path if needed

const { width } = Dimensions.get('window');

export default function UserProfile() {
  const router = useRouter();
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.log("Logout Error", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#B48454" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} /> {/* Spacer to center title */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Character/Buddy Section */}
        <View style={styles.buddySection}>
          <View style={styles.buddyCircle}>
            {/* Replace with a dummy character image */}
            <Image 
              source={require('../../assets/images/animals.png')} 
              style={styles.buddyImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.userName}>{user?.displayName || "Little Learner"}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoContainer}>
          
          {/* Card 1: Account Info */}
          <View style={styles.infoCard}>
            <View style={[styles.iconBox, { backgroundColor: '#E8E0FF' }]}>
              <Ionicons name="person" size={24} color="#7E57C2" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>My Name</Text>
              <Text style={styles.infoValue}>{user?.displayName || "Not Set"}</Text>
            </View>
          </View>

          {/* Card 2: Stars/Progress */}
          <View style={styles.infoCard}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF4E5' }]}>
              <Ionicons name="star" size={24} color="#FFB74D" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>My Stars</Text>
              <Text style={styles.infoValue}>12 Stars Earned! ✨</Text>
            </View>
          </View>

          {/* Card 3: Favorite Buddy */}
          <View style={styles.infoCard}>
            <View style={[styles.iconBox, { backgroundColor: '#E0F9E9' }]}>
              <MaterialCommunityIcons name="heart" size={24} color="#66BB6A" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>My Learning Buddy</Text>
              <Text style={styles.infoValue}>Elephant 🐘</Text>
            </View>
          </View>

        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#E87D88" />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#B48454' },
  backBtn: { padding: 5 },
  scrollContent: { paddingBottom: 40 },
  
  buddySection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  buddyCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFF',
    borderWidth: 5,
    borderColor: '#FFC26D',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#FFC26D',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buddyImage: { width: 90, height: 90 },
  userName: { fontSize: 28, fontWeight: '900', color: '#E87D88', marginTop: 15 },
  userEmail: { fontSize: 16, color: '#B48454', opacity: 0.8 },

  infoContainer: { paddingHorizontal: 25 },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextWrap: { marginLeft: 15 },
  infoLabel: { fontSize: 14, color: '#888', fontWeight: '600' },
  infoValue: { fontSize: 18, color: '#333', fontWeight: 'bold' },

  actionSection: { paddingHorizontal: 25, marginTop: 20 },
  editBtn: {
    backgroundColor: '#FFC26D',
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  editBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E87D88',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtnText: { color: '#E87D88', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});