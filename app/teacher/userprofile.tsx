import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { signOut, updateEmail } from 'firebase/auth'; // Import updateEmail
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Modal, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { supabase } from '../../supabaseConfig';

export default function TeacherProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Separate editing states for better control
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      setEmail(user.email || '');
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        setName(docSnap.data().name || '');
        setProfileImage(docSnap.data().profileImage || null);
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false, 
      quality: 0.7,
    });

    if (!result.canceled) {
      setTempImage(result.assets[0].uri);
      setShowPreview(true);
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

      const { error } = await supabase.storage
        .from('avatars') 
        .upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      await updateDoc(doc(db, "users", user!.uid), { profileImage: publicUrl });
      setProfileImage(publicUrl);
      Alert.alert("Success", "Profile photo updated!");
    } catch (error: any) {
      Alert.alert("Upload Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to save Name
  const handleUpdateName = async () => {
    if (!name.trim()) return Alert.alert("Error", "Name is required");
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser!.uid), { name: name });
      setIsEditingName(false);
      Alert.alert("Success", "Name updated!");
    } catch (e) {
      Alert.alert("Error", "Could not update name");
    } finally {
      setLoading(false);
    }
  };

  // Function to save Email (Updates Auth + Firestore)
  const handleUpdateEmail = async () => {
    if (!email.trim() || !email.includes('@')) return Alert.alert("Error", "Valid email is required");
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // 1. Update in Firebase Authentication
        await updateEmail(user, email);
        
        // 2. Update in Firestore Database
        await updateDoc(doc(db, "users", user.uid), { email: email });
        
        setIsEditingEmail(false);
        Alert.alert("Success", "Email updated successfully!");
      }
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        Alert.alert("Security", "Please logout and login again to change your email for security reasons.");
      } else {
        Alert.alert("Error", e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* PREVIEW MODAL */}
      <Modal visible={showPreview} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.previewBack}>
              <Ionicons name="close" size={28} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>Preview Photo</Text>
            <View style={{width: 40}} />
          </View>
          <View style={styles.previewImageFrame}>
            {tempImage && <Image source={{ uri: tempImage }} style={styles.fullPreview} />}
          </View>
          <View style={styles.previewFooter}>
            <TouchableOpacity style={styles.mainUploadBtn} onPress={uploadToSupabase}>
              <Text style={styles.mainUploadBtnText}>UPLOAD NOW</Text>
              <Ionicons name="cloud-upload" size={20} color="#FFF" style={{marginLeft: 10}} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* LOADING OVERLAY */}
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{color: '#FFF', marginTop: 10, fontWeight: '700'}}>PROCESSING...</Text>
        </View>
      )}

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnCircle}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Instructor Profile</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 40}}>
        <View style={styles.profileBox}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={50} color="#CBD5E1" />
              </View>
            )}
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera" size={18} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.roleLabel}>OFFICIAL ADMINISTRATOR</Text>
        </View>

        <View style={styles.formContainer}>
           {/* NAME FIELD */}
           <Text style={styles.inputLabel}>DISPLAY NAME</Text>
           <View style={styles.inputRow}>
              <TextInput 
                style={[styles.nameInput, !isEditingName && {color: '#64748B'}]}
                value={name}
                onChangeText={setName}
                editable={isEditingName}
              />
              <TouchableOpacity onPress={() => isEditingName ? handleUpdateName() : setIsEditingName(true)}>
                <Text style={styles.editBtnText}>{isEditingName ? 'SAVE' : 'EDIT'}</Text>
              </TouchableOpacity>
           </View>

           {/* EMAIL FIELD - NOW UNLOCKED */}
           <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
           <View style={styles.inputRow}>
              <TextInput 
                style={[styles.nameInput, !isEditingEmail && {color: '#64748B'}]}
                value={email}
                onChangeText={setEmail}
                editable={isEditingEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => isEditingEmail ? handleUpdateEmail() : setIsEditingEmail(true)}>
                <Text style={styles.editBtnText}>{isEditingEmail ? 'SAVE' : 'EDIT'}</Text>
              </TouchableOpacity>
           </View>
        </View>

        <TouchableOpacity 
          style={styles.signOutRow} 
          onPress={async () => { await signOut(auth); router.replace('/login'); }}
        >
          <View style={styles.signOutIcon}>
            <MaterialIcons name="logout" size={22} color="#EF4444" />
          </View>
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
  nameInput: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1E293B' },
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
});