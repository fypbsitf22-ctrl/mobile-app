import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import MainHeader from '../MainHeaderShared';

const { width } = Dimensions.get('window');

export default function IslamicSubSteps({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const { catId, title } = useLocalSearchParams();
  
  const [items, setItems] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]); // To check for completed items (Stars)
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    if (!catId) return;

    // 1. Fetch Subcategories (e.g. Wudu, Salah, Manners)
    const qSub = query(collection(db, "islamic_subcategories"), where("categoryID", "==", (catId as string).trim()));
    const unsubSub = onSnapshot(qSub, (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Fetch Islamic Items (to check completion status/Stars)
    const qItems = query(collection(db, "islamic_items"));
    const unsubItems = onSnapshot(qItems, (snap) => {
      setAllItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Fetch User Progress (Stars)
    const user = auth.currentUser;
    if (user && role === 'parent') {
      const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setCompletedLessons(docSnap.data().completedLessons || []);
        }
        setLoading(false);
      });
      return () => { unsubSub(); unsubItems(); unsubUser(); };
    } else {
      setLoading(false);
      return () => { unsubSub(); unsubItems(); };
    }
  }, [catId]);

 const handlePress = async (subItem: any) => {
  if (subItem.audio) {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: subItem.audio }, { shouldPlay: true });
      await delay(1200); 
      await sound.unloadAsync();
    } catch (e) { console.log("Audio Error:", e); }
  } else {
    await delay(200);
  }

  const basePath = role === 'parent' ? '/parent/islamic' : '/teacher/islamic';
  
  // 1. Look for the first question document belonging to this subcategory
  const q = query(
    collection(db, "islamic_items"), 
    where("categoryID", "==", subItem.id),
    orderBy("uploaded", "asc") // Order them by upload time
  );
  
  const snap = await getDocs(q);
  
  if (!snap.empty) {
    const firstDoc = snap.docs[0];
    const lessonData = firstDoc.data();

    // 2. Navigate and pass catId so the QA screen can fetch the full list of docs
    if (lessonData.type === "video" || lessonData.video) {
      router.push({ pathname: `${basePath}/islamicvideo` as any, params: { itemId: firstDoc.id, title: subItem.name } });
    } else if (lessonData.type === "qa") {
      router.push({ 
        pathname: `${basePath}/islamicqa` as any, 
        params: { 
            itemId: firstDoc.id, 
            catId: subItem.id, // We pass this to fetch all related docs
            title: subItem.name 
        } 
      });
    } else {
      router.push({ pathname: `${basePath}/islamicsteps` as any, params: { itemId: firstDoc.id, title: subItem.name } });
    }
  }
};

  const renderCard = ({ item }: any) => {
    // Check if the item linked to this subcategory is completed
    const associatedItem = allItems.find(i => i.categoryID === item.id);
    const isFinished = associatedItem && completedLessons.includes(associatedItem.id);

    return (
      <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
        <View style={styles.whiteBox}>
          {isFinished && (
            <View style={styles.starBadge}>
              <Ionicons name="star" size={18} color="#FFD700" />
            </View>
          )}
          <Image source={{ uri: item.image }} style={styles.img} resizeMode="contain" />
          <Text style={styles.cardText} numberOfLines={1}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#5A9BD5" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader role={role} /> 
      
      {/* Blue Header with Back Arrow (Matching Sample UI) */}
      <View style={styles.titleRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={30} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCard}>
          <Text style={styles.headerText} numberOfLines={1}>{title}</Text>
        </View>
      </View>

      <FlatList 
        data={items} 
        numColumns={2} 
        renderItem={renderCard} 
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
  
  // Header Styles (Blue Theme)
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  backBtn: { 
    backgroundColor: '#5A9BD5', 
    width: 45, 
    height: 45, 
    borderRadius: 22.5, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 4,
  },
  headerCard: { 
    flex: 1, 
    backgroundColor: '#E1F5FE', 
    padding: 15, 
    borderRadius: 25, 
    alignItems: 'center', 
    marginLeft: 15,
    elevation: 2 
  },
  headerText: { fontSize: 22, fontWeight: 'bold', color: '#5A9BD5' },

  // List & Card Styles
  row: { justifyContent: 'space-between', paddingHorizontal: 20 },
  card: { width: width * 0.43, marginTop: 20 },
  whiteBox: { 
    backgroundColor: '#FFF', 
    borderRadius: 30, 
    padding: 15, 
    alignItems: 'center', 
    elevation: 5, 
    position: 'relative' 
  },
  img: { width: '100%', height: 100, marginBottom: 10 },
  cardText: { fontSize: 17, fontWeight: 'bold', color: '#444', textAlign: 'center' },
  
  // Star Badge
  starBadge: { 
    position: 'absolute', 
    top: -8, 
    right: -8, 
    backgroundColor: '#FFF', 
    padding: 5, 
    borderRadius: 20, 
    elevation: 8, 
    borderWidth: 2, 
    borderColor: '#FFD700' 
  }
});