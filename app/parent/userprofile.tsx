import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'; // Added setDoc
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, Image, KeyboardAvoidingView,
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
  
  const [audioConfig, setAudioConfig] = useState<{
    updateNameSuccess?: string;
    updateNameError?: string;
    invalidTeacherCode?: string;
    wrongTeacherCode?: string;
    teacherAlreadyAdded?: string;
    teacherAdded?: string;
    teacherError?: string;
    removeTeacherConfirm?: string;
    logoutConfirm?: string;
  }>({});
  const soundRef = useRef<Audio.Sound | null>(null);

  const [cuteModalVisible, setCuteModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMsg, setModalMsg] = useState('');
  const [modalType, setModalType] = useState<'success' | 'warning' | 'confirm'>('success');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [updating, setUpdating] = useState(false);

  const [isTeacherModalVisible, setIsTeacherModalVisible] = useState(false);
  const [newTeacherCode, setNewTeacherCode] = useState('');
  const [teacherUpdating, setTeacherUpdating] = useState(false);
  const [editingTeacherIndex, setEditingTeacherIndex] = useState<number>(-1);

  const playSound = async (soundUrl: string | undefined) => {
    if (!soundUrl) return;
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); }
      const { sound } = await Audio.Sound.createAsync({ uri: soundUrl });
      soundRef.current = sound;
      await sound.playAsync();
    } catch (e) { console.log("Error playing sound:", e); }
  };

  const triggerCuteAlert = (
    title: string, 
    msg: string, 
    type: 'success' | 'warning' | 'confirm', 
    soundUrl?: string, 
    onConfirm?: () => void
  ) => {
    setModalTitle(title);
    setModalMsg(msg);
    setModalType(type);
    setOnConfirmAction(() => onConfirm || null);
    setCuteModalVisible(true);
    playSound(soundUrl);
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const fetchAudio = async () => {
        const configSnap = await getDoc(doc(db, "app_config", "profile_sounds"));
        if (configSnap.exists()) {
            const data = configSnap.data();
            setAudioConfig({
              updateNameSuccess: data.update_name_success_url,
              updateNameError: data.update_name_error_url,
              invalidTeacherCode: data.invalid_teacher_code_url,
              wrongTeacherCode: data.wrong_teacher_code_url,
              teacherAlreadyAdded: data.teacher_already_added_url,
              teacherAdded: data.teacher_added_url,
              teacherError: data.teacher_error_url,
              removeTeacherConfirm: data.remove_teacher_confirm_url,
              logoutConfirm: data.logout_confirm_url,
            });
        }
    };
    fetchAudio();

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setNewName(data.name || '');
        }
        setLoading(false);
      }, (error) => { console.log('Listener detached.'); }
    );

    return () => {
        unsubscribe();
        if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  const handleUpdateName = async () => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser!.uid), { name: newName.trim() });
      setIsModalVisible(false);
      triggerCuteAlert("Great job! ✨", "Your name has been updated!", "success", audioConfig.updateNameSuccess);
    } catch {
      triggerCuteAlert("oops", "Could not update name. please try again.", "warning", audioConfig.updateNameError);
    } finally { setUpdating(false); }
  };

  const getTeacherIds = (): string[] => {
    if (!userData) return [];
    if (Array.isArray(userData.teacherIds)) return userData.teacherIds;
    if (userData.teacherId) return [userData.teacherId];
    return [];
  };

  // ─── TEACHER CODE UPDATE (FIXED TO SYNC WITH DASHBOARD) ───
const handleSaveTeacherCode = async () => {
    const code = newTeacherCode.trim();
    if (code.length < 5) {
      triggerCuteAlert("Teacher Code Not Found 🔍", "Please ask your teacher for the correct code.", "warning", audioConfig.invalidTeacherCode);
      return;
    }

    setTeacherUpdating(true);
    try {
      const studentUid = auth.currentUser!.uid;

      // 1. Update Student's profile in 'users'
      await updateDoc(doc(db, 'users', studentUid), {
        teacherId: code,
      });

      // 2. IMPORTANT: Create/Update the record in 'students' so Teacher sees them
      await setDoc(doc(db, 'students', studentUid), {
        teacherId: code, // This links them to the Teacher Dashboard
        parentId: studentUid,
        name: userData?.name || "Little Learner",
        updatedAt: serverTimestamp()
      }, { merge: true });

      setIsTeacherModalVisible(false);
      triggerCuteAlert("Hooray! 🌟", "Your teacher has been added!", "success", audioConfig.teacherAdded);
    } catch (e) {
      triggerCuteAlert("Oops! 😕", "Something went wrong. Try again!", "warning", audioConfig.teacherError);
    } finally { setTeacherUpdating(false); }
  };
  const handleRemoveTeacher = (index: number) => {
    triggerCuteAlert("Remove? 🗑️", "Do you want to remove this teacher?", "confirm", audioConfig.removeTeacherConfirm, async () => {
        setCuteModalVisible(false);
        const updatedList = getTeacherIds().filter((_, i) => i !== index);
        const studentUid = auth.currentUser!.uid;

        // Update Users
        await updateDoc(doc(db, 'users', studentUid), {
            teacherIds: updatedList,
            teacherId: updatedList[0] || '',
        });

        // Update Students (Dashboard)
        await updateDoc(doc(db, 'students', studentUid), {
            teacherId: updatedList[0] || '',
        });
    });
  };
