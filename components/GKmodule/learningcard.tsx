import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, collection, doc, getDoc, increment, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import MainHeader from '../MainHeaderShared';

const { width, height } = Dimensions.get('window');

export default function GKLearningCard({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const { catId, startIndex, itemId } = useLocalSearchParams();
  
  // -------------------- STATE & REFS --------------------
  const [allItems, setAllItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(Number(startIndex) || 0);
  const [loading, setLoading] = useState(true);
  const [audioPlayed, setAudioPlayed] = useState(false);
  
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [appConfig, setAppConfig] = useState<any>(null);
  
  const starScale = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null); 

  // TIMER STATE
  const [elapsedTime, setElapsedTime] = useState(0);

  // -------------------- TIMER LOGIC --------------------
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

  // -------------------- SAFE SOUND HELPER --------------------
  async function playSound(url: string | undefined) {
    if (!url) return;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      soundRef.current = sound;
    } catch (e) {
      console.log("Audio Playback Error:", e);
    }
  }

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // -------------------- DATA FETCHING --------------------
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const docRef = doc(db, "app_config", "gk");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAppConfig({
            warning: docSnap.data().warning_url,
            success: docSnap.data().success_url,
            lottie: docSnap.data().success_lottie_url,
            instruction: docSnap.data().instruction_url,
          });
        }
      } catch (e) { console.log("Config fetch error:", e); }
    };
    fetchConfigs();

    if (!catId) return;
    const qItems = query(collection(db, 'gk_items'), where('categoryID', '==', catId), orderBy('uploaded', 'desc'));
    const unsubItems = onSnapshot(qItems, (snapshot) => {
      const fetchedItems = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllItems(fetchedItems);
      if (itemId) {
        const foundIndex = fetchedItems.findIndex((i) => i.id === itemId);
        if (foundIndex !== -1) setCurrentIndex(foundIndex);
      }
      setLoading(false);
    });
    return () => unsubItems();
  }, [catId]);

  const currentItem = allItems[currentIndex];

  // Auto-play instruction on load
  useEffect(() => {
    if (!loading && appConfig?.instruction) {
      playSound(appConfig.instruction);
    }
  }, [loading, currentIndex, appConfig]);

  useEffect(() => {
    setAudioPlayed(false);
  }, [currentIndex]);

  const handleNext = async () => {
    if (!currentItem) return;

    if (!audioPlayed) {
      setShowWarningModal(true);
      playSound(appConfig?.warning);
      return;
    }

    if (role === 'parent') {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), { 
          completedLessons: arrayUnion(currentItem.id), 
          stars: increment(1) 
        });
      }
    }

    setShowRewardModal(true);
    playSound(appConfig?.success);
    starScale.setValue(0);
    Animated.spring(starScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

    setTimeout(() => {
      setShowRewardModal(false);
      if (currentIndex < allItems.length - 1) {
        setCurrentIndex((p) => p + 1);
      } else {
        router.back();
      }
    }, 5500);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#66BB6A" /></View>;

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
            <Text style={styles.rewardSubText}>You finished the lesson{"\n"}and earned a star!</Text>
          </Animated.View>
        </View>
      </Modal>

      {/* WARNING MODAL */}
      <Modal visible={showWarningModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.warningBox}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFF0D1' }]}>
              <Ionicons name="volume-high" size={70} color="#FF9800" />
            </View>
            <Text style={styles.warningTitle}>Almost There! 👋</Text>
            <Text style={styles.warningText}>
                We need to <Text style={{ fontWeight: '900', color: '#FF9800' }}>listen to the audio</Text> first.{"\n"}
                Finish listening then press next.
            </Text>
            <TouchableOpacity style={styles.warningBtn} onPress={() => setShowWarningModal(false)}>
              <Text style={styles.warningBtnText}>I'll Listen! 🔊</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HEADER SECTION */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.titleBadge}>
            <Text style={styles.headerTitle} numberOfLines={1}>{currentItem?.name}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.topSection}>
            {/* INSTRUCTION WITH SPEAKER BUTTON */}
            <View style={styles.instructionRow}>
              <Text style={styles.topInstruction}>Tap the speaker and listen 👇</Text>
              <TouchableOpacity 
                style={styles.speakerBtn} 
                onPress={() => playSound(appConfig?.instruction)}
              >
                <Ionicons name="volume-high" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.imageWhiteCard}>
                <Image source={{ uri: currentItem?.image }} style={styles.mainImage} resizeMode="contain" />
            </View>
        </View>

        <View style={styles.middleSection}>
            {/* CLICKABLE BAR - NOW WRAPS THE WHOLE ROW FOR EASIER MID INTERACTION */}
            <TouchableOpacity 
                activeOpacity={0.7}
                onPress={async () => {
                    if (!currentItem?.audio) return; 
                    await playSound(currentItem.audio);
                    setAudioPlayed(true);
                }} 
                style={styles.infoBox}
            >
                <Text style={styles.nameText} numberOfLines={1} adjustsFontSizeToFit>{currentItem?.name}</Text>
                <View style={styles.audioBtn}>
                    <Ionicons name="volume-medium" size={45} color="#7E57C2" />
                </View>
            </TouchableOpacity>

            <View style={[styles.statusIndicator, { backgroundColor: audioPlayed ? '#E8F5E9' : '#F5F5F5' }]}>
                <Ionicons name={audioPlayed ? "checkmark-circle" : "play-circle"} size={28} color={audioPlayed ? "#4CAF50" : "#555"} />
                <View style={{ marginLeft: 14 }}>
                    <Text style={styles.timerText}>Learning Time: {formatTime(elapsedTime)}</Text>
                </View>
            </View>
        </View>

        {/* BUTTON ROW MATCHING SAMPLE CODE UI */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.btn, styles.backBtnColor]} 
            onPress={() => currentIndex > 0 ? setCurrentIndex(p => p - 1) : router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
            <Text style={styles.btnLabel}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.btn, audioPlayed ? styles.nextBtnColor : styles.disabledBtnColor]} 
            onPress={handleNext}
          >
            <Text style={styles.btnLabel}>
              {currentIndex === allItems.length - 1 ? 'Finish' : 'Next'}
            </Text>
            <Ionicons name="arrow-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 10,
    zIndex: 10 
  },
  backCircle: { 
    backgroundColor: '#7E57C2', 
    width: 46, 
    height: 46, 
    borderRadius: 23, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 4,
  },
  titleBadge: { 
    backgroundColor: '#FCE4EC', 
    flex: 1, 
    marginLeft: 15, 
    paddingVertical: 10, 
    paddingHorizontal: 20,
    borderRadius: 30, 
    alignItems: 'center', 
    elevation: 2 
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#7E57C2' },

  content: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingBottom: 40,
    paddingHorizontal: 20 
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  middleSection: {
    width: '100%',
    alignItems: 'center',
  },
  
  // ALIGNMENT STYLES
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  topInstruction: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#5E35B1', 
    textAlign: 'center',
    marginRight: 10
  },
  speakerBtn: {
    backgroundColor: '#7E57C2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },

  imageWhiteCard: { 
    backgroundColor: '#FFF', 
    width: width * 0.85, 
    height: height * 0.30, 
    borderRadius: 40, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 8,
  },
  mainImage: { width: '80%', height: '80%' },
  
  infoBox: { 
  backgroundColor: '#FCE4EC', 
  flexDirection: 'row', 
  width: '95%',            
  paddingVertical: 12,     
  paddingHorizontal: 15,   
  borderRadius: 25,        
  alignItems: 'center', 
  justifyContent: 'space-between', 
  elevation: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
},
nameText: { 
  fontSize: 22,            
  fontWeight: 'bold', 
  color: '#E87D88', 
  flex: 1, 
  marginRight: 10 
},
audioBtn: { 
  backgroundColor: '#FFF', 
  padding: 6,              
  borderRadius: 20, 
  elevation: 2,
},
  
  statusIndicator: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: '100%', 
    marginTop: 15, 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 20,
  },
  timerText: { fontSize: 12, color: '#999', fontWeight: '600', marginTop: 1 },

  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%',
    marginTop: 10 
  },
  btn: { 
    flexDirection: 'row', 
    paddingVertical: 20, 
    borderRadius: 35, 
    width: '47%', 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 5 
  },
  btnLabel: { 
    color: '#FFF', 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginHorizontal: 10 
  },
  backBtnColor: { backgroundColor: '#FFC26D' },
  nextBtnColor: { backgroundColor: '#66BB6A' },
  disabledBtnColor: { backgroundColor: '#BDBDBD' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  rewardBox: { backgroundColor: '#FFF', padding: 30, borderRadius: 50, alignItems: 'center', elevation: 20, width: '90%', borderWidth: 10, borderColor: '#E8F5E9' },
  wellDoneText: { fontSize: 28, fontWeight: '900', color: '#4CAF50', textAlign: 'center', marginTop: -10, width: '100%' },
  rewardSubText: { fontSize: 18, color: '#555', fontWeight: '700', marginTop: 10, textAlign: 'center', lineHeight: 24 },
  warningBox: { width: '85%', backgroundColor: '#FFF', padding: 30, borderRadius: 45, alignItems: 'center' },
  iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  warningTitle: { fontSize: 26, fontWeight: '900', color: '#FF9800', marginBottom: 10 },
  warningText: { fontSize: 17, color: '#555', textAlign: 'center', fontWeight: '600', marginBottom: 25, lineHeight: 24 },
  warningBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25 },
  warningBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
});