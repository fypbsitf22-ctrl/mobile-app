import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

const { width, height } = Dimensions.get('window');

const SignUpScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedRole = params.selectedRole as string;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const warnAnim = useRef(new Animated.Value(0)).current;

  const [teacherCodes, setTeacherCodes] = useState<string[]>(['']);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  const triggerWarning = (msg: string) => {
    setAlertMsg(msg);
    setShowWarningModal(true);
    warnAnim.setValue(0);
    Animated.spring(warnAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  const updateTeacherCode = (text: string, index: number) => {
    const updated = [...teacherCodes];
    updated[index] = text;
    setTeacherCodes(updated);
  };

  const addTeacherCodeField = () => {
    setTeacherCodes([...teacherCodes, '']);
  };

  const removeTeacherCodeField = (index: number) => {
    if (teacherCodes.length === 1) {
      setTeacherCodes(['']);
      return;
    }
    setTeacherCodes(teacherCodes.filter((_, i) => i !== index));
  };

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      triggerWarning("Please fill all the boxes! ✨");
      return;
    }

    const filledCodes = teacherCodes.map(c => c.trim()).filter(c => c.length > 0);
    
    if (selectedRole === 'parent') {
      if (filledCodes.length === 0) {
        triggerWarning("Please enter a Teacher Code to connect! 🏫");
        return;
      }

      setLoading(true);
      try {
        for (const code of filledCodes) {
          const teacherDocRef = doc(db, "users", code);
          const teacherDocSnap = await getDoc(teacherDocRef);

          if (!teacherDocSnap.exists() || teacherDocSnap.data().role !== 'teacher') {
            setLoading(false);
            triggerWarning(`Invalid teacher code. please try again`);
            return; 
          }
        }
      } catch (err: any) {
        setLoading(false);
        triggerWarning("Connection error. Try again! 🌐");
        return;
      }
    }

    if (!validateEmail(email)) {
      triggerWarning("Invalid email. please try again.");
      return;
    }

    if (password.length < 8) {
        triggerWarning("Password must be at least 8 characters! 🔑");
        return;
    }

    if (password !== confirmPassword) {
        triggerWarning("Passwords do not match! 👯. please try again");
        return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        role: selectedRole || 'parent',
        teacherIds: selectedRole === 'parent' ? filledCodes : [],
        teacherId: selectedRole === 'teacher' ? user.uid : (filledCodes[0] || ''),
        status: "active",
        createdAt: new Date().toISOString()
      });

      setLoading(false);
      
      // SUCCESS POPUP
      setShowSuccessModal(true);
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();

      setTimeout(() => {
        setShowSuccessModal(false);
        router.replace("/login");
      }, 3000);

    } catch (error: any) {
      setLoading(false);
      triggerWarning(error.message);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      
      {/* CUTE SUCCESS MODAL */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.rewardBox, { transform: [{ scale: scaleAnim }], borderColor: '#E8F5E9' }]}>
            <View style={styles.iconCircleSuccess}>
               <Ionicons name="checkmark-circle" size={100} color="#66BB6A" />
            </View>
            <Text style={styles.successTitle}>WELCOME! 🎉</Text>
            <Text style={styles.rewardSubText}>Account created!{"\n"}Let's start learning!</Text>
          </Animated.View>
        </View>
      </Modal>

      {/* CUTE WARNING MODAL */}
      <Modal visible={showWarningModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.rewardBox, { transform: [{ scale: warnAnim }], borderColor: '#FFF3E0' }]}>
            <View style={styles.iconCircleWarning}>
               <Ionicons name="alert-circle" size={100} color="#FF9800" />
            </View>
            <Text style={styles.warningTitle}>Almost There! 👋</Text>
            <Text style={styles.rewardSubText}>{alertMsg}</Text>
            <TouchableOpacity style={styles.warningBtn} onPress={() => setShowWarningModal(false)}>
              <Text style={styles.warningBtnText}>Try Again! 👍</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#B48454" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Image source={require('../assets/images/signup.png')} style={styles.elephantImage} resizeMode="contain" />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.signUpTitle}>Sign up</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color="#888" style={styles.icon} />
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#A0A0A0" value={name} onChangeText={setName} />
          </View>

          {selectedRole === 'parent' && (
            <View style={styles.teacherSection}>
              <Text style={styles.teacherLabel}>
                <Ionicons name="school-outline" size={15} color="#009688" /> Teacher Code(s)
              </Text>

              {teacherCodes.map((code, index) => (
                <View key={index} style={styles.teacherCodeRow}>
                  <View style={[styles.inputContainer, { flex: 1, marginBottom: 0 }]}>
                    <Ionicons name="school-outline" size={22} color="#888" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder={`Teacher Code ${index + 1}`}
                      placeholderTextColor="#A0A0A0"
                      value={code}
                      onChangeText={(text) => updateTeacherCode(text, index)}
                      autoCapitalize="none"
                    />
                  </View>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeTeacherCodeField(index)}>
                    <Ionicons name="close-circle" size={26} color="#E87D88" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addCodeBtn} onPress={addTeacherCodeField}>
                <Ionicons name="add-circle-outline" size={20} color="#009688" />
                <Text style={styles.addCodeText}>Add Another Teacher Code</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email-outline" size={22} color="#888" style={styles.icon} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#A0A0A0" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={22} color="#888" style={styles.icon} />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#A0A0A0" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={22} color="#888" style={styles.icon} />
            <TextInput style={styles.input} placeholder="Confirm password" placeholderTextColor="#A0A0A0" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.signUpButton, loading && { opacity: 0.7 }]} 
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#B48454" /> : <Text style={styles.signUpButtonText}>Sign up</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFF9E9' },
  headerSection: { height: height * 0.25, justifyContent: 'flex-end', paddingHorizontal: 25, paddingBottom: 20 },
<<<<<<< HEAD
  backButton: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 70, left: 25 },
  backText: { fontSize: 18, color: '#B48454', marginLeft: 8, fontWeight: '600' },
  elephantImage: { position: 'absolute', right: 20, bottom: -30, width: width * 0.4, height: height * 0.25, zIndex: 10 },
