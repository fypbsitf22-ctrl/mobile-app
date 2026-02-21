import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, collection, doc, getDocs, increment, orderBy, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, GestureResponderEvent, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { auth, db } from '../../firebaseConfig';
import MainHeaderShared from '../MainHeaderShared';

interface PlayerProps {
  role: 'parent' | 'teacher';
}

export default function AcademicPlayer({ role }: PlayerProps) {
  const router = useRouter();
  const { lessonId, type, grade, subject } = useLocalSearchParams();
  const [lessons, setLessons] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [showReward, setShowReward] = useState(false);
  const [seconds, setSeconds] = useState(0); // Timer State
  const starScale = useRef(new Animated.Value(0)).current;

  // 1. Progress Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(
          collection(db, "academic_lessons", `${grade}_section`, subject as string), 
          where("type", "==", type), 
          orderBy("order", "asc")
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setLessons(data);
        const idx = data.findIndex(l => l.id === lessonId);
        setCurrentIndex(idx !== -1 ? idx : 0);
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [lessonId, type, grade, subject]);

  const handleTouchStart = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    setCurrentPath(`M${locationX},${locationY}`);
  };

  const handleTouchMove = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    setCurrentPath((prev) => `${prev} L${locationX},${locationY}`);
  };

  const handleTouchEnd = () => {
    if (currentPath) {
      setPaths((prev) => [...prev, currentPath]);
      setCurrentPath('');
    }
  };

  const handleFinish = async () => {
    if (role === 'parent') {
      const user = auth.currentUser;
      if (user && lessons[currentIndex]) {
        try {
          await updateDoc(doc(db, "users", user.uid), { 
              stars: increment(1), 
              completedLessons: arrayUnion(lessons[currentIndex].id) 
          });
        } catch (e) { console.log("Firebase error", e); }
      }
    }
    setShowReward(true);
    Animated.spring(starScale, { toValue: 1, useNativeDriver: true }).start();
    setTimeout(() => { 
        setShowReward(false); 
        router.back(); 
    }, 2000);
  };

  // 2. Next Lesson Logic
  const handleNext = () => {
    if (currentIndex < lessons.length - 1) {
      setPaths([]); // Clear tracing for next lesson
      setCurrentIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  // 3. Back Logic
  const handleBackToList = () => {
    router.push({
        pathname: (role === 'parent' ? '/parent/academic/contentlist' : '/teacher/academic/contentlist') as any,
        params: { grade, subject, type }
    });
  };

  const playLessonAudio = () => {
    console.log("Playing audio for:", lessons[currentIndex]?.title);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#A2D2FF" /></View>;
  const currentLesson = lessons[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={showReward} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.rewardBox, {transform: [{scale: starScale}]}]}>
            <Ionicons name="star" size={100} color="#FFD700" />
            <Text style={styles.wellDoneText}>SHABAASH!</Text>
            <Text style={styles.rewardSubText}>You did a great job!</Text>
          </Animated.View>
        </View>
      </Modal>

      <MainHeaderShared role={role} />

      {/* Progress Timer Bar */}
      <View style={styles.timerBar}>
        <Ionicons name="time" size={20} color="#5A9BD5" />
        <Text style={styles.timerText}>Time: {formatTime(seconds)}</Text>
        <View style={styles.progressCounter}>
            <Text style={styles.progressText}>{currentIndex + 1} / {lessons.length}</Text>
        </View>
      </View>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToList} style={styles.iconBtn}>
          <Ionicons name="arrow-back-circle" size={45} color="#FF8B8B" />
        </TouchableOpacity>

        <Text style={styles.title}>{currentLesson?.title}</Text>

        <TouchableOpacity onPress={playLessonAudio} style={[styles.iconBtn, styles.speakerBg]}>
          <Ionicons name="volume-high" size={30} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.playerContainer}>
        {type === 'Reading' ? (
          <View style={styles.readingCard}>
            <Image source={{ uri: currentLesson?.image }} style={styles.mainImage} resizeMode="contain" />
            <Text style={styles.lessonTitleText}>{currentLesson?.title}</Text>
          </View>
        ) : (
          <View style={styles.writingCard}>
             <View 
                style={styles.canvas} 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove} 
                onTouchEnd={handleTouchEnd}
              >
                <Image 
                  source={{ uri: currentLesson?.image }} 
                  style={[StyleSheet.absoluteFill, { opacity: 0.15 }]} 
                  resizeMode="contain" 
                />
                <Svg style={StyleSheet.absoluteFill}>
                  {paths.map((p, i) => (
                    <Path key={i} d={p} stroke="#66BB6A" strokeWidth={12} fill="none" strokeLinecap="round" />
                  ))}
                  <Path d={currentPath} stroke="#66BB6A" strokeWidth={12} fill="none" strokeLinecap="round" />
                </Svg>
             </View>
             <TouchableOpacity style={styles.clearBtn} onPress={() => setPaths([])}>
                <Ionicons name="refresh-circle" size={35} color="#FF8B8B" />
                <Text style={styles.clearText}>Start Over</Text>
             </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.navBtn} onPress={handleNext}>
          <Text style={styles.navText}>
            {currentIndex === lessons.length - 1 ? (role === 'parent' ? 'FINISH' : 'EXIT') : 'NEXT'}
          </Text>
          <Ionicons name="chevron-forward-circle" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  rewardBox: { backgroundColor: '#FFF', padding: 40, borderRadius: 40, alignItems: 'center', elevation: 10 },
  wellDoneText: { fontSize: 36, fontWeight: '900', color: '#66BB6A', marginTop: 10 },
  rewardSubText: { fontSize: 18, color: '#888', fontWeight: '600' },
  timerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  timerText: { fontSize: 16, fontWeight: 'bold', color: '#5A9BD5', marginLeft: 5 },
  progressCounter: { marginLeft: 20, backgroundColor: '#D4E9FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15 },
  progressText: { fontWeight: 'bold', color: '#5A9BD5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginVertical: 10 },
  iconBtn: { elevation: 3 },
  speakerBg: { backgroundColor: '#FFD93D', padding: 8, borderRadius: 25 },
  title: { fontSize: 24, fontWeight: '900', color: '#444', flex: 1, textAlign: 'center' },
  playerContainer: { flex: 1, paddingHorizontal: 20 },
  readingCard: { backgroundColor: '#FFF', borderRadius: 40, padding: 20, alignItems: 'center', flex: 0.9, justifyContent: 'center', elevation: 5, borderWidth: 2, borderColor: '#EEE' },
  mainImage: { width: '85%', height: '65%' },
  lessonTitleText: { fontSize: 32, fontWeight: '900', color: '#444', marginTop: 20 },
  writingCard: { flex: 1 },
  canvas: { flex: 1, backgroundColor: '#FFF', borderRadius: 40, overflow: 'hidden', elevation: 5, position: 'relative', borderWidth: 2, borderColor: '#EEE' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginTop: 15, backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 25, elevation: 2 },
  clearText: { color: '#FF8B8B', fontWeight: '900', fontSize: 18, marginLeft: 5 },
  footer: { padding: 20 },
  navBtn: { backgroundColor: '#66BB6A', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 20, borderRadius: 30, elevation: 8, borderBottomWidth: 5, borderBottomColor: '#4CAF50' },
  navText: { color: '#FFF', fontSize: 24, fontWeight: '900', marginRight: 10 }
});