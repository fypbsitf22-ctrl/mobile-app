import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, Image, KeyboardAvoidingView,
  Modal, Platform, ScrollView, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';

const { width } = Dimensions.get('window');

export default function UserProfile() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      userRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setNewName(data.name || '');
        }
        setLoading(false);
      },
      (error) => {
        if (error.code === 'permission-denied') {
          console.log("Firestore listener detached safely during logout.");
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const handleUpdateName = async () => {
    if (newName.trim().length < 2) {
      Alert.alert("Oops!", "Please enter a valid name.");
      return;
    }

    setUpdating(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), { name: newName.trim() });
        setIsModalVisible(false);
      }
    } catch (error) {
      Alert.alert("Error", "Could not update name.");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to exit?", [
      { text: "No", style: "cancel" },
      { 
        text: "Yes", 
        onPress: async () => { 
          try {
            router.replace('/login'); 
            setTimeout(async () => { await signOut(auth); }, 500);
          } catch (e) { console.log(e); }
        } 
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#FFC26D" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change My Name ✨</Text>
            <TextInput style={styles.textInput} value={newName} onChangeText={setNewName} placeholder="Enter your name" maxLength={15} autoFocus />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#DDD' }]} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#FFC26D' }]} onPress={handleUpdateName} disabled={updating}>
                {updating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#B48454" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.buddySection}>
          <View style={styles.buddyCircle}>
            {userData?.selectedBuddy?.endsWith('.json') ? (
              <LottieView source={{ uri: userData.selectedBuddy }} autoPlay loop style={styles.buddyImage} />
            ) : (
              <Image source={userData?.selectedBuddy ? { uri: userData.selectedBuddy } : require('../../assets/images/animals.png')} style={styles.buddyImage} resizeMode="contain" />
            )}
          </View>
          <Text style={styles.userName}>{userData?.name || "Little Learner"}</Text>
          <Text style={styles.userEmail}>{auth.currentUser?.email || ""}</Text>
        </View>

        <View style={styles.infoContainer}>
          {/* TEACHER CODE DISPLAY (NEW) */}
          <View style={styles.infoCard}>
            <View style={[styles.iconBox, { backgroundColor: '#E0F2F1' }]}>
              <Ionicons name="school" size={24} color="#009688" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Linked Teacher Code</Text>
              <Text style={[styles.infoValue, { fontSize: 13, color: '#009688' }]}>{userData?.teacherId || "Not Connected"}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.infoCard} onPress={() => setIsModalVisible(true)}>
            <View style={[styles.iconBox, { backgroundColor: '#E8E0FF' }]}>
              <Ionicons name="person" size={24} color="#7E57C2" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>My Name (Tap to Edit)</Text>
              <Text style={styles.infoValue}>{userData?.name || "Not Set"}</Text>
            </View>
            <Ionicons name="pencil" size={16} color="#BBB" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF4E5' }]}>
              <Ionicons name="star" size={24} color="#FFB74D" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>My Stars</Text>
              <Text style={styles.infoValue}>{userData?.stars || 0} Stars Earned! ✨</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.iconBox, { backgroundColor: '#E0F9E9' }]}>
              <MaterialCommunityIcons name="heart" size={24} color="#66BB6A" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>My Learning Buddy</Text>
              <Text style={styles.infoValue}>{userData?.buddyName || "Friend"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/choosebuddy')}>
            <Text style={styles.editBtnText}>Change My Buddy</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#B48454' },
  backBtn: { padding: 5 },
  scrollContent: { paddingBottom: 40 },
  buddySection: { alignItems: 'center', marginTop: 10, marginBottom: 30 },
  buddyCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#FFF', borderWidth: 5, borderColor: '#FFC26D', justifyContent: 'center', alignItems: 'center' },
  buddyImage: { width: 100, height: 100 },
  userName: { fontSize: 28, fontWeight: '900', color: '#E87D88', marginTop: 15 },
  userEmail: { fontSize: 16, color: '#B48454', opacity: 0.8 },
  infoContainer: { paddingHorizontal: 25 },
  infoCard: { backgroundColor: '#FFF', borderRadius: 25, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  infoTextWrap: { marginLeft: 15 },
  infoLabel: { fontSize: 14, color: '#888', fontWeight: '600' },
  infoValue: { fontSize: 18, color: '#333', fontWeight: 'bold' },
  actionSection: { paddingHorizontal: 25, marginTop: 20 },
  editBtn: { backgroundColor: '#FFC26D', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  editBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { flexDirection: 'row', height: 60, borderRadius: 20, borderWidth: 2, borderColor: '#E87D88', justifyContent: 'center', alignItems: 'center' },
  logoutBtnText: { color: '#E87D88', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 30, padding: 25, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#B48454', marginBottom: 20 },
  textInput: { width: '100%', height: 55, backgroundColor: '#F9F9F9', borderRadius: 15, paddingHorizontal: 20, fontSize: 18, borderWidth: 1, borderColor: '#EEE', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalBtn: { flex: 0.45, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});