import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayRemove, arrayUnion, collection, doc, getDocs, increment, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import { auth, db } from '../../firebaseConfig';
import MainHeaderShared from '../MainHeaderShared';

const { width } = Dimensions.get('window');

export default function IslamicItems({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const { itemId, subId, title } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [duaData, setDuaData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const updateProgress = async (type: 'recent' | 'finish' | 'progress', data?: any) => {
    if (role !== 'parent') return; 
    const user = auth.currentUser;
    if (!user || !data) return;
    const userRef = doc(db, "users", user.uid);
    const trackingId = (Array.isArray(itemId) ? itemId[0] : itemId) || (Array.isArray(subId) ? subId[0] : subId);

    try {
      if (type === 'recent') {
        await updateDoc(userRef, {
          recentHistory: arrayUnion({ id: trackingId, name: data.name, type: 'Islamic', timestamp: new Date().toISOString() })
        });
      } else if (type === 'progress') {
        await updateDoc(userRef, { inProgressLessons: arrayUnion(trackingId) });
      } else if (type === 'finish') {
        await updateDoc(userRef, {
          completedLessons: arrayUnion(trackingId),
          inProgressLessons: arrayRemove(trackingId),
          stars: increment(1)
        });
      }
    } catch (e) { console.log("Progress Error:", e); }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const targetId = (Array.isArray(itemId) ? itemId[0] : itemId) || (Array.isArray(subId) ? subId[0] : subId);
        if (!targetId) return setLoading(false);

        const cleanTargetId = targetId.trim();
        const querySnapshot = await getDocs(collection(db, "islamic_items"));
        
        let foundData = null;
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (doc.id.trim() === cleanTargetId || data.categoryID?.trim() === cleanTargetId) {
            foundData = { ...data, id: doc.id };
          }
        });

        if (foundData) {
          setDuaData(foundData);
          updateProgress('recent', foundData);
          updateProgress('progress', foundData);
        }
      } catch (error) { console.log("Fetch Error:", error); }
      setLoading(false);
    };
    fetchData();
  }, [itemId, subId]);

  const playSound = async (uri: string) => {
    if (!uri) return;
    try {
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      setSound(newSound);
    } catch (e) { console.log("Audio Error:", e); }
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?v=)|(&v=))([^#&?]*).*/;
    const match = url?.match(regExp);
    return (match && match[8].length === 11) ? match[8] : url;
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#A2D2FF" /></View>;

  if (!duaData) return (
    <View style={styles.center}>
      <Ionicons name="alert-circle" size={60} color="#A2D2FF" />
      <Text style={styles.errorText}>Lesson not found.</Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={{color: '#FFF', fontWeight: 'bold'}}>Retry</Text></TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MainHeaderShared role={role} /> 
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}><Ionicons name="arrow-back" size={28} color="#FFF" /></TouchableOpacity>
        <View style={styles.titleBadge}><Text style={styles.headerTitle}>{duaData.name}</Text></View>
      </View>

      <View style={styles.content}>
        {duaData.video ? (
          <View style={styles.mainContent}>
            <View style={styles.videoWrapper}><YoutubePlayer height={(width - 40) * 0.5625} play={true} videoId={getYoutubeId(duaData.video)} /></View>
            <Text style={styles.videoName}>{duaData.name}</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.dotRow}>{duaData.steps?.map((_:any, i:number)=>(<View key={i} style={[styles.dot, currentStep===i && styles.activeDot]}/>))}</View>
            <View style={styles.imageBox}><Image source={{ uri: duaData.steps[currentStep].image }} style={styles.stepImage} resizeMode="contain" /></View>
            <Text style={styles.arabicText}>{duaData.steps[currentStep].arabic}</Text>
            <View style={styles.translationBox}><Text style={styles.translationText}>{duaData.steps[currentStep].Translation}</Text></View>
            <TouchableOpacity style={styles.audioBtn} onPress={() => playSound(duaData.steps[currentStep].audio)}>
                <Ionicons name="volume-high" size={32} color="#FFF" /><Text style={styles.audioBtnText}>Hear Dua</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: '#A2D2FF' }]} onPress={() => {
            if (!duaData.video && currentStep > 0) setCurrentStep(p => p - 1);
            else router.back();
          }}><Text style={styles.navText}>Back</Text></TouchableOpacity>

          <TouchableOpacity style={[styles.navBtn, { backgroundColor: '#A5E9B9' }]} onPress={async () => {
             if (!duaData.video && currentStep < (duaData.steps?.length - 1)) {
               setCurrentStep(p => p + 1);
             } else {
               // Teacher now sees the exact same success alert as the parent
               await updateProgress('finish', duaData);
               Alert.alert("MashAllah!", "Lesson Completed! ✨");
               router.back();
             }
          }}><Text style={styles.navText}>{(!duaData.video && currentStep < (duaData.steps?.length - 1)) ? "Next" : "Finish"}</Text></TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 15, marginBottom: 15 },
  backCircle: { backgroundColor: '#A2D2FF', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  titleBadge: { backgroundColor: '#D4E9FF', flex: 1, marginLeft: 15, paddingVertical: 12, borderRadius: 30, alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#5A9BD5' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  card: { backgroundColor: '#FFF', width: '100%', borderRadius: 40, padding: 20, alignItems: 'center', elevation: 8 },
  dotRow: { flexDirection: 'row', marginBottom: 15 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D4E9FF', marginHorizontal: 4 },
  activeDot: { backgroundColor: '#A2D2FF', width: 20 },
  imageBox: { backgroundColor: '#F9F9F9', width: '100%', height: 160, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  stepImage: { width: '80%', height: '80%' },
  arabicText: { fontSize: 34, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  translationBox: { backgroundColor: '#F0F8FF', padding: 12, borderRadius: 20, marginVertical: 10, width: '100%' },
  translationText: { fontSize: 18, color: '#5A9BD5', textAlign: 'center', fontWeight: '600' },
  audioBtn: { backgroundColor: '#A2D2FF', flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25, alignItems: 'center', marginTop: 10, elevation: 3 },
  audioBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 25 },
  navBtn: { width: width * 0.4, paddingVertical: 18, borderRadius: 25, alignItems: 'center', elevation: 5 },
  navText: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  mainContent: { width: '100%', alignItems: 'center' },
  videoWrapper: { width: '100%', backgroundColor: '#FFF', borderRadius: 25, padding: 5, elevation: 8, overflow: 'hidden' },
  videoName: { fontSize: 26, fontWeight: 'bold', color: '#444', marginTop: 20, textAlign: 'center' },
  errorText: { fontSize: 18, color: '#5A9BD5', marginVertical: 10, fontWeight: 'bold' },
  backBtn: { backgroundColor: '#A2D2FF', padding: 12, borderRadius: 15, width: 100, alignItems: 'center' }
});