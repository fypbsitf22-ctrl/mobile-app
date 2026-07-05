import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { collection, doc, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import MainHeader from '../MainHeaderShared';
const { width } = Dimensions.get('window');

export default function IslamicMain({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);              // ADDED
  const [completedLessons, setCompletedLessons] = useState<string[]>([]); // ADDED
  const [loading, setLoading] = useState(true);
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    const q = query(collection(db, "islamic_categories"), orderBy("uploaded", "desc"));
    const unsubCat = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // ADDED: fetch all islamic_items so we can find the item tied to each direct-video category
    const qItems = query(collection(db, "islamic_items"));
    const unsubItems = onSnapshot(qItems, (snap) => {
      setAllItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // ADDED: fetch user's completedLessons
    const user = auth.currentUser;
    let unsubUser = () => {};
    if (user && role === 'parent') {
      unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setCompletedLessons(docSnap.data().completedLessons || []);
        }
      });
    }

    return () => { unsubCat(); unsubItems(); unsubUser(); };
  }, []);

  const handlePress = async (item: any) => {
    // 1. Play Audio
    if (item.audio) {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: item.audio }, { shouldPlay: true });
        // Reduced delay to 2500ms (3500ms - 1000ms)
        await delay(2500); 
        await sound.unloadAsync();
      } catch (e) { console.log("Audio Error:", e); }
    }

    const basePath = role === 'parent' ? '/parent/islamic' : '/teacher/islamic';

    // 2. THE BRAIN (Determining the path)
    try {
        // Step A: Check if this category has subcategories (like "Duas")
        const subQuery = query(collection(db, "islamic_subcategories"), where("categoryID", "==", item.id));
        const subSnap = await getDocs(subQuery);

        if (!subSnap.empty) {
            // HAS SUBCATEGORIES -> Go to the correct sub-list interface
            if (item.type === "qa") {
                router.push({ 
                    pathname: `${basePath}/islamicsubqa` as any, 
                    params: { catId: item.id, title: item.name } 
                });
            } else {
                // Default to standard sub-steps list (for chunks/video sub-items)
                router.push({ 
                    pathname: `${basePath}/islamicsubcategories` as any, 
                    params: { catId: item.id, title: item.name } 
                });
            }
        } else {
            // NO SUBCATEGORIES (Direct Lesson like Namaz or Wudu)
            // Look for the lesson document directly in islamic_items
            const itemQuery = query(collection(db, "islamic_items"), where("categoryID", "==", item.id));
            const itemSnap = await getDocs(itemQuery);

            if (!itemSnap.empty) {
                const lessonDoc = itemSnap.docs[0];
                const lessonData = lessonDoc.data();
                const lessonId = lessonDoc.id;

                // Sense the type from the Item document
                if (lessonData.video || lessonData.type === "video") {
                    // It's a video -> Open Video Player
                    router.push({ pathname: `${basePath}/islamicvideo` as any, params: { itemId: lessonId, title: item.name } });
                } else if (lessonData.type === "qa") {
                    // It's a direct quiz -> Open Quiz Player
                    router.push({ pathname: `${basePath}/islamicqa` as any, params: { itemId: lessonId, title: item.name } });
                } else {
                    // It's chunks -> Open Steps Player
                    router.push({ pathname: `${basePath}/islamicsteps` as any, params: { itemId: lessonId, title: item.name } });
                }
            }
        }
    } catch (error) {
        console.error("Navigation Brain Error:", error);
    }
  };

  // ADDED: renderCard function (was inline before) to include the star badge check
  const renderCard = ({ item }: any) => {
    const associatedItem = allItems.find(i => i.categoryID === item.id);
    const isFinished = associatedItem && completedLessons.includes(associatedItem.id);

    return (
      <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
        <View style={styles.whiteBox}>
          {isFinished && (
            <View style={styles.starBadge}>
              <Ionicons name="star" size={20} color="#FFD700" />
            </View>
          )}
          <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="contain" />
          <Text style={styles.cardText} numberOfLines={1}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MainHeader role={role} /> 
      <View style={styles.titleRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={30} color="#FFF" /></TouchableOpacity>
        <View style={styles.headerCard}><Text style={styles.headerText}>Islamic Learning</Text></View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#A2D2FF" /></View>
      ) : (
        <FlatList 
          data={categories} 
          numColumns={2} 
          renderItem={renderCard}
          keyExtractor={item => item.id} 
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 25 },
  backBtn: { backgroundColor: '#5A9BD5', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  headerCard: { flex: 1, backgroundColor: '#D4E9FF', padding: 15, borderRadius: 25, alignItems: 'center', marginLeft: 15 },
  headerText: { fontSize: 24, fontWeight: 'bold', color: '#5A9BD5' }, 
  row: { justifyContent: 'space-between', paddingHorizontal: 20 },
  card: { width: width * 0.43, marginTop: 20 },
  whiteBox: { backgroundColor: '#FFF', borderRadius: 30, padding: 15, alignItems: 'center', elevation: 5, position: 'relative' }, // added position: 'relative' — required for absolute-positioned starBadge to anchor correctly
  cardImage: { width: '100%', height: 110, marginBottom: 10 },
  cardText: { fontSize: 18, fontWeight: 'bold', color: '#444', textAlign: 'center' },

  // ADDED
  starBadge: { 
    position: 'absolute', 
    top: -10, 
    right: -10, 
    backgroundColor: '#FFF', 
    padding: 5, 
    borderRadius: 20, 
    elevation: 8, 
    borderWidth: 2, 
    borderColor: '#FFD700',
    zIndex: 10
  }
});