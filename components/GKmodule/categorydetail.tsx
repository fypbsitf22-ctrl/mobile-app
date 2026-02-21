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

  useEffect(() => {
    if (!catId) return;
    const q = query(collection(db, "gk_items"), where("categoryID", "==", catId), orderBy("uploaded", "desc"));
    const unsubItems = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const user = auth.currentUser;
    // FETCH for BOTH roles so Teacher UI shows checkmarks if they exist
    if (user) {
      const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) setCompletedIds(docSnap.data().completedLessons || []);
      });
      return () => { unsubItems(); unsubUser(); };
    }
    return () => unsubItems();
  }, [catId]);

  const handleItemPress = async (item: any, index: number) => {
    const basePath = role === 'parent' ? '/parent/gk' : '/teacher/gk';
    if (item.audio) {
      try { const { sound } = await Audio.Sound.createAsync({ uri: item.audio }); await sound.playAsync(); } catch (e) {}
    }
    router.push({ pathname: `${basePath}/learningcard` as any, params: { catId, startIndex: index, itemId: item.id } });
  };

  const renderItem = ({ item, index }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => handleItemPress(item, index)}>
      <View style={styles.imageContainer}><Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="contain" /></View>
      <View style={styles.textWrapper}>
        <View style={styles.nameRow}>
          <Text style={styles.cardText}>{item.name}</Text>
          {completedIds.includes(item.id) && <Ionicons name="checkmark-circle" size={18} color="#4CAF50" style={{ marginLeft: 5 }} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MainHeader role={role} />
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}><Ionicons name="arrow-back" size={28} color="#FFF" /></TouchableOpacity>
        <View style={styles.titleBadge}><Text style={styles.headerTitle}>{title}</Text></View>
      </View>
      {loading ? <ActivityIndicator size="large" color="#7E57C2" style={{ marginTop: 50 }} /> : (
        <FlatList data={items} numColumns={2} keyExtractor={(item) => item.id} renderItem={renderItem} columnWrapperStyle={styles.row} contentContainerStyle={styles.listPadding} showsVerticalScrollIndicator={false} />
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
  listPadding: { paddingBottom: 30 },
  card: { backgroundColor: '#FCE4EC', width: width * 0.42, borderRadius: 35, padding: 15, alignItems: 'center', marginBottom: 20, elevation: 6 },
  imageContainer: { backgroundColor: '#FFF', width: '90%', height: width * 0.28, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardImage: { width: '75%', height: '75%' },
  textWrapper: { paddingHorizontal: 15, paddingVertical: 5, width: '100%' },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  cardText: { fontSize: 18, fontWeight: 'bold', color: '#E87D88', textAlign: 'center' }
});