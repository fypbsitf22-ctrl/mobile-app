import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayRemove, arrayUnion, collection, doc, increment, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import MainHeader from '../MainHeaderShared';

const { width, height } = Dimensions.get('window');

export default function GKLearningCard({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const { catId, startIndex, itemId } = useLocalSearchParams();
  const [allItems, setAllItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(Number(startIndex) || 0);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [completedList, setCompletedList] = useState<string[]>([]);
  const [audioPlayed, setAudioPlayed] = useState(false);

  const updateRecentHistory = async (item: any) => {
    if (role !== 'parent') return;
    const user = auth.currentUser;
    if (!user || !item?.id) return;
    try { 
      await updateDoc(doc(db, 'users', user.uid), { 
        recentHistory: arrayUnion({ id: item.id, name: item.name, timestamp: new Date().toISOString(), type: 'GK' }) 
      }); 
    } catch (e) {}
  };

  useEffect(() => {
    const user = auth.currentUser;
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

    if (user) {
      const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) setCompletedList(docSnap.data().completedLessons || []);
      });
      return () => { unsubItems(); unsubUser(); };
    }
    return () => unsubItems();
  }, [catId]);

  const currentItem = allItems[currentIndex];

  useEffect(() => {
    if (currentItem?.id) updateRecentHistory(currentItem);
    setAudioPlayed(false);
    return () => { sound?.unloadAsync(); };
  }, [currentIndex, currentItem]);

  const handleNext = async () => {
    if (!currentItem) return;

    if (!audioPlayed) {
      Alert.alert("Wait", "Please listen to the audio first! 🔊");
      return;
    }

    if (role === 'parent') {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), { 
          completedLessons: arrayUnion(currentItem.id), 
          inProgressLessons: arrayRemove(currentItem.id), 
          stars: increment(1) 
        });
      }
    }

    if (currentIndex < allItems.length - 1) {
      setCurrentIndex((p) => p + 1);
    } else {
      router.back();
    }
  };

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color="#7E57C2" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader role={role} />
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.titleBadge}><Text style={styles.headerTitle}>{currentItem?.name}</Text></View>
      </View>

      <View style={styles.content}>
        <View style={styles.imageWrapper}>
          <View style={styles.imageWhiteCard}>
            <Image source={{ uri: currentItem?.image }} style={styles.mainImage} resizeMode="contain" />
            {completedList.includes(currentItem?.id) && (
              <View style={styles.starOverlay}><Ionicons name="star" size={50} color="#FFD700" /></View>
            )}
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.nameText}>{currentItem?.name}</Text>
          <TouchableOpacity 
            onPress={async () => {
              if (!currentItem?.audio) return; 
              const { sound: s } = await Audio.Sound.createAsync({ uri: currentItem.audio });
              setSound(s); 
              await s.playAsync(); 
              setAudioPlayed(true);
            }} 
            style={styles.audioBtn}
          >
            <Ionicons name="volume-medium" size={50} color="#7E57C2" />
          </TouchableOpacity>
        </View>

        <View style={styles.navRow}>
          {/* Back Button color changed to soft Sky Blue */}
          <TouchableOpacity 
            style={[styles.navBtn, { backgroundColor: '#A2D2FF' }]} 
            onPress={() => currentIndex > 0 ? setCurrentIndex(p => p - 1) : router.back()}
          >
            <Text style={styles.navText}>Back</Text>
          </TouchableOpacity>
          
          {/* Next Button color changed to Green when active, Grey when locked */}
          <TouchableOpacity 
            style={[styles.navBtn, { backgroundColor: audioPlayed ? '#66BB6A' : '#CCC' }]} 
            onPress={handleNext}
          >
            <Text style={styles.navText}>
              {currentIndex === allItems.length - 1 ? 'Finish' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backCircle: { backgroundColor: '#7E57C2', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  titleBadge: { backgroundColor: '#FCE4EC', flex: 1, marginLeft: 15, paddingVertical: 12, borderRadius: 30, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#7E57C2' },
  content: { alignItems: 'center' },
  imageWrapper: { width: width * 0.85, height: height * 0.38, justifyContent: 'center' },
  imageWhiteCard: { backgroundColor: '#FFF', width: '100%', height: '100%', borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  mainImage: { width: '80%', height: '80%' },
  starOverlay: { position: 'absolute', top: 15, right: 15, backgroundColor: '#FFF', borderRadius: 30, padding: 5 },
  infoBox: { backgroundColor: '#FCE4EC', flexDirection: 'row', width: '85%', padding: 25, borderRadius: 35, alignItems: 'center', justifyContent: 'space-between', marginVertical: 30 },
  nameText: { fontSize: 32, fontWeight: 'bold', color: '#E87D88' },
  audioBtn: { backgroundColor: '#FFF', padding: 10, borderRadius: 20 },
  navRow: { flexDirection: 'row', width: '85%', justifyContent: 'space-between' },
  navBtn: { padding: 18, borderRadius: 25, width: '47%', alignItems: 'center' },
  navText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
});