=======
  backButton: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 60, left: 25 },
  backText: { fontSize: 18, color: '#B48454', marginLeft: 8, fontWeight: '600' },
  elephantImage: { position: 'absolute', right: 20, bottom: -40, width: width * 0.4, height: height * 0.25, zIndex: 10 },
>>>>>>> 4f78456134c108c1f30e37d81a2b3f46537684c6
  formSection: { flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 50, borderTopRightRadius: 50, paddingHorizontal: 30, paddingTop: 50, elevation: 5 },
  signUpTitle: { fontSize: 42, fontWeight: 'bold', color: '#B48454', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#FDEFD9', borderRadius: 20, paddingHorizontal: 15, height: 60, marginBottom: 15 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
<<<<<<< HEAD
  signUpButton: { backgroundColor: '#FFC26D', height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 25, marginBottom: 20 },
=======
  signUpButton: { backgroundColor: '#FFC26D', height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 25, marginBottom: 30 },
>>>>>>> 4f78456134c108c1f30e37d81a2b3f46537684c6
  signUpButtonText: { color: '#B48454', fontSize: 24, fontWeight: 'bold' },
  teacherSection: { marginBottom: 15 },
  teacherLabel: { fontSize: 14, color: '#009688', fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  teacherCodeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  removeBtn: { marginLeft: 8 },
  addCodeBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  addCodeText: { fontSize: 15, color: '#009688', fontWeight: '600', marginLeft: 6 },

  // MODAL STYLES (MATCHING ROUTINE MODULE)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  rewardBox: { backgroundColor: '#FFF', padding: 30, borderRadius: 50, alignItems: 'center', elevation: 20, width: '85%', borderWidth: 10 },
  iconCircleSuccess: { marginBottom: 10 },
  iconCircleWarning: { marginBottom: 10 },
  successTitle: { fontSize: 28, fontWeight: '900', color: '#66BB6A', textAlign: 'center' },
  warningTitle: { fontSize: 28, fontWeight: '900', color: '#FF9800', textAlign: 'center' },
  rewardSubText: { fontSize: 18, color: '#555', fontWeight: '700', marginTop: 10, textAlign: 'center', lineHeight: 26 },
  warningBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, marginTop: 20 },
  warningBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default SignUpScreen;