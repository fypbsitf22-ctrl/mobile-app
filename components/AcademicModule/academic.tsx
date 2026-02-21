import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MainHeader from '../MainHeaderShared'; // Path updated

const { width } = Dimensions.get('window');

const GRADES = [
  { id: 'Pre-K', name: 'Pre-K', color: '#FFADAD', icon: 'egg', sub: 'Tiny Tots', audio: require('../../assets/audio/prek.mp3') },
  { id: 'Class 1', name: 'Class 1', color: '#A2D2FF', icon: 'school', sub: 'Beginners', audio: require('../../assets/audio/class1.mp3') },
  { id: 'Class 2', name: 'Class 2', color: '#CAFFBF', icon: 'book', sub: 'Learners', audio: require('../../assets/audio/class2.mp3') },
  { id: 'Class 3', name: 'Class 3', color: '#FFD6A5', icon: 'pencil', sub: 'Pros', audio: require('../../assets/audio/class3.mp3') },
];

interface AcademicProps {
  role: 'parent' | 'teacher';
}

export default function AcademicMain({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          staysActiveInBackground: false,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) { console.log("Audio Error:", e); }
    };
    setupAudio();
  }, []);

   async function playAndNavigate(item: any) {
    const basePath = role === 'parent' ? '/parent/academic' : '/teacher/academic';
    try {
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync(item.audio, { shouldPlay: true });
      setSound(newSound);
      await newSound.playAsync();

      setTimeout(() => {
        router.push({
          pathname: `${basePath}/subjectselection` as any,
          params: { grade: item.id }
        });
      }, 1500);
    } catch (error) {
       router.push({
          pathname: `${basePath}/subjectselection` as any,
          params: { grade: item.id }
        });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader role={role} />
      
      {/* ADDED: Back Button and Header Row */}
      <View style={styles.topNavigation}>
      <TouchableOpacity
  onPress={() => {
    // Navigate to parent or teacher main page
    const mainPage = role === 'parent' ? '/parent/main' : '/teacher/main';
    router.push(mainPage as any);
  }}
  style={styles.backButton}
>
  <Ionicons name="arrow-back" size={28} color="#444" />
</TouchableOpacity>
        <View style={styles.headerArea}>
           <Text style={styles.mainTitle}>Pick your Class</Text>
           <Text style={styles.subTitle}>Select your level to start learning!</Text>
        </View>
        <View style={{ width: 40 }} /> 
      </View>

      <FlatList
        data={GRADES}
        renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.gradeCard, { backgroundColor: item.color }]}
              onPress={() => playAndNavigate(item)}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon as any} size={50} color={item.color} />
              </View>
              <Text style={styles.gradeTitle}>{item.name}</Text>
              <Text style={styles.gradeSubText}>{item.sub}</Text>
            </TouchableOpacity>
          )}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listPadding}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF9E9' },
    topNavigation: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginTop: 10 },
    backButton: { padding: 10, backgroundColor: '#FFF', borderRadius: 20, elevation: 2 },
    headerArea: { flex: 1, alignItems: 'center' },
    mainTitle: { fontSize: 28, fontWeight: '900', color: '#444' },
    subTitle: { fontSize: 14, color: '#888', fontWeight: '600', marginTop: 2 },
    row: { justifyContent: 'space-between', paddingHorizontal: 20 },
    gradeCard: { 
      width: width * 0.43, 
      height: 200, 
      borderRadius: 40, 
      padding: 20, 
      alignItems: 'center', 
      justifyContent: 'center', 
      marginTop: 20, 
      elevation: 8 
    },
    iconCircle: { 
      backgroundColor: '#FFF', 
      width: 80, 
      height: 80, 
      borderRadius: 40, 
      justifyContent: 'center', 
      alignItems: 'center',
      marginBottom: 15
    },
    gradeTitle: { fontSize: 22, fontWeight: 'bold', color: '#444' },
    gradeSubText: { fontSize: 14, color: '#666', fontWeight: '600' },
    listPadding: { paddingBottom: 40 }
});