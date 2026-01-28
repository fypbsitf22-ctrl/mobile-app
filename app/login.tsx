import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

const { width, height } = Dimensions.get('window');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginScreen = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- Cute Alert States ---
  const [modalVisible, setModalVisible] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertTitle, setAlertTitle] = useState('');

  const showCuteAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMsg(message);
    setModalVisible(true);
  };

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showCuteAlert("Oops!", "Don't forget to fill in both boxes! ✨");
      return;
    }

    if (!emailRegex.test(email)) {
      showCuteAlert("Hmm...", "That email looks a bit silly. Can you check it again? ✉️");
      return;
    }
setLoading(true); // Start loading
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

     if (docSnap.exists()) {
      const userData = docSnap.data();
      
      // Normalize role to lowercase to avoid "Parent" vs "parent" errors
      const role = userData.role?.toLowerCase(); 

      // 3️⃣ Redirect based on the role found in Firestore
      if (role === "parent") {
        router.replace("/parent/main");
      } else if (role === "teacher") {
        router.replace("/teacher/main");
      } else if (role === "admin") {
        router.replace("/adminpanel");
      } else {
        // If role is missing or spelled wrong in DB
        showCuteAlert("Wait!", "We found your account, but we don't know if you're a parent or teacher! 🌈");
      }
    } else {
      showCuteAlert("Oh no!", "We found your email, but your profile is missing. Ask for help! 👤");
    }

  } catch (error: any) {
    console.log("Login error:", error);
    
    // Friendly error messages for MID learners
    if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
      showCuteAlert("Not Found", "We don't know that email or password. Try again! 🌟");
    } else if (error.code === "auth/wrong-password") {
      showCuteAlert("Almost!", "That password isn't quite right. Try again! 🔑");
    } else if (error.code === "auth/network-request-failed") {
      showCuteAlert("Internet?", "Your internet seems to be sleeping. Wake it up! 🌐");
    } else {
      showCuteAlert("Oopsie!", "Something went wrong. Let's try one more time! 🎈");
    }
  } finally {
    setLoading(false); // Stop loading regardless of success or fail
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
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="star" size={40} color="#FFC26D" />
            </View>
            <Text style={styles.modalTitle}>{alertTitle}</Text>
            <Text style={styles.modalMessage}>{alertMsg}</Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Okay!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.textHeaderWrap}>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.subText}>Let's Learn and Have Fun!</Text>
          </View>
          <Image 
            source={require('../assets/images/login.png')} 
            style={styles.characterImage} 
            resizeMode="contain" 
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.loginTitle}>Login</Text>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email-outline" size={22} color="#888" style={styles.icon}/>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={22} color="#888" style={styles.icon}/>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A0A0A0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#888"/>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push("./forgetpassword" as any)}>
            <Text style={{ color: "#C28748", fontSize: 15, fontWeight: "600", marginBottom: 15, marginLeft: 5 }}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>LOGIN</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/role")}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFF9E9' },
  headerSection: { height: height * 0.35, justifyContent: 'center', paddingHorizontal: 30, zIndex: 1 },
  textHeaderWrap: { marginTop: 40 },
  welcomeText: { fontSize: 32, fontWeight: '900', color: '#E87D88' },
  subText: { fontSize: 18, color: '#EB8F90', marginTop: 5, fontWeight: '500' },
  characterImage: { position: 'absolute', right: 10, bottom: -30, width: width * 0.45, height: height * 0.3, zIndex: 10 },
  formSection: { flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 50, borderTopRightRadius: 50, paddingHorizontal: 30, paddingTop: 40, marginTop: 0, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
  loginTitle: { fontSize: 36, fontWeight: 'bold', color: '#B48454', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#FDEFD9', borderRadius: 20, paddingHorizontal: 15, height: 60, marginBottom: 20 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  loginButton: { backgroundColor: '#FFC26D', height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#FFC26D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  loginButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 25, marginBottom: 30 },
  footerText: { color: '#666', fontSize: 15 },
  signUpText: { color: '#D19E67', fontSize: 15, fontWeight: 'bold' },

  // --- Cute Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)', // Darker background to focus on modal
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.8,
    backgroundColor: '#FFF9E9', // Match app cream color
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFC26D', // Soft orange border
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E87D88', // Pink
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#B48454', // Brown
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#FFC26D',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;