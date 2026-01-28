import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect } from 'react';
import { Dimensions, Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Wait for 2 seconds (for splash animation feel)
      setTimeout(async () => {
        if (user) {
          // USER IS LOGGED IN - Check their role
          try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const role = docSnap.data().role?.toLowerCase();
              if (role === "parent") router.replace("/parent/main");
              else if (role === "teacher") router.replace("/teacher/main");
              else if (role === "admin") router.replace("/adminpanel");
              else router.replace("/login");
            } else {
              router.replace("/login");
            }
          } catch (error) {
            router.replace("/login");
          }
        } else {
          // NO USER LOGGED IN - Go to Login
          router.replace("/login");
        }
      }, 2000);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9E9" />
      <View style={styles.textContainer}>
        <Text style={styles.logoText}>
          <Text style={{ color: '#E87D88' }}>MIND</Text>
          <Text style={{ color: '#F2A663' }}>B</Text>
          <Text style={{ color: '#A392D6' }}>UD</Text>
          <Text style={{ color: '#E5915D' }}>DY</Text>
        </Text>
      </View>
      <Image source={require('../assets/images/cloud.png')} style={styles.cloudShape} resizeMode="stretch" />
      <Image source={require('../assets/images/animals.png')} style={styles.animalsImage} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9', alignItems: 'center' },
  textContainer: { marginTop: height * 0.25 },
  logoText: { fontSize: 52, fontWeight: '900', letterSpacing: 2 },
  cloudShape: { position: 'absolute', bottom: 0, right: 0, width: width * 0.9, height: height * 0.65 },
  animalsImage: { position: 'absolute', bottom: 0, right: 0, width: width * 0.85, height: height * 0.5 },
});

export default SplashScreen;