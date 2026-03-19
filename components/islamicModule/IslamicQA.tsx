import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, collection, doc, getDoc, getDocs, increment, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import MainHeaderShared from '../MainHeaderShared';
const { width } = Dimensions.get('window');

export default function IslamicQA({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const { itemId, catId } = useLocalSearchParams(); 
  
  const [allItems, setAllItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [qListened, setQListened] = useState(false);
  const [aListened, setAListened] = useState(false);
  
  const [appConfig, setAppConfig] = useState<any>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  
  const starScale = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // -------------------- TIMER --------------------
  useEffect(() => {
    let interval: any;
    if (!loading && !showRewardModal) {
      interval = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [loading, showRewardModal]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // -------------------- DATA FETCHING --------------------
  useEffect(() => {
    const fetchConfig = async () => {
        const configSnap = await getDoc(doc(db, "app_config", "islamic_sounds"));
        if (configSnap.exists()) {
          setAppConfig({
            warning: configSnap.data().warning2_url,
            success: configSnap.data().success2_url,
            instruction: configSnap.data().instruction2_url,
            lottie: configSnap.data().success_lottie_url,
          });
        }
    };
    fetchConfig();

    if (!catId) return;

    // Fetch all documents where categoryID matches (Each doc is a single question)
    const q = query(
        collection(db, "islamic_items"), 
        where("categoryID", "==", catId), 
        orderBy("uploaded", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllItems(fetched);

        // Find which index we should start at based on itemId
        if (itemId) {
            const startIdx = fetched.findIndex(item => item.id === itemId);
            if (startIdx !== -1) setCurrentIndex(startIdx);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [catId]);

  // -------------------- SOUND HELPERS --------------------
  async function playSound(url: string | undefined) {
    if (!url || url === "null" || url === "") return;
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      soundRef.current = sound;
    } catch (e) { console.log("Audio Error:", e); }
  }

  useEffect(() => {
    if (!loading && appConfig?.instruction) playSound(appConfig.instruction);
  }, [loading, currentIndex, appConfig]);

  useEffect(() => {
    setQListened(false);
    setAListened(false);
  }, [currentIndex]);

  const bothListened = qListened && aListened;
  const currentQuestion = allItems[currentIndex];

  // -------------------- NAVIGATION LOGIC --------------------
  const handleNext = async () => {
    if (!currentQuestion) return;

    if (!bothListened) {
      setShowWarningModal(true);
      playSound(appConfig?.warning);
      return;
    }

    // Award star for this specific question/document
    if (role === 'parent' && auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
          completedLessons: arrayUnion(currentQuestion.id),
          stars: increment(1),
        });
    }

    setShowRewardModal(true);
    playSound(appConfig?.success);
    starScale.setValue(0);
    Animated.spring(starScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

    setTimeout(async () => {
  setShowRewardModal(false);

  if (currentIndex < allItems.length - 1) {
    setCurrentIndex(prev => prev + 1);
  } else {
    try {
      const currentCatId = catId as string;

      const currentSubDoc = await getDoc(doc(db, "islamic_subcategories", currentCatId));
      if (!currentSubDoc.exists()) {
        router.back();
        return;
      }

      const parentCategoryID = currentSubDoc.data().categoryID;

      const subQuery = query(
        collection(db, "islamic_subcategories"),
        where("categoryID", "==", parentCategoryID),
        orderBy("uploaded", "asc")
      );

      const subSnap = await getDocs(subQuery);

      const subList = subSnap.docs.map(d => ({
        id: d.id,
        ...(d.data() as { name: string; categoryID: string })
      }));

      const currentSubIndex = subList.findIndex(s => s.id === currentCatId);

      if (currentSubIndex !== -1 && currentSubIndex < subList.length - 1) {
        const nextSub = subList[currentSubIndex + 1];

        const q = query(
          collection(db, "islamic_items"),
          where("categoryID", "==", nextSub.id),
          orderBy("uploaded", "asc")
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          const firstDoc = snap.docs[0];
          const lessonData = firstDoc.data();

          const basePath = role === 'parent' ? '/parent/islamic' : '/teacher/islamic';

          if (lessonData.type === "video" || lessonData.video) {
            router.replace({
              pathname: `${basePath}/islamicvideo` as any,
              params: { itemId: firstDoc.id, title: nextSub.name }
            });
          } else if (lessonData.type === "qa") {
            router.replace({
              pathname: `${basePath}/islamicqa` as any,
              params: {
                itemId: firstDoc.id,
                catId: nextSub.id,
                title: nextSub.name
              }
            });
          } else {
            router.replace({
              pathname: `${basePath}/islamicsteps` as any,
              params: {
                itemId: firstDoc.id,
                title: nextSub.name
              }
            });
          }

          return;
        }
      }

      router.back();

    } catch (e) {
      console.log("Next Lesson Error:", e);
      router.back();
    }
  }
}, 5500);
  }

  const handleBack = async () => {
  // If inside current lesson → go to previous question
  if (currentIndex > 0) {
    setCurrentIndex(currentIndex - 1);
    return;
  }

  // ✅ FIRST QUESTION → GO TO PREVIOUS LESSON
  try {
    const currentCatId = catId as string;

    // 1. Get current subcategory
    const currentSubDoc = await getDoc(doc(db, "islamic_subcategories", currentCatId));
    if (!currentSubDoc.exists()) {
      router.back();
      return;
    }

    const parentCategoryID = currentSubDoc.data().categoryID;

    // 2. Get all subcategories of same parent
    const subQuery = query(
      collection(db, "islamic_subcategories"),
      where("categoryID", "==", parentCategoryID),
      orderBy("uploaded", "asc")
    );

    const subSnap = await getDocs(subQuery);

    const subList = subSnap.docs.map(d => ({
      id: d.id,
      ...(d.data() as { name: string; categoryID: string })
    }));

    // 3. Find current index
    const currentSubIndex = subList.findIndex(s => s.id === currentCatId);

    // 4. If previous lesson exists → go to it
    if (currentSubIndex > 0) {
      const prevSub = subList[currentSubIndex - 1];

      // Fetch last question of previous lesson
      const q = query(
        collection(db, "islamic_items"),
        where("categoryID", "==", prevSub.id),
        orderBy("uploaded", "asc")
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const lastDoc = snap.docs[snap.docs.length - 1]; // 👈 last question
        const lessonData = lastDoc.data();

        const basePath = role === 'parent' ? '/parent/islamic' : '/teacher/islamic';

        if (lessonData.type === "video" || lessonData.video) {
          router.replace({
            pathname: `${basePath}/islamicvideo` as any,
            params: { itemId: lastDoc.id, title: prevSub.name }
          });
        } else if (lessonData.type === "qa") {
          router.replace({
            pathname: `${basePath}/islamicqa` as any,
            params: {
              itemId: lastDoc.id,
              catId: prevSub.id,
              title: prevSub.name
            }
          });
        } else {
          router.replace({
            pathname: `${basePath}/islamicsteps` as any,
            params: {
              itemId: lastDoc.id,
              title: prevSub.name
            }
          });
        }

        return;
      }
    }

    // 5. If NO previous lesson → go back to subcategory screen
    router.back();

  } catch (e) {
    console.log("Back Navigation Error:", e);
    router.back();
  }
};

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#5A9BD5" /></View>;
  if (!currentQuestion) return <View style={styles.center}><Text>No Questions Found</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderShared role={role} />

      <Modal visible={showRewardModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.rewardBox, { transform: [{ scale: starScale }] }]}>
            {appConfig?.lottie ? 
              <LottieView source={{ uri: appConfig.lottie }} autoPlay loop style={{ width: 220, height: 220 }} /> :
              <Ionicons name="star" size={120} color="#FFD700" />}
            <Text style={styles.wellDoneText}>CONGRATULATIONS! 🎉</Text>
            <Text style={styles.rewardSubText}>You finished the Lesson{"\n"}and earned a star!</Text>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={showWarningModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.warningBox}>
            <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="volume-high" size={70} color="#5A9BD5" />
            </View>
           <Text style={styles.warningTitle}>Almost There! 👋</Text>
           <Text style={styles.warningText}>
               We need to <Text style={{ fontWeight: '900', color: '#5A9BD5' }}>listen to the audio</Text> first.{"\n"}
               Finish listening then press next.
           </Text>
            <TouchableOpacity style={styles.warningBtn} onPress={() => setShowWarningModal(false)}>
              <Text style={styles.warningBtnText}>
                 {currentQuestion?.type === 'Writing' ? "I'll keep tracing! ✏️" : "I'll Listen! 🔊"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}><Ionicons name="arrow-back" size={28} color="#FFF" /></TouchableOpacity>
        <View style={styles.titleBadge}><Text style={styles.headerTitle} numberOfLines={1}>{currentQuestion?.name}</Text></View>
      </View>

      <View style={styles.content}>
        <View style={styles.instructionRow}>
            <Text style={styles.topInstruction}>Tap the speaker and listen 👇</Text>
            <TouchableOpacity style={styles.speakerBtn} onPress={() => playSound(appConfig?.instruction)}>
              <Ionicons name="volume-high" size={24} color="#FFF" />
            </TouchableOpacity>
        </View>

        <View style={styles.learningArea}>
            <View style={styles.questionCard}>
                <View style={styles.labelContainer}><Text style={styles.qLabel}>QUESTION</Text></View>
                <Text style={styles.qText}>{currentQuestion.question}</Text>
                <TouchableOpacity style={styles.audioBtnLarge} onPress={() => { playSound(currentQuestion.qAudio); setQListened(true); }}>
                    <Ionicons name="volume-high" size={32} color="#FFF" />
                    <Text style={styles.audioBtnText}>Listen</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.answerCard}>
                <View style={styles.labelContainer}><Text style={styles.aLabel}>ANSWER</Text></View>
                <Text style={styles.aText}>{currentQuestion.answer}</Text>
                <TouchableOpacity style={styles.audioBtnSmall} onPress={() => { playSound(currentQuestion.aAudio); setAListened(true); }}>
                    <Ionicons name="volume-high" size={24} color="#66BB6A" />
                    <Text style={styles.audioBtnSmallText}>Listen to Answer</Text>
                </TouchableOpacity>

                <View style={[styles.statusIndicator, { backgroundColor: bothListened ? '#E8F5E9' : '#F5F5F5' }]}>
                    <Ionicons name={bothListened ? "checkmark-circle" : "play-circle"} size={28} color={bothListened ? "#4CAF50" : "#555"} />
                    <View style={{ marginLeft: 14 }}>
                        <Text style={styles.timerText}>Learning Time: {formatTime(elapsedTime)}</Text>
                    </View>
                </View>
            </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.btn, styles.backBtnColor]} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
            <Text style={styles.btnLabel}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.btn, bothListened ? styles.nextBtnColor : styles.disabledBtnColor]} onPress={handleNext}>
            <Text style={styles.btnLabel}>{currentIndex === allItems.length - 1 ? 'Next' : 'Finish'}</Text>
            <Ionicons name="arrow-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ... (keep styles exactly as they were)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  backCircle: { backgroundColor: '#5A9BD5', width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  titleBadge: { backgroundColor: '#E1F5FE', flex: 1, marginLeft: 15, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 30, alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#5A9BD5' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingBottom: 30 },
  instructionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 15, width: '100%' },
  topInstruction: { fontSize: 18, fontWeight: '800', color: '#000', marginRight: 10, textAlign: 'center' },
  speakerBtn: { backgroundColor: '#5A9BD5', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  learningArea: { flex: 1, width: '100%' },
  questionCard: { backgroundColor: '#FFF', borderRadius: 25, padding: 20, elevation: 4, alignItems: 'center', borderWidth: 2, borderColor: '#E1F5FE', marginBottom: 15 },
  labelContainer: { backgroundColor: '#F0F8FF', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 10, marginBottom: 10 },
  qLabel: { color: '#5A9BD5', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  qText: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 15 },
  audioBtnLarge: { flexDirection: 'row', backgroundColor: '#5A9BD5', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, alignItems: 'center', elevation: 3 },
  audioBtnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 10, fontSize: 18 },
  answerCard: { backgroundColor: '#F1F8E9', borderRadius: 25, padding: 20, elevation: 4, alignItems: 'center', borderWidth: 2, borderColor: '#C8E6C9', flex: 0.8, justifyContent: 'center' },
  aLabel: { color: '#66BB6A', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  aText: { fontSize: 22, textAlign: 'center', color: '#2E7D32', fontWeight: 'bold' },
  audioBtnSmall: { flexDirection: 'row', alignItems: 'center', marginTop: 15, backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#66BB6A' },
  audioBtnSmallText: { color: '#66BB6A', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  timerText: { fontSize: 12, color: '#999', fontWeight: '600', marginTop: 1 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 15 },
  btn: { flexDirection: 'row', paddingVertical: 18, borderRadius: 30, width: '47%', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  btnLabel: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginHorizontal: 8 },
  backBtnColor: { backgroundColor: '#FFC26D' },
  nextBtnColor: { backgroundColor: '#66BB6A' },
  disabledBtnColor: { backgroundColor: '#BDBDBD' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  rewardBox: { backgroundColor: '#FFF', padding: 30, borderRadius: 50, alignItems: 'center', elevation: 20, width: '90%', borderWidth: 10, borderColor: '#E8F5E9' },
  wellDoneText: { fontSize: 26, fontWeight: '900', color: '#4CAF50', textAlign: 'center', marginTop: 10 },
  rewardSubText: { fontSize: 18, color: '#555', fontWeight: '700', marginTop: 10, textAlign: 'center' },
  warningBox: { width: '85%', backgroundColor: '#FFF', padding: 30, borderRadius: 45, alignItems: 'center' },
  iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  warningTitle: { fontSize: 26, fontWeight: '900', color: '#5A9BD5', marginBottom: 10 },
  warningText: { fontSize: 17, color: '#555', textAlign: 'center', fontWeight: '600', marginBottom: 25, lineHeight: 24 },
  warningBtn: { backgroundColor: '#66BB6A', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25 },
  warningBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
});