import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, collection, doc, getDoc, getDocs, increment, orderBy, query, updateDoc, where } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import MainHeaderShared from '../MainHeaderShared';

export default function IslamicStepByStep({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const { itemId, title } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [appConfig, setAppConfig] = useState<any>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  const starScale = useRef(new Animated.Value(0)).current;

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

  // -------------------- DATA FETCH --------------------
  useEffect(() => {
    const fetchAll = async () => {
      if (!itemId) return;
      try {
        const docSnap = await getDoc(doc(db, "islamic_items", itemId as string));
        if (docSnap.exists()) setData(docSnap.data());

        const configSnap = await getDoc(doc(db, "app_config", "islamic_sounds"));
        if (configSnap.exists()) {
          setAppConfig({
            warning: configSnap.data().warning2_url, 
            success: configSnap.data().success2_url, 
            lottie: configSnap.data().success_lottie_url,
            instruction: configSnap.data().instruction2_url,
          });
        }
      } catch (e) { console.log("Fetch error:", e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [itemId]);

  // -------------------- SOUND HELPER --------------------
  async function playSound(url: string | undefined, isStepAudio: boolean = false) {
    if (!url) return;
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      soundRef.current = sound;
      
      if (isStepAudio) {
        setAudioPlayed(true);
      }
    } catch (e) { console.log("Audio Error:", e); }
  }

  useEffect(() => {
    if (!loading && appConfig?.instruction) playSound(appConfig.instruction);
  }, [loading, currentStep, appConfig]);

  useEffect(() => {
    return () => { if (soundRef.current) soundRef.current.unloadAsync(); };
  }, []);

  // -------------------- NAVIGATION LOGIC --------------------
  const handleNext = async () => {
    if (!audioPlayed) {
      setShowWarningModal(true);
      playSound(appConfig?.warning); 
      return;
    }

    const isLastStep = currentStep === data.steps.length - 1;

    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
      setAudioPlayed(false); 
    } else {
      if (role === 'parent' && auth.currentUser) {
        try {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
            completedLessons: arrayUnion(itemId), 
            stars: increment(1) 
          });
        } catch (e) { console.log("Firebase Error:", e); }
      }

      setShowRewardModal(true);
      playSound(appConfig?.success); 
      starScale.setValue(0);
      Animated.spring(starScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

     setTimeout(async () => {
  setShowRewardModal(false);

  try {
    const currentItemId = itemId as string;

    // 1. Get current item to find its subcategory
    const currentItemDoc = await getDoc(doc(db, "islamic_items", currentItemId));
    if (!currentItemDoc.exists()) {
      router.back();
      return;
    }

    const currentCatId = currentItemDoc.data().categoryID;

    // 2. Get current subcategory
    const currentSubDoc = await getDoc(doc(db, "islamic_subcategories", currentCatId));
    if (!currentSubDoc.exists()) {
      router.back();
      return;
    }

    const parentCategoryID = currentSubDoc.data().categoryID;

    // 3. Get all subcategories
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

    // 4. Go to NEXT lesson
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

    // If no next lesson
    router.back();

  } catch (e) {
    console.log("Next Lesson Error:", e);
    router.back();
  }

}, 5500);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#5A9BD5" /></View>;

  const step = data.steps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderShared role={role} />

      <Modal visible={showRewardModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.rewardBox, { transform: [{ scale: starScale }] }]}>
            {appConfig?.lottie ? 
              <LottieView source={{ uri: appConfig.lottie }} autoPlay loop style={{ width: 220, height: 220 }} /> :
              <Ionicons name="star" size={120} color="#FFD700" />}
            <Text style={styles.wellDoneText} numberOfLines={1} adjustsFontSizeToFit>CONGRATULATIONS! 🎉</Text>
            <Text style={styles.rewardSubText}>You finished the lesson{"\n"}and earned a star!</Text>
          </Animated.View>
        </View>
      </Modal>

     <Modal visible={showWarningModal} transparent animationType="slide">
             <View style={styles.modalOverlay}>
               <View style={styles.warningBox}>
                 <View style={[styles.iconCircle, { backgroundColor: '#FFF0D1' }]}>
                   <Ionicons name="eye" size={70} color="#5A9BD5" />
                 </View>
                 <Text style={styles.warningTitle}>Almost There! 👋</Text>
                  <Text style={styles.warningText}>
                                We need to <Text style={{ fontWeight: '900', color: '#5A9BD5' }}>listen to the audio</Text> first.{"\n"}
                                Finish listening then press next.
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
          <View style={styles.titlePill}>
            <Text style={styles.categoryTitle} numberOfLines={1}>{title || data.name}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.stepIndicatorText}>Step {currentStep + 1} of {data.steps.length}</Text>
          
          {/* Aligned Instruction Row with Speaker */}
          <View style={styles.instructionRow}>
            <Text style={styles.instructionLabel}>Tap the speaker and listen 👇</Text>
            <TouchableOpacity 
              style={styles.instructionSpeakerBtn} 
              onPress={() => playSound(appConfig?.instruction)}
            >
              <Ionicons name="volume-high" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.arabicContainer}>
            <Text style={styles.arabicText} adjustsFontSizeToFit>
              {step?.arabic}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.audioBtn, audioPlayed && { backgroundColor: '#66BB6A' }]} 
            onPress={() => playSound(step?.audio, true)}
          >
            <Ionicons name="volume-high" size={36} color="#FFF" />
            <Text style={styles.audioBtnText}>Hear Dua</Text>
          </TouchableOpacity>

          <View style={styles.transBox}>
            <Text style={styles.trans}>{step?.Translation || step?.translation}</Text>
          </View>

          <View style={styles.statusIndicator}>
             <Text style={styles.timerText}>Learning Time: {formatTime(elapsedTime)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.btn, styles.backBtnColor]} 
        onPress={async () => {
  if (currentStep > 0) {
    setCurrentStep(c => (setAudioPlayed(true), c - 1));
    return;
  }

  try {
    const currentItemId = itemId as string;

    // 1. Get current item
    const currentItemDoc = await getDoc(doc(db, "islamic_items", currentItemId));
    if (!currentItemDoc.exists()) {
      router.back();
      return;
    }

    const currentCatId = currentItemDoc.data().categoryID;

    // 2. Get subcategory
    const currentSubDoc = await getDoc(doc(db, "islamic_subcategories", currentCatId));
    if (!currentSubDoc.exists()) {
      router.back();
      return;
    }

    const parentCategoryID = currentSubDoc.data().categoryID;

    // 3. Get all subcategories
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

    // 4. Go to PREVIOUS lesson
    if (currentSubIndex > 0) {
      const prevSub = subList[currentSubIndex - 1];

      const q = query(
        collection(db, "islamic_items"),
        where("categoryID", "==", prevSub.id),
        orderBy("uploaded", "asc")
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const lastDoc = snap.docs[snap.docs.length - 1];
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

    // If first lesson → go back
    router.back();

  } catch (e) {
    console.log("Back Error:", e);
    router.back();
  }
}}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
          <Text style={styles.btnLabel}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, audioPlayed ? styles.nextBtnColor : styles.disabledBtnColor]} 
          onPress={handleNext}
        >
          <Text style={styles.btnLabel}>
            {currentStep === data.steps.length - 1 ? "Finish" : "Next"}
          </Text>
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
  topHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  exitCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#5A9BD5', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  titlePill: { backgroundColor: '#E1F5FE', paddingHorizontal: 50, paddingVertical: 12, borderRadius: 40, elevation: 2, flexShrink: 0, marginHorizontal: 10, alignItems: 'center' },
  categoryTitle: { fontSize: 22, fontWeight: '900', color: '#5A9BD5', textAlign: 'center' },
  content: { flex: 1, paddingHorizontal: 20, paddingVertical: 10, justifyContent: 'center' },
  card: { width: '100%', backgroundColor: '#FFF', borderRadius: 50, padding: 25, alignItems: 'center', elevation: 5, flex: 0.95 },
  
  // ALIGNED INSTRUCTION STYLES
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -10,
    width: '100%',
  },
  instructionLabel: { 
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
    marginRight: 10
  },
  instructionSpeakerBtn: {
    backgroundColor: '#5A9BD5',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3
  },

  stepIndicatorText: { fontSize: 16, color: '#A2D2FF', fontWeight: 'bold', marginBottom: 5 },
  arabicContainer: { width: '100%', minHeight: 140, justifyContent: 'center', alignItems: 'center', marginBottom: -25},
  arabicText: { fontSize: 48, fontWeight: 'bold', color: '#333', textAlign: 'center', lineHeight: 65 },
  audioBtn: { flexDirection: 'row', backgroundColor: '#5A9BD5', paddingVertical: 18, paddingHorizontal: 35, borderRadius: 40, alignItems: 'center', elevation: 4, marginBottom: 5 },
  audioBtnText: { color: '#FFF', fontSize: 22, fontWeight: '900', marginLeft: 15 },
  transBox: { backgroundColor: '#FFF9E9', paddingVertical: 30, paddingHorizontal: 30, borderRadius: 30, width: '100%', marginTop: 10 },
  trans: { fontSize: 20, color: '#1F2937', textAlign: 'center', fontWeight: '700', lineHeight: 28 },
  statusIndicator: { marginTop: 'auto', paddingTop: 10 },
  timerText: { fontSize: 14, color: '#AAA', fontWeight: '600' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 40 },
  btn: { flexDirection: 'row', paddingVertical: 18, borderRadius: 35, width: '47%', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  btnLabel: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginHorizontal: 8 },
  backBtnColor: { backgroundColor: '#FFC26D' },
  nextBtnColor: { backgroundColor: '#66BB6A' },
  disabledBtnColor: { backgroundColor: '#9CA3AF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  rewardBox: { backgroundColor: '#FFF', padding: 30, borderRadius: 50, alignItems: 'center', elevation: 20, width: '90%', borderWidth: 10, borderColor: '#E1F5FE' },
  wellDoneText: { fontSize: 28, fontWeight: '900', color: '#4CAF50', textAlign: 'center', marginTop: -10, width: '100%' },
  rewardSubText: { fontSize: 18, color: '#555', fontWeight: '700', marginTop: 10, textAlign: 'center', lineHeight: 24 },
  warningBox: { width: '85%', backgroundColor: '#FFF', padding: 30, borderRadius: 45, alignItems: 'center' },
  iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  warningTitle: { fontSize: 26, fontWeight: '900', color: '#5A9BD5', marginBottom: 10 },
  warningText: { fontSize: 17, color: '#555', textAlign: 'center', fontWeight: '600', marginBottom: 25, lineHeight: 24 },
  warningBtn: { backgroundColor: '#66BB6A', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25 },
  warningBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
});