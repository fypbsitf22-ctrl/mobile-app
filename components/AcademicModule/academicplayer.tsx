import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, collection, doc, getDoc, getDocs, increment, orderBy, query, updateDoc, where } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, GestureResponderEvent, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Path, Svg, SvgUri } from 'react-native-svg';
import { auth, db } from '../../firebaseConfig';
import MainHeaderShared from '../MainHeaderShared';

const { width, height } = Dimensions.get('window');

interface PlayerProps {
  role: 'parent' | 'teacher';
}

export default function AcademicPlayer({ role }: PlayerProps) {
  const router = useRouter();
  const { lessonId, grade, subject, type } = useLocalSearchParams();
  
  const [lessons, setLessons] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // --- WRITING LOGIC ---
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  
  const totalTraceLength = paths.reduce((acc, p) => acc + p.length, 0);
  const REQUIRED_LENGTH = 800; 
  const tracingProgress = Math.min(Math.round((totalTraceLength / REQUIRED_LENGTH) * 100), 100);
  const hasTraced = tracingProgress >= 100;

  const [showReward, setShowReward] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [voiceUrls, setVoiceUrls] = useState<any>(null);

  const [elapsedTime, setElapsedTime] = useState(0);

  const starScale = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let interval: any;
    if (!loading && !showReward) {
      interval = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [loading, showReward]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const configSnap = await getDoc(doc(db, "app_config", "academic_sounds"));
        if (configSnap.exists()) setVoiceUrls(configSnap.data());

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
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [lessonId, grade, subject, type]);

  async function playSound(url: string | undefined) {
    if (!url) return;
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      soundRef.current = sound;
    } catch (e) { console.log("Audio Error", e); }
  }

  useEffect(() => {
    if (!loading && voiceUrls) {
      const audioUrl = type === 'Reading' ? voiceUrls.instruction5_url : voiceUrls.instruction_writing_url;
      if (audioUrl) playSound(audioUrl);
    }
    setAudioPlayed(false);
    setPaths([]); 
  }, [loading, currentIndex, voiceUrls]);

  const handleNext = async () => {
    // UPDATED: Now plays warning2_url for Writing type
    if (type === 'Writing' && !hasTraced) {
      setShowWarningModal(true);
      if (voiceUrls?.warning2_url) playSound(voiceUrls.warning2_url);
      return;
    }

    if (type === 'Reading' && !audioPlayed) {
      setShowWarningModal(true);
      if (voiceUrls?.warning1_url) playSound(voiceUrls.warning1_url);
      return;
    }

    if (role === 'parent' && lessons[currentIndex]) {
      const user = auth.currentUser;
      if (user) {
        try {
          await updateDoc(doc(db, "users", user.uid), { 
            stars: increment(1), 
            completedLessons: arrayUnion(
              type === 'Writing'
                ? {
                    id: lessons[currentIndex].id,
                    type: "Writing",
                    traced: true,
                    strokes: paths.length
                  }
                : lessons[currentIndex].id
            )
          });
        } catch (e) {
          console.error("Update Error:", e);
        }
      }
    }

    setShowReward(true);
    if (voiceUrls?.success1_url) playSound(voiceUrls.success1_url);
    starScale.setValue(0);
    Animated.spring(starScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

    setTimeout(() => {
      setShowReward(false);
      if (currentIndex < lessons.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        router.back();
      }
    }, 5500); 
  };

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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#C4A6FB" /></View>;
  const currentLesson = lessons[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderShared role={role} />

      <View style={styles.titleRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={30} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCard}>
          <Text style={styles.headerText} numberOfLines={1}>{currentLesson?.title}</Text>
        </View>
      </View>

      <View style={styles.playerContent}>
        {type === 'Reading' ? (
          <View style={styles.readingContainer}>
            <View style={styles.topSection}>
                <View style={styles.instructionRow}>
                    <Text style={styles.topInstruction}>Tap the speaker and listen 👇</Text>
                    <TouchableOpacity style={styles.speakerBtn} onPress={() => {
                        playSound(voiceUrls?.instruction5_url);
                    }}>
                        <Ionicons name="volume-high" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <View style={styles.imageWhiteCard}>
                    <Image source={{ uri: currentLesson?.image }} style={styles.mainImage} resizeMode="contain" />
                </View>
            </View>
            <View style={styles.middleSection}>
                <TouchableOpacity activeOpacity={0.7} style={styles.infoBox}
                    onPress={async () => {
                        if (currentLesson?.audio) {
                            await playSound(currentLesson.audio);
                            setAudioPlayed(true);
                        }
                    }}>
                    <Text style={styles.nameText} numberOfLines={1}>{currentLesson?.title}</Text>
                    <View style={styles.audioBtn}><Ionicons name="volume-medium" size={45} color="#7E57C2" /></View>
                </TouchableOpacity>
                <View style={[styles.statusIndicator, { backgroundColor: audioPlayed ? '#E8F5E9' : '#F5F5F5' }]}>
                    <Ionicons name={audioPlayed ? "checkmark-circle" : "play-circle"} size={28} color={audioPlayed ? "#4CAF50" : "#555"} />
                    <View style={{ marginLeft: 14 }}>
                        <Text style={styles.timerText}>Learning Time: {formatTime(elapsedTime)}</Text>
                    </View>
                </View>
            </View>
          </View>
        ) : (
          <View style={styles.writingContainer}>
             <View style={styles.instructionRow}>
                <Text style={styles.topInstruction}>Trace the picture with your finger ✏️👇</Text>
                <TouchableOpacity style={styles.speakerBtn} onPress={() => {
                    playSound(voiceUrls?.instruction_writing_url);
                    setAudioPlayed(true); 
                }}>
                    <Ionicons name="volume-high" size={24} color="#FFF" />
                </TouchableOpacity>
             </View>

            <View
              style={styles.canvas}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {currentLesson?.image && (
                <SvgUri
                  uri={currentLesson.image} 
                  style={StyleSheet.absoluteFill}
                  width="100%"
                  height="100%"
                />
              )}

              <Svg style={StyleSheet.absoluteFill}>
                {paths.map((p, i) => (
                  <Path
                    key={i}
                    d={p}
                    stroke="#66BB6A"
                    strokeWidth={6} 
                    fill="none"
                    strokeLinecap="round"
                  />
                ))}
                <Path
                  d={currentPath}
                  stroke="#66BB6A"
                  strokeWidth={6} 
                  fill="none"
                  strokeLinecap="round"
                />
              </Svg>

              <View style={styles.progressOverlay}>
                  <Text style={styles.progressText}>Tracing Progress: {tracingProgress}%</Text>
              </View>
            </View>

             <View style={[styles.statusIndicator, { backgroundColor: hasTraced ? '#E8F5E9' : '#F5F5F5', alignSelf: 'center', width: 'auto' }]}>
                <Ionicons name={hasTraced ? "checkmark-circle" : "play-circle"} size={22} color={hasTraced ? "#4CAF50" : "#555"} />
                <View style={{ marginLeft: 10 }}>
                    <Text style={styles.timerText}>Tracing Time: {formatTime(elapsedTime)}</Text>
                </View>
            </View>

             <TouchableOpacity style={styles.cuteClearBtn} onPress={() => setPaths([])}>
                <Ionicons name="refresh-circle" size={30} color="#FFF" />
                <Text style={styles.cuteClearText}>Start Over</Text>
             </TouchableOpacity>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.btn, styles.backBtnColor]} onPress={() => currentIndex > 0 ? setCurrentIndex(p => p - 1) : router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
            <Text style={styles.btnLabel}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.btn, 
              (type === 'Writing' ? hasTraced : audioPlayed) 
                ? styles.nextBtnColor 
                : styles.disabledBtnColor
            ]}
            onPress={handleNext}
          >
            <Text style={styles.btnLabel}>{currentIndex === lessons.length - 1 ? 'Finish' : 'Next'}</Text>
            <Ionicons name="arrow-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showReward} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.rewardBox, { transform: [{ scale: starScale }] }]}>
            <LottieView source={{ uri: voiceUrls?.success_lottie_url }} autoPlay loop style={{ width: 220, height: 220 }} />
            <Text style={styles.wellDoneText} numberOfLines={1} adjustsFontSizeToFit>CONGRATULATIONS! 🎉</Text>
            <Text style={styles.rewardSubText}>You finished the lesson{"\n"}and earned a star!</Text>
          </Animated.View>
        </View>
      </Modal>

     <Modal visible={showWarningModal} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.warningBox}>
      <Ionicons name="alert-circle" size={70} color="#FF9800" />
      <Text style={styles.warningTitle}>Almost There! 👋</Text>
      <Text style={styles.warningText}>
        {type === 'Writing' 
          ? "Almost there! Trace the picture more so you can continue." 
          : "We need to listen to the audio first. Finish listening then press next."}
      </Text>
      
      <TouchableOpacity style={styles.warningBtn} onPress={() => setShowWarningModal(false)}>
        <Text style={styles.warningBtnText}>
          {/* Conditional logic for the button text */}
          {type === 'Writing' ? "I'll keep tracing! ✏️" : "I'll Listen! 🔊"}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
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
  playerContent: { flex: 1, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'space-between' },
  readingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  writingContainer: { flex: 1, marginVertical: 2 },
  canvas: { flex: 1, backgroundColor: '#FFF', borderRadius: 40, overflow: 'hidden', elevation: 5, borderWidth: 2, borderColor: '#EEE' },
  progressOverlay: { position: 'absolute', top: 15, right: 20, backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  progressText: { fontSize: 14, fontWeight: 'bold', color: '#66BB6A' },
  cuteClearBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 15, backgroundColor: '#FF8B8B', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 30, elevation: 4, borderBottomWidth: 4, borderBottomColor: '#E57373' },
  cuteClearText: { color: '#FFF', fontWeight: '900', fontSize: 20, marginLeft: 8 },
  topSection: { width: '100%', alignItems: 'center' },
  instructionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  topInstruction: { fontSize: 18, fontWeight: '800', color: '#5E35B1', marginRight: 10, textAlign: 'center' },
  speakerBtn: { backgroundColor: '#C4A6FB', padding: 8, borderRadius: 15 },
  imageWhiteCard: { backgroundColor: '#FFF', width: width * 0.85, height: height * 0.30, borderRadius: 40, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  mainImage: { width: '80%', height: '80%' },
  middleSection: { width: '100%', alignItems: 'center', marginTop: 30 },
  infoBox: { backgroundColor: '#FCE4EC', flexDirection: 'row', width: '95%', padding: 15, borderRadius: 25, alignItems: 'center', justifyContent: 'space-between', elevation: 4 },
  nameText: { fontSize: 24, fontWeight: 'bold', color: '#E87D88', flex: 1 },
  audioBtn: { backgroundColor: '#FFF', padding: 6, borderRadius: 20 },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 15, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  timerText: { fontSize: 12, color: '#999', fontWeight: '600', marginTop: 1 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  btn: { flexDirection: 'row', paddingVertical: 20, borderRadius: 35, width: '47%', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  btnLabel: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginHorizontal: 10 },
  backBtnColor: { backgroundColor: '#FFC26D' },
  nextBtnColor: { backgroundColor: '#66BB6A' },
  disabledBtnColor: { backgroundColor: '#BDBDBD' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  rewardBox: { backgroundColor: '#FFF', padding: 30, borderRadius: 50, alignItems: 'center', width: '90%' },
  wellDoneText: { fontSize: 26, fontWeight: '900', color: '#4CAF50', textAlign: 'center' },
  rewardSubText: { fontSize: 18, color: '#555', fontWeight: '700', marginTop: 10, textAlign: 'center' },
  warningBox: { width: '85%', backgroundColor: '#FFF', padding: 30, borderRadius: 45, alignItems: 'center' },
  warningTitle: { fontSize: 26, fontWeight: '900', color: '#FF9800', marginBottom: 10 },
  warningText: { fontSize: 17, color: '#555', textAlign: 'center', fontWeight: '600', marginBottom: 25, lineHeight: 24 },
  warningBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25 },
  warningBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
});