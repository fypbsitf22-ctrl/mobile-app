import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, collection, doc, increment, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import { auth, db } from '../../firebaseConfig';
import MainHeader from '../MainHeaderShared';

const { width } = Dimensions.get('window');

export default function RoutineVideoModule({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const { catId, title } = useLocalSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [videoFinished, setVideoFinished] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const starScale = useRef(new Animated.Value(0)).current;

  const getYoutubeId = (url: string): string => {
    if (!url) return "";
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?v=)|(&v=))([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[8].length === 11) ? match[8] : url;
  };

  async function playSuccessSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../../assets/audio/success.mp3'));
      await sound.playAsync();
    } catch (e) { console.log("Sound error:", e); }
  }

  useEffect(() => {
    if (!catId) return;
    setLoading(true);
    const q = query(collection(db, 'routine_items'), where('categoryID', '==', (catId as string).trim()), orderBy('uploaded', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [catId]);

  const currentItem = items[currentIndex];
  const isLastVideo = currentIndex === items.length - 1;

  useEffect(() => { setVideoFinished(false); }, [currentIndex]);

  const onStateChange = useCallback((state: string) => { 
    if (state === 'ended') setVideoFinished(true); 
  }, []);

  const handleFinish = async () => {
    // 1. VALIDATION: Both Teacher and Parent must finish the video
    if (!videoFinished) {
      Alert.alert("Wait!", "Please watch the whole video to get your Star! ⭐");
      return;
    }

    // 2. DATA PROTECTION: Only update Firebase for Parents
    if (role === 'parent') {
      const user = auth.currentUser;
      if (user && currentItem) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            completedLessons: arrayUnion(currentItem.id),
            stars: increment(1),
          });
        } catch (e) { 
          console.log("Firebase Update Error:", e); 
        }
      }
    }

    // 3. UI EXPERIENCE: Show reward to both Teacher and Parent
    setShowRewardModal(true);
    playSuccessSound();
    Animated.spring(starScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();

    setTimeout(() => {
      setShowRewardModal(false);
      router.back(); 
    }, 3000);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#66BB6A" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader role={role} />
      
      <Modal visible={showRewardModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.rewardBox, { transform: [{ scale: starScale }] }]}>
            <Ionicons name="star" size={100} color="#FFD700" />
            <Text style={styles.wellDoneText}>MASHALLAH!</Text>
          </Animated.View>
        </View>
      </Modal>

      <View style={styles.headerArea}><Text style={styles.categoryTitle}>{title}</Text></View>
      
      <View style={styles.mainContent}>
        <View style={styles.videoWrapper}>
          <YoutubePlayer 
            key={currentItem?.id} 
            height={(width - 40) * 0.5625} 
            play={true} 
            videoId={getYoutubeId(currentItem?.video)} 
            onChangeState={onStateChange} 
          />
        </View>
        
        <Text style={styles.videoName}>{currentItem?.name}</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.btn, {backgroundColor: '#A2D2FF'}]} 
            onPress={() => currentIndex > 0 ? setCurrentIndex(p => p - 1) : router.back()}
          >
            <Text style={styles.btnLabel}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btn, {backgroundColor: videoFinished ? '#66BB6A' : '#CCC'}]} 
            onPress={() => {
              if (isLastVideo) {
                handleFinish();
              } else {
                if (videoFinished) {
                  setCurrentIndex(p => p + 1);
                } else {
                  Alert.alert("Wait", "Finish the video first!");
                }
              }
            }}
          >
            <Text style={styles.btnLabel}>{isLastVideo ? "Finish" : "Next"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  rewardBox: { backgroundColor: '#FFF', padding: 30, borderRadius: 50, alignItems: 'center' },
  wellDoneText: { fontSize: 36, fontWeight: '900', color: '#66BB6A' },
  headerArea: { alignItems: 'center', marginTop: 15 },
  categoryTitle: { fontSize: 26, fontWeight: '900', color: '#66BB6A' },
  mainContent: { padding: 20, flex: 1 },
  videoWrapper: { width: '100%', borderRadius: 25, overflow: 'hidden', elevation: 8 },
  videoName: { fontSize: 28, fontWeight: 'bold', color: '#444', marginTop: 20, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', position: 'absolute', bottom: 40, left: 20 },
  btn: { paddingVertical: 18, borderRadius: 25, width: '47%', alignItems: 'center' },
  btnLabel: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
});