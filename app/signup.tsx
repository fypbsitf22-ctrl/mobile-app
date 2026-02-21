import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert // Added Alert for consistent popups
  ,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email Validation Helper
  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleSignup = async () => {
    // 1. Check if fields are missing
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    // 2. Validate email format
    if (!validateEmail(email)) {
      Alert.alert("Error", "Enter a valid email.");
      return;
    }

    // 3. Password criteria (≥ 8 characters)
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }

    // 4. Confirm password match
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role: selectedRole || 'student', // fallback if role is missing
        status: "active",
        createdAt: new Date().toISOString()
      });

      Alert.alert("Success", "Registration Successful");
      router.replace("/login");
    } catch (error: any) {
      console.log("Signup error:", error.code);
      
      // Handle specific error codes from Use Case
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert("Error", "Account already exists.");
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert("Error", "Unable to connect.");
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert("Error", "Enter a valid email.");
      } else {
        Alert.alert("Error", error.message);
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.mainContainer}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerSection}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#B48454" />
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>
          
          <Image 
            source={require('../assets/images/signup.png')} 
            style={styles.elephantImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.signUpTitle}>Sign up</Text>

          {/* Name */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color="#888" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#A0A0A0"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email-outline" size={22} color="#888" style={styles.icon} />
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

          {/* Password */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={22} color="#888" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A0A0A0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={22} 
                color="#888" 
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={22} color="#888" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#A0A0A0"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons 
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                size={22} 
                color="#888" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.signUpButton}
            onPress={handleSignup}
          >
            <Text style={styles.signUpButtonText}>Sign up</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ... keep your styles object exactly as it was ...
const styles = StyleSheet.create({
  mainContainer: { flex:1, backgroundColor:'#FFF9E9' },
  headerSection: { height: height*0.25, justifyContent:'flex-end', paddingHorizontal:25, paddingBottom:20, zIndex:1 },
  backButton: { flexDirection:'row', alignItems:'center', position:'absolute', top:60, left:25 },
  backText: { fontSize:18, color:'#B48454', marginLeft:8, fontWeight:'600' },
  elephantImage: { position:'absolute', right:20, bottom:-40, width:width*0.4, height:height*0.25, zIndex:10 },
  formSection: { flex:1, backgroundColor:'#FFFFFF', borderTopLeftRadius:50, borderTopRightRadius:50, paddingHorizontal:30, paddingTop:50, shadowColor:'#000', shadowOffset:{ width:0, height:-5 }, shadowOpacity:0.05, shadowRadius:10, elevation:5 },
  signUpTitle: { fontSize:42, fontWeight:'bold', color:'#B48454', marginBottom:30 },
  inputContainer: { flexDirection:'row', alignItems:'center', backgroundColor:'#FFF', borderWidth:1.5, borderColor:'#FDEFD9', borderRadius:20, paddingHorizontal:15, height:60, marginBottom:15 },
  icon:{ marginRight:10 },
  input:{ flex:1, fontSize:16, color:'#333' },
  signUpButton:{ backgroundColor:'#FFC26D', height:65, borderRadius:20, justifyContent:'center', alignItems:'center', marginTop:25, shadowColor:'#FFC26D', shadowOffset:{width:0, height:8}, shadowOpacity:0.3, shadowRadius:10, elevation:8 },
  signUpButtonText:{ color:'#B48454', fontSize:24, fontWeight:'bold' },
  footerRow:{ flexDirection:'row', justifyContent:'center', marginTop:20, marginBottom:40 },
  footerText:{ color:'#666', fontSize:15 },
  signInText:{ color:'#D19E67', fontSize:15, fontWeight:'bold' },
});

export default SignUpScreen;