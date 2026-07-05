import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { signOut, updateEmail } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, Image, Modal, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { supabase } from '../../supabaseConfig';

const { width } = Dimensions.get('window');

export default function TeacherProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // --- CUTE MODAL STATES ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMsg, setModalMsg] = useState('');
  const [modalType, setModalType] = useState<'success' | 'warning' | 'confirm'>('success');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
const unsubRef = useRef<(() => void) | null>(null);

useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  const unsubscribe = onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists() && auth.currentUser) {
      const data = docSnap.data();
      setName(data.name || '');
      setProfileImage(data.profileImage || null);
      setEmail(data.email || user.email || '');
    }
  }, (error) => {
    if (error.code === 'permission-denied') console.log("Listener detached.");
  });

  unsubRef.current = unsubscribe;
  return () => unsubscribe();
}, []);
  const triggerCuteAlert = (title: string, msg: string, type: 'success' | 'warning' | 'confirm' = 'success', onConfirm?: () => void) => {
    setModalTitle(title);
    setModalMsg(msg);
    setModalType(type);
    setOnConfirmAction(() => onConfirm || null);
    setModalVisible(true);
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists() && auth.currentUser) {
          const data = docSnap.data();
          setName(data.name || '');
          setProfileImage(data.profileImage || null);
          setEmail(data.email || user.email || '');
        }
      }, (error) => {
        if (error.code === 'permission-denied') console.log("Listener detached.");
      }
    );
    return () => unsubscribe();
  }, []);

  const copyToClipboard = async () => {
    const code = auth.currentUser?.uid;
    if (code) {
      await Clipboard.setStringAsync(code);
      triggerCuteAlert("Copied! ✅", "Classroom code copied to clipboard.", "success");
    }
  };

  const uploadToSupabase = async () => {
    if (!tempImage) return;
    setShowPreview(false);
    setLoading(true);
    try {
      const user = auth.currentUser;
      const fileName = `${user?.uid}/${Date.now()}.jpg`;
      const response = await fetch(tempImage);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const { error } = await supabase.storage.from('avatars').upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await updateDoc(doc(db, "users", user!.uid), { profileImage: urlData.publicUrl });
      triggerCuteAlert("Success! ✨", "Profile photo updated!", "success");
    } catch (error: any) {
      triggerCuteAlert("Oops! ❌", error.message, "warning");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!name.trim()) return triggerCuteAlert("Wait! ✋", "Name is required", "warning");
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser!.uid), { name: name });
      setIsEditingName(false);
      triggerCuteAlert("Updated! ✅", "Your name has been changed.", "success");
    } catch (e) {
      triggerCuteAlert("Error ❌", "Could not update name", "warning");
    } finally {
      setLoading(false);
    }
  };

 const handleUpdateEmail = async () => {
  if (!email.trim() || !email.includes('@')) return triggerCuteAlert("Oops! 📧", "Valid email is required", "warning");
  setLoading(true);
  try {
    const user = auth.currentUser;
    if (user) {
      await updateEmail(user, email);
      await updateDoc(doc(db, "users", user.uid), { email: email });
      setIsEditingEmail(false);
      triggerCuteAlert("Success! ✅", "Email updated successfully!", "success");
    }
  } catch (e: any) {
    triggerCuteAlert("Error ❌", e.message, "warning");
  } finally {
    setLoading(false);
  }
};


