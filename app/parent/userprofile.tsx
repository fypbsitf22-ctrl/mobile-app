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

  // --- Name modal ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [updating, setUpdating] = useState(false);

  // --- Teacher code modal ---
  const [isTeacherModalVisible, setIsTeacherModalVisible] = useState(false);
  const [newTeacherCode, setNewTeacherCode] = useState('');
  const [teacherUpdating, setTeacherUpdating] = useState(false);
  // Index of teacher being replaced; -1 means adding a new one
  const [editingTeacherIndex, setEditingTeacherIndex] = useState<number>(-1);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);

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
          console.log('Firestore listener detached safely during logout.');
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // ── Name update ────────────────────────────────────────────────
  const handleUpdateName = async () => {
    if (newName.trim().length < 2) {
      Alert.alert('Oops!', 'Please enter a valid name.');
      return;
    }
    setUpdating(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), { name: newName.trim() });
        setIsModalVisible(false);
      }
    } catch {
      Alert.alert('Error', 'Could not update name.');
    } finally {
      setUpdating(false);
    }
  };

  // ── Teacher code helpers ───────────────────────────────────────

  /** Returns current list — supports both old single-string and new array format */
  const getTeacherIds = (): string[] => {
    if (!userData) return [];
    if (Array.isArray(userData.teacherIds)) return userData.teacherIds;
    if (userData.teacherId) return [userData.teacherId];
    return [];
  };

  const openAddTeacher = () => {
    setEditingTeacherIndex(-1);
    setNewTeacherCode('');
    setIsTeacherModalVisible(true);
  };

  const openEditTeacher = (index: number) => {
    setEditingTeacherIndex(index);
    setNewTeacherCode(getTeacherIds()[index]);
    setIsTeacherModalVisible(true);
  };

  const handleSaveTeacherCode = async () => {
    const code = newTeacherCode.trim();
    if (code.length < 2) {
      Alert.alert('Oops!', 'Please enter a valid teacher code.');
      return;
    }

    const currentList = getTeacherIds();

    // Prevent duplicate codes
    const isDuplicate = currentList.some(
      (t, i) => t === code && i !== editingTeacherIndex
    );
    if (isDuplicate) {
      Alert.alert('Already Added', 'This teacher code is already linked.');
      return;
    }

    let updatedList: string[];
    if (editingTeacherIndex === -1) {
      // Adding new
      updatedList = [...currentList, code];
    } else {
      // Replacing existing
      updatedList = currentList.map((t, i) => (i === editingTeacherIndex ? code : t));
    }

    setTeacherUpdating(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          teacherIds: updatedList,
          // keep legacy field in sync with first teacher
          teacherId: updatedList[0] || '',
        });
        setIsTeacherModalVisible(false);
      }
    } catch {
      Alert.alert('Error', 'Could not update teacher code.');
    } finally {
      setTeacherUpdating(false);
    }
  };

  const handleRemoveTeacher = (index: number) => {
    Alert.alert(
      'Remove Teacher',
      'Are you sure you want to remove this teacher?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedList = getTeacherIds().filter((_, i) => i !== index);
            try {
              const user = auth.currentUser;
              if (user) {
                await updateDoc(doc(db, 'users', user.uid), {
                  teacherIds: updatedList,
                  teacherId: updatedList[0] || '',
                });
              }
            } catch {
              Alert.alert('Error', 'Could not remove teacher.');
            }
          },
        },
      ]
    );
  };

  // ── Logout ─────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to exit?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            router.replace('/login');
            setTimeout(async () => {
              await signOut(auth);
            }, 500);
          } catch (e) {
            console.log(e);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#FFC26D" />
      </View>
    );
  }

  const teacherIds = getTeacherIds();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* ── Name Modal ── */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Change My Name ✨</Text>
            <TextInput
              style={styles.textInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter your name"
              maxLength={15}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#DDD' }]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#FFC26D' }]}
                onPress={handleUpdateName}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Teacher Code Modal ── */}
      <Modal visible={isTeacherModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>
              {editingTeacherIndex === -1 ? 'Add Teacher Code 🏫' : 'Replace Teacher Code 🔄'}
            </Text>
            <TextInput
              style={styles.textInput}
              value={newTeacherCode}
              onChangeText={setNewTeacherCode}
              placeholder="Enter teacher code"
              autoCapitalize="none"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#DDD' }]}
                onPress={() => setIsTeacherModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#009688' }]}
                onPress={handleSaveTeacherCode}
                disabled={teacherUpdating}
              >
                {teacherUpdating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#B48454" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Buddy Section ── */}
        <View style={styles.buddySection}>
          <View style={styles.buddyCircle}>
            {userData?.selectedBuddy?.endsWith('.json') ? (
              <LottieView
                source={{ uri: userData.selectedBuddy }}
                autoPlay
                loop
                style={styles.buddyImage}
              />
            ) : (
              <Image
                source={
                  userData?.selectedBuddy
                    ? { uri: userData.selectedBuddy }
                    : require('../../assets/images/animals.png')
                }
                style={styles.buddyImage}
                resizeMode="contain"
              />
            )}
          </View>
          <Text style={styles.userName}>{userData?.name || 'Little Learner'}</Text>
          <Text style={styles.userEmail}>{auth.currentUser?.email || ''}</Text>
        </View>

        <View style={styles.infoContainer}>

          {/* ── TEACHER CODES SECTION (EDITABLE / MULTIPLE) ── */}
          <View style={styles.teacherSection}>
            {/* Section header row */}
            <View style={styles.teacherHeaderRow}>
              <View style={[styles.iconBox, { backgroundColor: '#E0F2F1' }]}>
                <Ionicons name="school" size={24} color="#009688" />
              </View>
              <Text style={styles.teacherSectionLabel}>Linked Teacher Codes</Text>
              {/* Add button */}
              <TouchableOpacity style={styles.addTeacherBtn} onPress={openAddTeacher}>
                <Ionicons name="add-circle" size={28} color="#009688" />
              </TouchableOpacity>
            </View>

            {/* List of teacher codes */}
            {teacherIds.length === 0 ? (
              <Text style={styles.noTeacherText}>No teacher linked yet. Tap + to add.</Text>
            ) : (
              teacherIds.map((code, index) => (
                <View key={index} style={styles.teacherCodeRow}>
                  <View style={styles.teacherCodeBadge}>
                    <Text style={styles.teacherCodeText}>{code}</Text>
                  </View>
                  {/* Edit (replace) button */}
                  <TouchableOpacity
                    style={styles.teacherActionBtn}
                    onPress={() => openEditTeacher(index)}
                  >
                    <Ionicons name="pencil" size={18} color="#009688" />
                  </TouchableOpacity>
                  {/* Remove button */}
                  <TouchableOpacity
                    style={styles.teacherActionBtn}
                    onPress={() => handleRemoveTeacher(index)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#E87D88" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* ── Name ── */}
          <TouchableOpacity style={styles.infoCard} onPress={() => setIsModalVisible(true)}>
            <View style={[styles.iconBox, { backgroundColor: '#E8E0FF' }]}>
              <Ionicons name="person" size={24} color="#7E57C2" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>My Name (Tap to Edit)</Text>
              <Text style={styles.infoValue}>{userData?.name || 'Not Set'}</Text>
            </View>
            <Ionicons name="pencil" size={16} color="#BBB" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {/* ── Stars ── */}
          <View style={styles.infoCard}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF4E5' }]}>
              <Ionicons name="star" size={24} color="#FFB74D" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>My Stars</Text>
              <Text style={styles.infoValue}>{userData?.stars || 0} Stars Earned! ✨</Text>
            </View>
          </View>

          {/* ── Buddy ── */}
          <View style={styles.infoCard}>
            <View style={[styles.iconBox, { backgroundColor: '#E0F9E9' }]}>
              <MaterialCommunityIcons name="heart" size={24} color="#66BB6A" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>My Learning Buddy</Text>
              <Text style={styles.infoValue}>{userData?.buddyName || 'Friend'}</Text>
            </View>
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/choosebuddy')}
          >
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#B48454' },
  backBtn: { padding: 5 },
  scrollContent: { paddingBottom: 40 },
  buddySection: { alignItems: 'center', marginTop: 10, marginBottom: 30 },
  buddyCircle: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: '#FFF',
    borderWidth: 5, borderColor: '#FFC26D', justifyContent: 'center', alignItems: 'center',
  },
  buddyImage: { width: 100, height: 100 },
  userName: { fontSize: 28, fontWeight: '900', color: '#E87D88', marginTop: 15 },
  userEmail: { fontSize: 16, color: '#B48454', opacity: 0.8 },
  infoContainer: { paddingHorizontal: 25 },
  infoCard: {
    backgroundColor: '#FFF', borderRadius: 25, padding: 15,
    flexDirection: 'row', alignItems: 'center', marginBottom: 15,
  },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  infoTextWrap: { marginLeft: 15 },
  infoLabel: { fontSize: 14, color: '#888', fontWeight: '600' },
  infoValue: { fontSize: 18, color: '#333', fontWeight: 'bold' },

  // ── Teacher section styles ──
  teacherSection: {
    backgroundColor: '#FFF', borderRadius: 25, padding: 15, marginBottom: 15,
  },
  teacherHeaderRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
  },
  teacherSectionLabel: {
    fontSize: 14, color: '#888', fontWeight: '600', marginLeft: 12, flex: 1,
  },
  addTeacherBtn: { padding: 2 },
  noTeacherText: {
    fontSize: 14, color: '#AAA', fontStyle: 'italic', marginLeft: 62, marginBottom: 4,
  },
  teacherCodeRow: {
    flexDirection: 'row', alignItems: 'center',
    marginLeft: 62, marginBottom: 8,
  },
  teacherCodeBadge: {
    flex: 1, backgroundColor: '#E0F2F1', borderRadius: 10,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  teacherCodeText: { fontSize: 15, color: '#009688', fontWeight: 'bold' },
  teacherActionBtn: {
    padding: 6, marginLeft: 6,
    backgroundColor: '#F5F5F5', borderRadius: 8,
  },

  actionSection: { paddingHorizontal: 25, marginTop: 20 },
  editBtn: {
    backgroundColor: '#FFC26D', height: 60, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
  },
  editBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: {
    flexDirection: 'row', height: 60, borderRadius: 20,
    borderWidth: 2, borderColor: '#E87D88', justifyContent: 'center', alignItems: 'center',
  },
  logoutBtnText: { color: '#E87D88', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },

  // ── Modal styles ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    width: '85%', backgroundColor: '#FFF', borderRadius: 30,
    padding: 25, alignItems: 'center',
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#B48454', marginBottom: 20 },
  textInput: {
    width: '100%', height: 55, backgroundColor: '#F9F9F9', borderRadius: 15,
    paddingHorizontal: 20, fontSize: 18, borderWidth: 1, borderColor: '#EEE', marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalBtn: { flex: 0.45, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
