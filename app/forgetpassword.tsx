import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react';

import {
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

  // --- Cute Alert States ---
  const [modalVisible, setModalVisible] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const showCuteAlert = (title: string, message: string, success: boolean = false) => {
    setAlertTitle(title);
    setAlertMsg(message);
    setIsSuccess(success);
    setModalVisible(true);
  };

  const handleReset = async () => {
  // Use .trim() to remove accidental spaces!
  const cleanEmail = email.trim();

  if (!cleanEmail) {
    showCuteAlert("Oops!", "Please type your email so we can help you! ✉️");
    return;
  }

     try {
    // Use the cleanEmail variable
    await sendPasswordResetEmail(auth, cleanEmail);
    console.log("Reset email sent to:", cleanEmail);
    showCuteAlert("Yay!", "We sent a special link to your email. Check it soon! 🌟", true);
  } catch (error: any) {
    console.log("Firebase Error Code:", error.code);
    console.log("Firebase Error Message:", error.message);
    
    if (error.code === 'auth/user-not-found') {
      showCuteAlert("Hmm...", "We couldn't find that email. Try again? 🔍");
    } else if (error.code === 'auth/invalid-email') {
      showCuteAlert("Wait!", "That email looks a bit strange. Can you check it? ✏️");
    } else {
      showCuteAlert("Oopsie!", "Something went wrong. Make sure you are connected to the internet! 🎈");
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

      {/* --- CUSTOM CUTE MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.iconCircle}>
              <Ionicons 
                name={isSuccess ? "happy-outline" : "star"} 
                size={40} 
                color="#FFC26D" 
              />
            </View>
            <Text style={styles.modalTitle}>{alertTitle}</Text>
            <Text style={styles.modalMessage}>{alertMsg}</Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={handleModalClose}
            >
              <Text style={styles.modalButtonText}>{isSuccess ? "Go to Login" : "Okay!"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
        
        {/* Header Section - Same as Login */}
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

        {/* Form Section - White Card */}
        <View style={styles.formSection}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={20} color="#B48454" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.loginTitle}>Reset Password</Text>

          {/* Email Input */}
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

          {/* Reset Button */}
          <TouchableOpacity style={styles.loginButton} onPress={handleReset}>
            <Text style={styles.loginButtonText}>SEND LINK</Text>
          </TouchableOpacity>

          {/* Bottom Link */}
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
  formSection: { flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 50, borderTopRightRadius: 50, paddingHorizontal: 30, paddingTop: 30, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { color: '#B48454', fontWeight: 'bold', fontSize: 16 },
  loginTitle: { fontSize: 30, fontWeight: 'bold', color: '#B48454', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#FDEFD9', borderRadius: 20, paddingHorizontal: 15, height: 60, marginBottom: 30 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  loginButton: { backgroundColor: '#FFC26D', height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#FFC26D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  loginButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#666', fontSize: 15 },
  signUpText: { color: '#D19E67', fontSize: 15, fontWeight: 'bold' },

  // --- Cute Modal Styles ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: width * 0.8, backgroundColor: '#FFF9E9', borderRadius: 30, padding: 25, alignItems: 'center', borderWidth: 4, borderColor: '#FFC26D' },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#E87D88', marginBottom: 10 },
  modalMessage: { fontSize: 16, color: '#B48454', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  modalButton: { backgroundColor: '#FFC26D', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 20 },
  modalButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});