const handleLogout = () => {
  triggerCuteAlert(
    "Logout? 👋",
    "Are you sure you want to exit your classroom?",
    "confirm",
    async () => {
      setModalVisible(false);
      if (unsubRef.current) unsubRef.current(); // stop listener FIRST
      await signOut(auth);                        // then sign out
      router.replace('/login');                    // then navigate
    }
  );
};

  return (
    <SafeAreaView style={styles.container}>
      
      {/* --- CUTE MIND BUDDY POPUP --- */}
      <Modal visible={modalVisible} transparent animationType="fade">
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
                <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#BDBDBD', marginRight: 10}]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalBtnText}>No</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: modalType === 'success' ? '#66BB6A' : '#4CAF50' }]} 
                onPress={() => {
                  if (modalType === 'confirm' && onConfirmAction) {
                    onConfirmAction();
                  } else {
                    setModalVisible(false);
                  }
                }}
              >
                <Text style={styles.modalBtnText}>{modalType === 'confirm' ? "Logout" : "Okay! 👍"}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* --- PREVIEW MODAL --- */}
      <Modal visible={showPreview} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.previewBack}><Ionicons name="close" size={28} color="#1E293B" /></TouchableOpacity>
            <Text style={styles.previewTitle}>Preview Photo</Text>
            <View style={{width: 40}} />
          </View>
          <View style={styles.previewImageFrame}>{tempImage && <Image source={{ uri: tempImage }} style={styles.fullPreview} />}</View>
          <View style={styles.previewFooter}>
            <TouchableOpacity style={styles.mainUploadBtn} onPress={uploadToSupabase}>
              <Text style={styles.mainUploadBtnText}>UPLOAD NOW</Text>
              <Ionicons name="cloud-upload" size={20} color="#FFF" style={{marginLeft: 10}} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{color: '#FFF', marginTop: 10, fontWeight: '700'}}>PROCESSING...</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnCircle}><Ionicons name="chevron-back" size={24} color="#1E293B" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Instructor Profile</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 40}}>
        <View style={styles.profileBox}>
          <TouchableOpacity onPress={() => {
              ImagePicker.requestMediaLibraryPermissionsAsync().then(({status}) => {
                  if(status === 'granted') {
                    ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 }).then(res => {
                        if(!res.canceled) { setTempImage(res.assets[0].uri); setShowPreview(true); }
                    })
                  }
              })
          }} style={styles.avatarWrapper}>
            {profileImage ? <Image source={{ uri: profileImage }} style={styles.avatarImg} /> : (
              <View style={styles.avatarPlaceholder}><Ionicons name="person" size={50} color="#CBD5E1" /></View>
            )}
            <View style={styles.cameraIconBadge}><Ionicons name="camera" size={18} color="#FFF" /></View>
          </TouchableOpacity>
          <Text style={styles.roleLabel}>OFFICIAL ADMINISTRATOR</Text>
        </View>

        <View style={styles.formContainer}>
           <Text style={styles.inputLabel}>MY CLASSROOM CODE (Share with Students)</Text>
           <TouchableOpacity style={[styles.inputRow, { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' }]} onPress={copyToClipboard} activeOpacity={0.7}>
              <Text style={[styles.nameInput, { color: '#4F46E5' }]}>{auth.currentUser?.uid || 'Loading...'}</Text>
              <Ionicons name="copy-outline" size={20} color="#4F46E5" />
           </TouchableOpacity>

           <Text style={styles.inputLabel}>DISPLAY NAME</Text>
           <View style={styles.inputRow}>
              <TextInput style={[styles.nameInput, !isEditingName && {color: '#64748B'}]} value={name} onChangeText={setName} editable={isEditingName} />
              <TouchableOpacity onPress={() => isEditingName ? handleUpdateName() : setIsEditingName(true)}>
                <Text style={styles.editBtnText}>{isEditingName ? 'SAVE' : 'EDIT'}</Text>
              </TouchableOpacity>
           </View>

           <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
           <View style={styles.inputRow}>
              <TextInput style={[styles.nameInput, !isEditingEmail && {color: '#64748B'}]} value={email} onChangeText={setEmail} editable={isEditingEmail} keyboardType="email-address" autoCapitalize="none" />
              <TouchableOpacity onPress={() => isEditingEmail ? handleUpdateEmail() : setIsEditingEmail(true)}>
                <Text style={styles.editBtnText}>{isEditingEmail ? 'SAVE' : 'EDIT'}</Text>
              </TouchableOpacity>
           </View>
        </View>

        <TouchableOpacity style={styles.signOutRow} onPress={handleLogout}>
          <View style={styles.signOutIcon}><MaterialIcons name="logout" size={22} color="#EF4444" /></View>
          <Text style={styles.signOutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF' },
  backBtnCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  profileBox: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#FFF', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 3 },
  avatarWrapper: { width: 120, height: 120, position: 'relative' },
  avatarImg: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#EEF2FF' },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  cameraIconBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#1E293B', padding: 8, borderRadius: 20, borderWidth: 3, borderColor: '#FFF' },
  roleLabel: { marginTop: 15, fontSize: 11, fontWeight: '900', color: '#4F46E5', backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, letterSpacing: 1 },
  formContainer: { padding: 25 },
  inputLabel: { fontSize: 12, fontWeight: '900', color: '#94A3B8', marginBottom: 8, marginLeft: 5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 15, height: 60, borderRadius: 18, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  nameInput: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1E293B' },
  editBtnText: { color: '#4F46E5', fontWeight: '900', fontSize: 13 },
  signOutRow: { flexDirection: 'row', alignItems: 'center', padding: 20, marginHorizontal: 25, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#FEE2E2' },
  signOutIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF1F2', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  signOutText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
  previewContainer: { flex: 1, backgroundColor: '#FFF' },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  previewBack: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  previewTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  previewImageFrame: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  fullPreview: { width: '100%', height: '80%', borderRadius: 20, resizeMode: 'contain' },
  previewFooter: { padding: 30, alignItems: 'center' },
  mainUploadBtn: { backgroundColor: '#1E293B', width: '100%', height: 65, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  mainUploadBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },

  // --- CUTE MODAL STYLES ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  rewardBox: { backgroundColor: '#FFF', padding: 30, borderRadius: 50, alignItems: 'center', elevation: 20, width: '85%', borderWidth: 10 },
  wellDoneText: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  rewardSubText: { fontSize: 18, color: '#555', fontWeight: '700', marginTop: 15, textAlign: 'center', lineHeight: 24 },
  iconCircleLarge: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center' },
  modalBtn: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25, marginTop: 20, minWidth: 100, alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});