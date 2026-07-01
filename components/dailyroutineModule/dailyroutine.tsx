import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av'; // Ensure expo-av is installed
import { useRouter } from 'expo-router';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import MainHeader from '../MainHeaderShared';

const { width } = Dimensions.get('window');

export default function DailyRoutineModule({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function for the delay/space
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handlePress = async (item: any, index: number) => {
    // 1. Play Audio if it exists
    if (item.audio) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: item.audio },
          { shouldPlay: true }
        );
        
        // 2. WAIT for a short space (e.g., 1.2 seconds) 
        // This gives the user time to hear the audio before the screen switches
        await delay(1200); 

        // Cleanup: unload the sound after playing
        await sound.unloadAsync();
      } catch (e) {
        console.log("Audio Error:", e);
      }
    } else {
        // If there is no audio, just a tiny delay for feedback
        await delay(200);
    }

    // 3. Navigate to the next screen
    const basePath = role === 'parent' ? '/parent/dailyroutine' : '/teacher/dailyroutine';
    router.push({
      pathname: `${basePath}/routinevideo` as any,
      params: { 
        catId: item.id, 
        title: item.name, 
        catIndex: index,
        videoIndex: '0' 
      }
    });
  };

  const fetchData = () => {
    const qCats = query(collection(db, "routine_categories"), orderBy("uploaded", "desc"));
    const unsubCats = onSnapshot(qCats, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qItems = query(collection(db, "routine_items"));
    const unsubItems = onSnapshot(qItems, (snapshot) => {
      setAllItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const user = auth.currentUser;
    if (user && role === 'parent') {
      const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setCompletedLessons(docSnap.data().completedLessons || []);
        }
        setLoading(false);
      });
      return () => { unsubCats(); unsubItems(); unsubUser(); };
    } else {
      setLoading(false);
      return () => { unsubCats(); unsubItems(); };
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderCategory = ({ item, index }: any) => {
    const categoryVideo = allItems.find(video => video.categoryID === item.id);
    const isCategoryFinished = categoryVideo && completedLessons.includes(categoryVideo.id);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePress(item, index)} // Trigger the Audio + Delay + Navigation
      >
        <View style={styles.whiteBox}>
          {isCategoryFinished && (
            <View style={styles.starBadge}>
              <Ionicons name="star" size={20} color="#FFD700" />
            </View>
          )}
          <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="contain" />
          <View style={styles.cardFooter}>
            <Text style={styles.cardText} numberOfLines={1}>{item.name}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#66BB6A" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader role={role} />
      <View style={styles.titleRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={30} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCard}>
          <Text style={styles.headerText}>Daily Routine</Text>
        </View>
      </View>
      <FlatList
        data={categories}
        numColumns={2}
        renderItem={({ item, index }) => renderCategory({ item, index })}
        keyExtractor={item => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: 30, paddingTop: 10 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  backBtn: { 
    backgroundColor: '#66BB6A', 
    width: 45, 
    height: 45, 
    borderRadius: 22.5, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 4,
  },
  headerCard: { flex: 1, backgroundColor: '#E0F9E9', padding: 15, borderRadius: 25, alignItems: 'center', marginLeft: 15 },
  headerText: { fontSize: 24, fontWeight: 'bold', color: '#66BB6A' },
  row: { justifyContent: 'space-between', paddingHorizontal: 20 },
  card: { width: width * 0.43, marginTop: 20 },
  whiteBox: { backgroundColor: '#FFF', borderRadius: 30, padding: 15, alignItems: 'center', elevation: 5, position: 'relative' },
  cardImage: { width: '100%', height: 110, marginBottom: 10 },
  cardFooter: { alignItems: 'center' },
  cardText: { fontSize: 18, fontWeight: 'bold', color: '#444', textAlign: 'center' },
  starBadge: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FFF', padding: 5, borderRadius: 20, elevation: 8, borderWidth: 2, borderColor: '#FFD700' }
});