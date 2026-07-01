import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../firebaseConfig';
import MainHeader from '../MainHeaderShared';

const { width } = Dimensions.get('window');

const GRADES = [
  { id: 'Pre-K', name: 'Pre-K', color: '#FFADAD', icon: 'egg', audio: require('../../assets/audio/prek.mp3') },
  { id: 'Class 1', name: 'Class 1', color: '#A2D2FF', icon: 'school', audio: require('../../assets/audio/class1.mp3') },
  { id: 'Class 2', name: 'Class 2', color: '#CAFFBF', icon: 'book', audio: require('../../assets/audio/class2.mp3') },
  { id: 'Class 3', name: 'Class 3', color: '#FFD6A5', icon: 'pencil', audio: require('../../assets/audio/class3.mp3') },
];

const SUBJECTS = [
  { id: 'English', name: 'English', color: '#E8E0FF', icon: 'text', textColor: '#8A70D6', audio: require('../../assets/audio/english.mp3') },
  { id: 'Urdu', name: 'Urdu', color: '#E0F9E9', icon: 'pencil', textColor: '#66BB6A', audio: require('../../assets/audio/urdu.mp3') },
  { id: 'Maths', name: 'Maths', color: '#FDE4E4', icon: 'calculator', textColor: '#E87D88', audio: require('../../assets/audio/maths.mp3') },
];

export default function AcademicMain({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollRef = useRef<ScrollView>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const isProcessingAudio = useRef(false);

  // Persistence: Removed 'type' from state, we will pass 'Reading' manually on navigation
  const [selection, setSelection] = useState({ 
    grade: (params.grade as string) || '', 
    subject: (params.subject as string) || ''
  });
  
  const [voiceUrls, setVoiceUrls] = useState<any>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
    });

    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "app_config", "academic_sounds");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setVoiceUrls(data);
          if (data.instruction1_url && !selection.grade) playAudio(data.instruction1_url, true);
        } else {
          setVoiceUrls({});
        }
      } catch (e) { setVoiceUrls({}); }
    };
    fetchConfig();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  async function playAudio(source: any, isUri: boolean) {
    if (!source || isProcessingAudio.current) return;
    isProcessingAudio.current = true;
    try {
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (err) {}
        soundRef.current = null;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        isUri ? { uri: source } : source,
        { shouldPlay: true }
      );
      soundRef.current = newSound;

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch (e) {
    } finally {
      isProcessingAudio.current = false;
    }
  }

  const handleGradeSelect = (item: any) => {
    setSelection({ grade: item.id, subject: '' });
    playAudio(item.audio, false);
    setTimeout(() => {
      if (voiceUrls?.instruction2_url) playAudio(voiceUrls.instruction2_url, true);
      scrollRef.current?.scrollTo({ y: 200, animated: true });
    }, 1500);
  };

  const handleSubjectSelect = (item: any) => {
    setSelection(prev => ({ ...prev, subject: item.id }));
    playAudio(item.audio, false);
    // After subject selection, we scroll to show the Start button
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 500);
  };

  const startLearning = async () => {
    if (voiceUrls?.instruction4_url) {
      await playAudio(voiceUrls.instruction4_url, true);
    }
    
    setTimeout(() => {
      const basePath = role === 'parent' ? '/parent/academic' : '/teacher/academic';
      router.push({
        pathname: `${basePath}/contentlist` as any,
        // TYPE is hardcoded to 'Reading' here
        params: { ...selection, type: 'Reading' }
      });
    }, 1500);
  };

  const InstructionCard = ({ title, url }: { title: string, url: string }) => (
    <View style={styles.instructionCard}>
      <Text style={styles.instructionText}>{title}</Text>
      <TouchableOpacity onPress={() => playAudio(url, true)} style={styles.speakerBtn}>
        <Ionicons name="volume-high" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  if (!voiceUrls) return <View style={styles.center}><ActivityIndicator size="large" color="#C4A6FB" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader role={role} />

      <View style={styles.titleRow}>
        <TouchableOpacity 
          onPress={() => {
            const mainPage = role === 'parent' ? '/parent/main' : '/teacher/main';
            router.push(mainPage as any);
          }} 
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={30} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCard}>
          <Text style={styles.headerText}>Academic Learning</Text>
        </View>
      </View>
      
      <ScrollView 
        ref={scrollRef} 
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* STEP 1: CLASS */}
        <View style={styles.section}>
          <InstructionCard title="Choose your Class 🎓" url={voiceUrls.instruction1_url} />
          <View style={styles.grid}>
            {GRADES.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={[styles.card, { backgroundColor: item.color }, selection.grade === item.id && styles.selectedBorder]} 
                onPress={() => handleGradeSelect(item)}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon as any} size={40} color={item.color} />
                </View>
                <Text style={styles.cardText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* STEP 2: SUBJECT */}
        {selection.grade !== '' && (
          <View style={styles.section}>
            <InstructionCard title="Choose your Subject 📘" url={voiceUrls.instruction2_url} />
            <View style={styles.grid}>
              {SUBJECTS.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  style={[styles.card, { backgroundColor: item.color }, selection.subject === item.id && styles.selectedBorder]} 
                  onPress={() => handleSubjectSelect(item)}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons name={item.icon as any} size={40} color={item.textColor} />
                  </View>
                  <Text style={[styles.cardText, { color: item.textColor }]}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* START BUTTON appears after Subject is chosen */}
        {selection.subject !== '' && (
          <TouchableOpacity style={styles.startBtn} onPress={startLearning}>
            <Text style={styles.startBtnText}>Start Learning 🚀</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  backBtn: { backgroundColor: '#C4A6FB', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  headerCard: { flex: 1, backgroundColor: '#F3EFFF', padding: 15, borderRadius: 25, alignItems: 'center', marginLeft: 15 },
  headerText: { fontSize: 22, fontWeight: 'bold', color: '#6B46C1' },
  mainScrollView: { marginTop: 20 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  section: { marginBottom: 25 },
  instructionCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 20, alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, elevation: 3 },
  instructionText: { fontSize: 18, fontWeight: '900', color: '#444', flex: 1 },
  speakerBtn: { backgroundColor: '#C4A6FB', padding: 8, borderRadius: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: width * 0.42, height: 130, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 15, elevation: 2 },
  selectedBorder: { borderWidth: 4, borderColor: '#C4A6FB', backgroundColor: '#FFF' },
  iconCircle: { backgroundColor: '#FFF', width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  cardText: { fontSize: 17, fontWeight: 'bold', color: '#444' },
  startBtn: { backgroundColor: '#66BB6A', padding: 20, borderRadius: 30, alignItems: 'center', marginTop: 10, elevation: 5, borderBottomWidth: 5, borderBottomColor: '#4CAF50' },
  startBtnText: { color: '#FFF', fontSize: 24, fontWeight: '900' }
});