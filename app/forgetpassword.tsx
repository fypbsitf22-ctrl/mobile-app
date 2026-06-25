import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useRef, useState } from 'react'; // Added useRef

import {
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
  View,
} from 'react-native';
import { auth } from '../firebaseConfig';

const { width, height } = Dimensions.get('window');

export default function ForgetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  // --- Cute Alert States & Animation ---
  const [modalVisible, setModalVisible] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const showCuteAlert = (title: string, message: string, success: boolean = false) => {
    setAlertTitle(title);
    setAlertMsg(message);
    setIsSuccess(success);
    setModalVisible(true);

    // Trigger Spring Animation
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handleReset = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      showCuteAlert("Oops! 👋", "Please type your email so we can help you! ✉️", false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      showCuteAlert("Yay! ✨", "We sent a special link to your email. Check it soon! 🌟", true);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        showCuteAlert("Hmm... 🔍", "We couldn't find that email. Try again?", false);
      } else if (error.code === 'auth/invalid-email') {
        showCuteAlert("Invalid Email 📧", "Please enter a valid email address.", false);
      } else {
        showCuteAlert("Oopsie! 🎈", "Something went wrong. Check your internet!", false);
      }
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (isSuccess) {
      router.replace('/login');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.mainContainer}
    >
      <StatusBar barStyle="dark-content" />

      {/* --- CUTE POPUP MODAL (MATCHED DESIGN) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.rewardBox, 
              { 
                transform: [{ scale: scaleAnim }],
                borderColor: isSuccess ? '#E8F5E9' : '#FFF3E0' 
              }
            ]}
          >
            <View style={[styles.iconCircleLarge, { backgroundColor: isSuccess ? '#E8F5E9' : '#FFF3E0' }]}>
              <Ionicons 
                name={isSuccess ? "happy-outline" : "star"} 
                size={80} 
                color={isSuccess ? "#66BB6A" : "#FF9800"} 
              />
            </View>
            <Text style={[styles.wellDoneText, { color: isSuccess ? "#66BB6A" : "#FF9800" }]}>
                {alertTitle}
            </Text>
            <Text style={styles.rewardSubText}>{alertMsg}</Text>
            <TouchableOpacity 
              style={[styles.modalActionBtn, { backgroundColor: isSuccess ? "#66BB6A" : "#4CAF50" }]} 
              onPress={handleModalClose}
            >
              <Text style={styles.modalActionBtnText}>
                  {isSuccess ? "Go to Login 👍" : "Try Again! 👍"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerSection}>
          <View style={styles.textHeaderWrap}>
            <Text style={styles.welcomeText}>Oh No!</Text>
            <Text style={styles.subText}>Don't worry, we'll help you! ✨</Text>
          </View>
          <Image 
            source={require('../assets/images/forgetpassword.png')} 
            style={styles.characterImage} 
            resizeMode="contain" 
          />
        </View>

        <View style={styles.formSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color="#B48454" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.loginTitle}>Reset Password</Text>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email-outline" size={22} color="#888" style={styles.icon}/>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleReset}>
            <Text style={styles.loginButtonText}>SEND LINK</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Found your password? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={styles.signUpText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFF9E9' },
  headerSection: { height: height * 0.35, justifyContent: 'center', paddingHorizontal: 30, zIndex: 1 },
  textHeaderWrap: { marginTop: 40 },
  welcomeText: { fontSize: 32, fontWeight: '900', color: '#E87D88' },
  subText: { fontSize: 18, color: '#EB8F90', marginTop: 5, fontWeight: '500' },
  characterImage: { position: 'absolute', right: 5, bottom: -30, width: width * 0.5, height: height * 0.35, zIndex: 10 },
  formSection: { flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 50, borderTopRightRadius: 50, paddingHorizontal: 30, paddingTop: 30, elevation: 5 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { color: '#B48454', fontWeight: 'bold', fontSize: 16 },
  loginTitle: { fontSize: 30, fontWeight: 'bold', color: '#B48454', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#FDEFD9', borderRadius: 20, paddingHorizontal: 15, height: 60, marginBottom: 30 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  loginButton: { backgroundColor: '#FFC26D', height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  loginButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#666', fontSize: 15 },
  signUpText: { color: '#D19E67', fontSize: 15, fontWeight: 'bold' },

  // --- CUTE MODAL STYLES (MATCHED) ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  rewardBox: { backgroundColor: '#FFF', padding: 30, borderRadius: 50, alignItems: 'center', elevation: 20, width: '85%', borderWidth: 10 },
  iconCircleLarge: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  wellDoneText: { fontSize: 28, fontWeight: '900', textAlign: 'center' },
  rewardSubText: { fontSize: 18, color: '#555', fontWeight: '700', marginTop: 10, textAlign: 'center', lineHeight: 26 },
  modalActionBtn: { paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, marginTop: 20 },
  modalActionBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});