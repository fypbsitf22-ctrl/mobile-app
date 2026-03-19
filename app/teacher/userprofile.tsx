import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { signOut, updateEmail } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
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
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // CORRECTED: Real-time listener with Error Handling
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      userRef, 
      (docSnap) => {
        // Only update if the user is still logged in
        if (docSnap.exists() && auth.currentUser) {
          const data = docSnap.data();
          setName(data.name || '');
          setProfileImage(data.profileImage || null);
          setEmail(data.email || user.email || '');
        }
      },
      (error) => {
        // This is the fix for your error. It catches the permission loss during logout.
        if (error.code === 'permission-denied') {
          console.log("Teacher profile listener detached safely.");
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const copyToClipboard = async () => {
    try {
      const code = auth.currentUser?.uid;
      if (code) {
        await Clipboard.setStringAsync(code);
        Alert.alert("Copied! ✅", "Classroom code copied to clipboard.");
      }
    } catch (err) {
      Alert.alert("Error", "Could not copy code.");
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
      Alert.alert("Success", "Profile photo updated!");
    } catch (error: any) {
      Alert.alert("Upload Error", error.message);
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdateEmail = async () => {
    if (!email.trim() || !email.includes('@')) return Alert.alert("Error", "Valid email is required");
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateEmail(user, email);
        await updateDoc(doc(db, "users", user.uid), { email: email });
        setIsEditingEmail(false);
        Alert.alert("Success", "Email updated successfully!");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  // Dedicated Logout function to prevent errors
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to exit?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive",
        onPress: async () => {
          try {
            // Navigate to login FIRST to unmount this screen and stop listeners
            router.replace('/login'); 
            // Sign out after a small delay
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

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{color: '#FFF', marginTop: 10, fontWeight: '700'}}>PROCESSING...</Text>
        </View>
      )}

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
           <Text style={styles.inputLabel}>MY CLASSROOM CODE (Share with Students)</Text>
           <TouchableOpacity 
             style={[styles.inputRow, { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' }]}
             onPress={copyToClipboard}
             activeOpacity={0.7}
           >
              <Text style={[styles.nameInput, { color: '#4F46E5' }]}>{auth.currentUser?.uid || 'Loading...'}</Text>
              <Ionicons name="copy-outline" size={20} color="#4F46E5" />
           </TouchableOpacity>

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
          onPress={handleLogout}
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
});