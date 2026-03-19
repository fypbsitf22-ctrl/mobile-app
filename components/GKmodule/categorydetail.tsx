import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import MainHeader from '../MainHeaderShared';

const { width } = Dimensions.get('window');

export default function GKCategoryDetail({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const { catId, title } = useLocalSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function for the delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    if (!catId) return;
    const q = query(collection(db, "gk_items"), where("categoryID", "==", catId), orderBy("uploaded", "desc"));
    const unsubItems = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const user = auth.currentUser;
    if (user) {
      const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) setCompletedIds(docSnap.data().completedLessons || []);
      });
      return () => { unsubItems(); unsubUser(); };
    }
    return () => unsubItems();
  }, [catId]);

  const handleItemPress = async (item: any, index: number) => {
    // Audio Logic from Sample
    if (item.audio) {
      try { 
        const { sound } = await Audio.Sound.createAsync(
            { uri: item.audio },
            { shouldPlay: true }
        ); 
        await delay(1200);
        await sound.unloadAsync();
      } catch (e) {
        console.log("Audio Error:", e);
      }
    } else {
        await delay(200);
    }
    
    const basePath = role === 'parent' ? '/parent/gk' : '/teacher/gk';
    router.push({ 
        pathname: `${basePath}/learningcard` as any, 
        params: { catId, startIndex: index, itemId: item.id } 
    });
  };

  const renderItem = ({ item, index }: any) => {
    const isCompleted = completedIds.includes(item.id);

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleItemPress(item, index)}>
        <View style={styles.whiteBox}>
          {isCompleted && (
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MainHeader role={role} />
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.titleBadge}><Text style={styles.headerTitle}>{title}</Text></View>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#7E57C2" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
            data={items} 
            numColumns={2} 
            keyExtractor={(item) => item.id} 
            renderItem={renderItem} 
            columnWrapperStyle={styles.row} 
            contentContainerStyle={styles.listPadding} 
            showsVerticalScrollIndicator={false} 
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 15, marginBottom: 20 },
  backCircle: { backgroundColor: '#7E57C2', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  titleBadge: { backgroundColor: '#FCE4EC', flex: 1, marginLeft: 15, paddingVertical: 12, borderRadius: 30, alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#7E57C2' },
  row: { justifyContent: 'space-between', paddingHorizontal: 20 },
  listPadding: { paddingBottom: 30, paddingTop: 10 },
  
  // Updated Styles to match Sample
  card: { width: width * 0.43, marginTop: 20 },
  whiteBox: { 
    backgroundColor: '#FFF', 
    borderRadius: 30, 
    padding: 15, 
    alignItems: 'center', 
    elevation: 5, 
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: { width: '100%', height: 110, marginBottom: 10 },
  cardFooter: { alignItems: 'center' },
  cardText: { fontSize: 18, fontWeight: 'bold', color: '#444', textAlign: 'center' },
  starBadge: { 
    position: 'absolute', 
    top: -10, 
    right: -10, 
    backgroundColor: '#FFF', 
    padding: 5, 
    borderRadius: 20, 
    elevation: 8, 
    borderWidth: 2, 
    borderColor: '#FFD700' 
  }
});