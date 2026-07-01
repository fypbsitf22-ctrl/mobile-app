import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, collection, doc, getDoc, increment, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import { auth, db } from '../../firebaseConfig';
import MainHeader from '../MainHeaderShared';

const { width } = Dimensions.get('window');

export default function RoutineVideoModule({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { catId, title, catIndex, videoIndex } = params;

  // -------------------- STATE & REFS --------------------
  const [items, setItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoFinished, setVideoFinished] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [appConfig, setAppConfig] = useState<{ warning: string, success: string, lottie: string, instruction: string, goodjob_next: string } | null>(null);

  const starScale = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null); 

  const currentItem = items[currentIndex];
  const isLastVideo = currentIndex === items.length - 1;

  // -------------------- TIMER --------------------
  useEffect(() => {
    let interval: any;
    if (isTimerActive && !videoFinished) {
      interval = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTimerActive, videoFinished]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // -------------------- FIRESTORE FETCH --------------------
  useEffect(() => {
    const q = query(collection(db, "routine_categories"), orderBy("uploaded", "desc"));
    const unsubCats = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const fetchConfigs = async () => {
      try {
        const docRef = doc(db, "app_config", "dailyroutine_sounds");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAppConfig({
            warning: docSnap.data().warning_url,
            success: docSnap.data().success_url,
            lottie: docSnap.data().success_lottie_url,
            instruction: docSnap.data().instruction_url,
            goodjob_next: docSnap.data().goodjob_next_url
          });
        }
      } catch (e) { console.log("Config fetch error:", e); }
    };

    fetchConfigs();
    return () => {
        unsubCats();
        if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (!catId) return;
    const q = query(
      collection(db, 'routine_items'),
      where('categoryID', '==', (catId as string).trim()),
      orderBy('uploaded', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(fetchedItems);
      setLoading(false);
    });
  }, [catId]);

  // -------------------- SOUND LOGIC --------------------
  async function playSound(url: string | undefined) {
    if (!url) return;
    try { 
        if (soundRef.current) {
            await soundRef.current.unloadAsync();
        }
        const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
        soundRef.current = sound;
    } catch (e) { console.log("Sound error:", e); }
  }

  useEffect(() => {
    if (!loading && appConfig?.instruction) {
        playSound(appConfig.instruction);
    }
  }, [loading, currentIndex, appConfig]);

  useEffect(() => {
    if (videoFinished && appConfig?.goodjob_next) playSound(appConfig.goodjob_next);
  }, [videoFinished]);

  // -------------------- VIDEO PLAYER --------------------
  const getYoutubeId = (url: string): string => {
    if (!url) return "";
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?v=)|(\&v=))([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[8].length === 11) ? match[8] : url;
  };

  useEffect(() => { 
    setVideoFinished(false); 
    setElapsedTime(0); 
    setIsTimerActive(false);
  }, [currentIndex]);

  const onStateChange = useCallback((state: string) => {
    if (state === 'playing') setIsTimerActive(true);
    if (state === 'paused' || state === 'ended') setIsTimerActive(false);
    if (state === 'ended') setVideoFinished(true);
  }, []);

  // -------------------- NAVIGATION --------------------
  const handleBottomBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      return;
    }
    const prevCatIndex = Number(catIndex) - 1;
    if (prevCatIndex >= 0) {
      const prevCategory = categories[prevCatIndex];
      router.replace({
        pathname: `/${role}/dailyroutine/routinevideo`,
        params: { catId: prevCategory.id, title: prevCategory.name, catIndex: prevCatIndex, videoIndex: '0' }
      });
    } else {
      router.back();
    }
  };

  const handleProcessNext = async () => {
    if (!videoFinished) {
      setShowWarningModal(true);
      playSound(appConfig?.warning);
      return;
    }
    if (role === 'parent' && currentItem) {
      try {
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        await updateDoc(userRef, { completedLessons: arrayUnion(currentItem.id), stars: increment(1) });
      } catch (e) { console.log("Firebase Error:", e); }
    }
    setShowRewardModal(true);
    playSound(appConfig?.success);
    starScale.setValue(0);
    Animated.spring(starScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    if (!isLastVideo) {
      setCurrentIndex(currentIndex + 1);
      setTimeout(() => setShowRewardModal(false), 5500);
    } else {
      setTimeout(() => {
        setShowRewardModal(false);
        const nextCatIdx = Number(catIndex) + 1;
        const nextCategory = categories[nextCatIdx];
        if (nextCategory) {
          router.replace({
            pathname: `/${role}/dailyroutine/routinevideo`,
            params: { catId: nextCategory.id, title: nextCategory.name, catIndex: nextCatIdx, videoIndex: '0' }
          });
        } else router.back();
      }, 5500);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#66BB6A" /></View>;
  if (items.length === 0) return <View style={styles.center}><Text>No videos found</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader role={role} />

      {/* REWARD MODAL */}
      <Modal visible={showRewardModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.rewardBox, { transform: [{ scale: starScale }] }]}>
            {appConfig?.lottie ? 
              <LottieView source={{ uri: appConfig.lottie }} autoPlay loop style={{ width: 220, height: 220 }} /> :
              <Ionicons name="star" size={120} color="#FFD700" />}
            <Text style={styles.wellDoneText} numberOfLines={1} adjustsFontSizeToFit>CONGRATULATIONS! 🎉</Text>
            <Text style={styles.rewardSubText}>You watched the lesson{"\n"}and earned a star!</Text>
          </Animated.View>
        </View>
      </Modal>

      {/* WARNING MODAL */}
      <Modal visible={showWarningModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.warningBox}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFF0D1' }]}>
              <Ionicons name="eye" size={70} color="#FF9800" />
            </View>
            <Text style={styles.warningTitle}>Almost There! 👋</Text>
            <Text style={styles.warningText}>
              We need to <Text style={{ fontWeight: '900', color: '#FF9800' }}>watch the whole video</Text> first.{"\n"}
              Finish the video then press next.
            </Text>
            <TouchableOpacity style={styles.warningBtn} onPress={() => setShowWarningModal(false)}>
              <Text style={styles.warningBtnText}>I'll Watch! 👍</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.headerArea}>
        <View style={styles.topHeaderRow}>
          <TouchableOpacity style={styles.exitCircle} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titlePill}><Text style={styles.categoryTitle}>{title}</Text></View>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.videoCard}>
          {/* Instruction Row Aligned */}
          <View style={styles.instructionRow}>
              <Text style={styles.instructionText}>Tap the video to watch the lesson 👇</Text>
              <TouchableOpacity 
                style={styles.speakerBtn} 
                onPress={() => playSound(appConfig?.instruction)}
              >
                <Ionicons name="volume-high" size={24} color="#FFF" />
              </TouchableOpacity>
          </View>

          <View style={styles.videoWrapper}>
            <YoutubePlayer 
              key={currentItem?.id} 
              height={(width - 40) * 0.5625} 
              play={true} 
              videoId={getYoutubeId(currentItem?.video)} 
              onChangeState={onStateChange} 
              initialPlayerParams={{ rel: false, modestbranding: 1 }}
            />
          </View>

          <View style={[styles.statusIndicator, { backgroundColor: videoFinished ? '#F0F9F0' : '#F5F5F5' }]}>
            <Ionicons name={videoFinished ? "checkmark-circle" : "play-circle"} size={30} color={videoFinished ? "#4CAF50" : "#888"} />
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.statusText, { color: videoFinished ? "#4CAF50" : "#888" }]}>
                {videoFinished ? "Good job! Press Next" : "Finish the video first"}
              </Text>
             <Text style={styles.timerText}>Learning Time: {formatTime(elapsedTime)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.btn, styles.backBtnColor]} onPress={handleBottomBack}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
          <Text style={styles.btnLabel}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, videoFinished ? styles.nextBtnColor : styles.disabledBtnColor]} onPress={handleProcessNext}>
          <Text style={styles.btnLabel}>{isLastVideo ? 'Next' : 'Next'}</Text>
          <Ionicons name="arrow-forward" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerArea: { alignItems: 'center', marginTop: 15, paddingHorizontal: 20 },
  topHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 5 },
  exitCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#66BB6A', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  titlePill: { backgroundColor: '#E8F5E9', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 40, elevation: 2, flexShrink: 1, marginHorizontal: 10 },
  categoryTitle: { fontSize: 22, fontWeight: '900', color: '#66BB6A', textAlign: 'center' },
  
  // CORRECTED ALIGNMENT STYLES
  instructionRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 20, 
    width: '100%',
    paddingHorizontal: 10
  },
  instructionText: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#333', 
    marginRight: 10,
    flexShrink: 1, // Ensures text doesn't push button out
    textAlign: 'center'
  },
  speakerBtn: { 
    backgroundColor: '#66BB6A', 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 3 
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  rewardBox: { backgroundColor: '#FFF', padding: 30, borderRadius: 50, alignItems: 'center', elevation: 20, width: '90%', borderWidth: 10, borderColor: '#E8F5E9' },
  wellDoneText: { fontSize: 30, fontWeight: '900', color: '#4CAF50', textAlign: 'center', marginTop: -10, width: '100%' },
  rewardSubText: { fontSize: 20, color: '#555', fontWeight: '700', marginTop: 10, textAlign: 'center', lineHeight: 28 },
  warningBox: { width: '85%', backgroundColor: '#FFF', padding: 30, borderRadius: 45, alignItems: 'center' },
  iconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  warningTitle: { fontSize: 28, fontWeight: '900', color: '#FF9800', marginBottom: 10 },
  warningText: { fontSize: 19, color: '#555', textAlign: 'center', fontWeight: '600', marginBottom: 25, lineHeight: 26 },
  warningBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 50, paddingVertical: 18, borderRadius: 30 },
  warningBtnText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  mainContent: { padding: 20, flex: 1, justifyContent: 'flex-start', marginTop: 10 },
  videoCard: { backgroundColor: '#FFF', borderRadius: 30, padding: 20, elevation: 5, alignItems: 'center' },
  videoWrapper: { width: '100%', borderRadius: 20, overflow: 'hidden', backgroundColor: '#000' },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25 },
  statusText: { fontSize: 18, fontWeight: '800' },
  timerText: { fontSize: 12, color: '#E0E0E0', fontWeight: '600', marginTop: 2 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 40 },
  btn: { flexDirection: 'row', paddingVertical: 20, borderRadius: 35, width: '47%', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  btnLabel: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginHorizontal: 10 },
  backBtnColor: { backgroundColor: '#FFC26D' },
  nextBtnColor: { backgroundColor: '#66BB6A' },
  disabledBtnColor: { backgroundColor: '#BDBDBD' }
});