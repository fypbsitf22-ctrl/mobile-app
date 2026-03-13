import { Ionicons } from '@expo/vector-icons';
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
    const basePath = role === 'parent' ? '/parent/dailyroutine' : '/teacher/dailyroutine';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: `${basePath}/routinevideo` as any,
            params: { 
              catId: item.id, 
              title: item.name, 
              catIndex: index,
              videoIndex: '0' 
            }
          })
        }
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
        {/* Updated Back Button: Highlighted with Green Circle and arrow-back icon */}
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
  
  // Updated backBtn style for the "Highlighted Green" look
  backBtn: { 
    backgroundColor: '#66BB6A', 
    width: 45, 
    height: 45, 
    borderRadius: 22.5, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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