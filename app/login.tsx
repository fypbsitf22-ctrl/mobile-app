import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react'; // Added useRef
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
  const [loading, setLoading] = useState(false);

  // --- Cute Alert States & Animation ---
  const [modalVisible, setModalVisible] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const scaleAnim = useRef(new Animated.Value(0)).current; // Animation Ref

  const showCuteAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMsg(message);
    setModalVisible(true);
    
    // Trigger Spring Animation
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showCuteAlert("Oops! 👋", "Please enter your email and password.");
      return;
    }

    if (!emailRegex.test(email)) {
      showCuteAlert("Invalid Email 📧", "Please enter a valid email format.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const role = userData.role?.toLowerCase();
        const hasBuddy = userData.selectedBuddy; 

        if (role === "parent") {
          if (!hasBuddy) {
            router.replace("./choosebuddy");
          } else {
            router.replace("/parent/main");
          }
        } 
        else if (role === "teacher") {
          router.replace("/teacher/main");
        } 
        else if (role === "admin") {
          router.replace("/adminpanel");
        } 
        else {
          showCuteAlert("Error ❌", "Role not recognized.");
        }
      } else {
        showCuteAlert("Error ❌", "No account with this email.");
      }

    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        showCuteAlert("Not Found 🔎", "No account with this email.Please try again");
      } else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        showCuteAlert("Oops! 🌟", "Your  password is incorrect. Please try again.");
      } else {
        showCuteAlert("Login Failed ⚠️", "Unable to connect. Please try again.");
      }
    } finally {
      setLoading(false);
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
          <Animated.View style={[styles.rewardBox, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.iconCircleLarge}>
              <Ionicons name="star" size={80} color="#FF9800" />
            </View>
            <Text style={styles.wellDoneText}>{alertTitle}</Text>
            <Text style={styles.rewardSubText}>{alertMsg}</Text>
            <TouchableOpacity 
              style={styles.warningBtn} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.warningBtnText}>Okay! 👍</Text>
            </TouchableOpacity>
          </Animated.View>
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
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, { opacity: loading ? 0.8 : 1 }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>LOGIN</Text>}
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
  formSection: { flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 50, borderTopRightRadius: 50, paddingHorizontal: 30, paddingTop: 40, elevation: 5 },
  loginTitle: { fontSize: 36, fontWeight: 'bold', color: '#B48454', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#FDEFD9', borderRadius: 20, paddingHorizontal: 15, height: 60, marginBottom: 20 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  forgotText: { color: "#C28748", fontSize: 15, fontWeight: "600", marginBottom: 25, marginLeft: 5 },
  loginButton: { backgroundColor: '#FFC26D', height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  loginButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 25, marginBottom: 30 },
  footerText: { color: '#666', fontSize: 15 },
  signUpText: { color: '#D19E67', fontSize: 15, fontWeight: 'bold' },

  // --- CUTE MODAL STYLES (MATCHING YOUR OTHER MODULES) ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  rewardBox: { backgroundColor: '#FFF', padding: 30, borderRadius: 50, alignItems: 'center', elevation: 20, width: '85%', borderWidth: 10, borderColor: '#FFF3E0' },
  iconCircleLarge: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  wellDoneText: { fontSize: 28, fontWeight: '900', color: '#FF9800', textAlign: 'center' },
  rewardSubText: { fontSize: 18, color: '#555', fontWeight: '700', marginTop: 10, textAlign: 'center', lineHeight: 26 },
  warningBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 50, paddingVertical: 15, borderRadius: 25, marginTop: 20 },
  warningBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
});

export default LoginScreen;