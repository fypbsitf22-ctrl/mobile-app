import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function MainHeaderShared({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || role === 'teacher') return;

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data());
    });
    return () => unsubscribe();
  }, []);

  const isTeacher = role === 'teacher';

  return (
    <View style={styles.headerContainer}>
      <View style={styles.contentRow}>
        
        {/* LEFT SIDE: Profile/Buddy & Hello */}
        <View style={styles.leftSection}>
          <TouchableOpacity 
            style={styles.buddyCircle} 
            onPress={() => router.push(`/${role}/userprofile` as any)}
          >
            {isTeacher ? (
              <Ionicons name="school" size={30} color="#A2D2FF" />
            ) : (
              userData?.selectedBuddy?.endsWith('.json') ? (
                <LottieView source={{ uri: userData.selectedBuddy }} autoPlay loop style={styles.buddyImg} />
              ) : (
                <Image 
                  source={userData?.selectedBuddy ? { uri: userData.selectedBuddy } : require('../assets/images/animals.png')} 
                  style={styles.buddyImg}
                />
              )
            )}
          </TouchableOpacity>
          <View style={styles.textColumn}>
            <Text style={styles.helloText}>Hello {isTeacher ? 'Teacher' : 'Little'} 👋</Text>
            <Text style={styles.nameText}>{isTeacher ? 'Administrator' : (userData?.name || 'Learner')}</Text>
          </View>
        </View>

        {/* RIGHT SIDE: Notifications & Settings */}
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push(`/${role}/notification` as any)}>
            <Ionicons name="notifications-outline" size={26} color="#B48454" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push(`/${role}/settings` as any)}>
            <Ionicons name="settings-outline" size={26} color="#B48454" />
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 40, // Curved corners below
    borderBottomRightRadius: 40,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buddyCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF9E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFC26D',
    overflow: 'hidden',
  },
  buddyImg: {
    width: 45,
    height: 45,
  },
  textColumn: {
    marginLeft: 12,
  },
  helloText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  nameText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#444',
  },
  rightSection: {
    flexDirection: 'row',
  },
  iconBtn: {
    marginLeft: 15,
    backgroundColor: '#FFF9E9',
    padding: 8,
    borderRadius: 12,
  }
});