const unsubRef = useRef<(() => void) | null>(null);

useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  const unsubscribe = onSnapshot(userRef, (docSnap) => {
    // ...existing logic
  }, (error) => { console.log('Listener detached.'); });

  unsubRef.current = unsubscribe;
  return () => unsubscribe();
}, []);

const handleLogout = () => {
  triggerCuteAlert("Logout? 👋", "Are you sure you want to exit?", "confirm", audioConfig.logoutConfirm, async () => {
    setCuteModalVisible(false);
    if (unsubRef.current) unsubRef.current(); // 🔑 stop listener FIRST
    await signOut(auth);                       // then sign out
    router.replace('/login');                  // then navigate
  });
};

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color="#FFC26D" /></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* --- CUTE MIND BUDDY POPUP --- */}
      <Modal visible={cuteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[
            styles.rewardBox, 
            { transform: [{ scale: scaleAnim }], 
              borderColor: modalType === 'success' ? '#E8F5E9' : '#FFF3E0' }
          ]}>
            <View style={styles.iconCircleLarge}>
               <Ionicons 
                 name={modalType === 'success' ? "checkmark-circle" : "alert-circle"} 
                 size={100} 
                 color={modalType === 'success' ? "#66BB6A" : "#FF9800"} 
               />
            </View>
            <Text style={[styles.wellDoneText, { color: modalType === 'success' ? "#66BB6A" : "#FF9800" }]}>{modalTitle}</Text>
            <Text style={styles.rewardSubText}>{modalMsg}</Text>
            
            <View style={{flexDirection: 'row', marginTop: 20}}>
              {modalType === 'confirm' && (
                <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#BDBDBD', marginRight: 10}]} onPress={() => setCuteModalVisible(false)}>
                  <Text style={styles.modalBtnText}>No</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: modalType === 'success' ? '#66BB6A' : '#4CAF50' }]} 
                onPress={() => {
                  if (modalType === 'confirm' && onConfirmAction) { onConfirmAction(); } 
                  else { setCuteModalVisible(false); }
                }}
              >
                <Text style={styles.modalBtnText}>{modalType === 'confirm' ? "Yes" : "Okay! 👍"}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* --- Name Input Modal --- */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.rewardBox, {borderColor: '#E1F5FE'}]}>
            <Text style={[styles.wellDoneText, {color: '#0288D1'}]}>Change My Name ✨</Text>
            <TextInput style={styles.textInput} value={newName} onChangeText={setNewName} placeholder="Enter your name" maxLength={15} autoFocus />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#DDD' }]} onPress={() => setIsModalVisible(false)}><Text style={styles.modalBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#FFC26D' }]} onPress={handleUpdateName} disabled={updating}>
                {updating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* --- Teacher Input Modal --- */}
      <Modal visible={isTeacherModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.rewardBox, {borderColor: '#E0F2F1'}]}>
            <Text style={[styles.wellDoneText, {color: '#009688'}]}>{editingTeacherIndex === -1 ? 'Add Teacher 🏫' : 'Replace Teacher 🔄'}</Text>
            <TextInput style={styles.textInput} value={newTeacherCode} onChangeText={setNewTeacherCode} placeholder="Enter teacher code" autoCapitalize="none" autoFocus />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#DDD' }]} onPress={() => setIsTeacherModalVisible(false)}><Text style={styles.modalBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#009688' }]} onPress={handleSaveTeacherCode} disabled={teacherUpdating}>
                {teacherUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={28} color="#B48454" /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.buddySection}>
          <View style={styles.buddyCircle}>
            {userData?.selectedBuddy?.endsWith('.json') ? <LottieView source={{ uri: userData.selectedBuddy }} autoPlay loop style={styles.buddyImage} /> 
            : <Image source={userData?.selectedBuddy ? { uri: userData.selectedBuddy } : require('../../assets/images/animals.png')} style={styles.buddyImage} resizeMode="contain" />}
          </View>
          <Text style={styles.userName}>{userData?.name || 'Little Learner'}</Text>
          <Text style={styles.userEmail}>{auth.currentUser?.email || ''}</Text>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.teacherSection}>
            <View style={styles.teacherHeaderRow}>
              <View style={[styles.iconBox, { backgroundColor: '#E0F2F1' }]}><Ionicons name="school" size={24} color="#009688" /></View>
              <Text style={styles.teacherSectionLabel}>Linked Teacher Codes</Text>
              <TouchableOpacity style={styles.addTeacherBtn} onPress={() => { setEditingTeacherIndex(-1); setNewTeacherCode(''); setIsTeacherModalVisible(true); }}><Ionicons name="add-circle" size={28} color="#009688" /></TouchableOpacity>
            </View>
            {getTeacherIds().length === 0 ? <Text style={styles.noTeacherText}>No teacher linked yet. Tap + to add.</Text> : getTeacherIds().map((code, index) => (
                <View key={index} style={styles.teacherCodeRow}>
                  <View style={styles.teacherCodeBadge}><Text style={styles.teacherCodeText}>{code}</Text></View>
                  <TouchableOpacity style={styles.teacherActionBtn} onPress={() => { setEditingTeacherIndex(index); setNewTeacherCode(getTeacherIds()[index]); setIsTeacherModalVisible(true); }}><Ionicons name="pencil" size={18} color="#009688" /></TouchableOpacity>
                  <TouchableOpacity style={styles.teacherActionBtn} onPress={() => handleRemoveTeacher(index)}><Ionicons name="trash-outline" size={18} color="#E87D88" /></TouchableOpacity>
                </View>
            ))}
          </View>

          <TouchableOpacity style={styles.infoCard} onPress={() => setIsModalVisible(true)}>
            <View style={[styles.iconBox, { backgroundColor: '#E8E0FF' }]}><Ionicons name="person" size={24} color="#7E57C2" /></View>
            <View style={styles.infoTextWrap}><Text style={styles.infoLabel}>My Name (Tap to Edit)</Text><Text style={styles.infoValue}>{userData?.name || 'Not Set'}</Text></View>
            <Ionicons name="pencil" size={16} color="#BBB" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF4E5' }]}><Ionicons name="star" size={24} color="#FFB74D" /></View>
            <View style={styles.infoTextWrap}><Text style={styles.infoLabel}>My Stars</Text><Text style={styles.infoValue}>{userData?.stars || 0} Stars Earned! ✨</Text></View>
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.iconBox, { backgroundColor: '#E0F9E9' }]}><MaterialCommunityIcons name="heart" size={24} color="#66BB6A" /></View>
            <View style={styles.infoTextWrap}><Text style={styles.infoLabel}>My Learning Buddy</Text><Text style={styles.infoValue}>{userData?.buddyName || 'Friend'}</Text></View>
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/choosebuddy')}><Text style={styles.editBtnText}>Change My Buddy</Text></TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}><Ionicons name="log-out-outline" size={22} color="#E87D88" /><Text style={styles.logoutBtnText}>Logout</Text></TouchableOpacity>
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
  teacherSection: { backgroundColor: '#FFF', borderRadius: 25, padding: 15, marginBottom: 15 },
  teacherHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  teacherSectionLabel: { fontSize: 14, color: '#888', fontWeight: '600', marginLeft: 12, flex: 1 },
  addTeacherBtn: { padding: 2 },
  noTeacherText: { fontSize: 14, color: '#AAA', fontStyle: 'italic', marginLeft: 62, marginBottom: 4 },
  teacherCodeRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 62, marginBottom: 8 },
  teacherCodeBadge: { flex: 1, backgroundColor: '#E0F2F1', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12 },
  teacherCodeText: { fontSize: 15, color: '#009688', fontWeight: 'bold' },
  teacherActionBtn: { padding: 6, marginLeft: 6, backgroundColor: '#F5F5F5', borderRadius: 8 },
  actionSection: { paddingHorizontal: 25, marginTop: 20 },
  editBtn: { backgroundColor: '#FFC26D', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  editBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { flexDirection: 'row', height: 60, borderRadius: 20, borderWidth: 2, borderColor: '#E87D88', justifyContent: 'center', alignItems: 'center' },
  logoutBtnText: { color: '#E87D88', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  rewardBox: { backgroundColor: '#FFF', padding: 30, borderRadius: 50, alignItems: 'center', elevation: 20, width: '85%', borderWidth: 10 },
  wellDoneText: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  rewardSubText: { fontSize: 18, color: '#555', fontWeight: '700', marginTop: 15, textAlign: 'center', lineHeight: 24 },
  iconCircleLarge: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center' },
  modalBtn: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25, marginTop: 20, minWidth: 100, alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  textInput: { width: '100%', height: 55, backgroundColor: '#F9F9F9', borderRadius: 15, paddingHorizontal: 20, fontSize: 18, borderWidth: 1, borderColor: '#EEE', marginTop: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 }
});