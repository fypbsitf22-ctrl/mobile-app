import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../firebaseConfig';
import MainHeader from '../MainHeaderShared';

const { width } = Dimensions.get('window');

export default function IslamicMain({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "islamic_categories"), orderBy("uploaded", "desc"));
    return onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
  }, []);

  const handlePress = async (item: any) => {
    const basePath = role === 'parent' ? '/parent/islamic' : '/teacher/islamic';
    if (item.name === "Namaz" || item.name === "Wudu") {
      const q = query(collection(db, "islamic_items"), where("categoryID", "==", item.id));
      const snap = await getDocs(q);
      if (!snap.empty) { router.push({ pathname: `${basePath}/islamicitems` as any, params: { itemId: snap.docs[0].id, title: item.name } }); }
    } else {
      router.push({ pathname: `${basePath}/islamicsubcategories` as any, params: { catId: item.id, title: item.name } });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MainHeader role={role} /> 
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}><Ionicons name="arrow-back" size={28} color="#FFF" /></TouchableOpacity>
        <View style={styles.titleBadge}><Text style={styles.headerTitle}>Islamic Learning</Text></View>
      </View>
      {loading ? <ActivityIndicator size="large" color="#A2D2FF" /> : (
        <FlatList data={categories} numColumns={2} renderItem={({item}) => (
          <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
            <View style={styles.imageContainer}><Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="contain" /></View>
            <Text style={styles.cardText}>{item.name}</Text>
          </TouchableOpacity>
        )} keyExtractor={item => item.id} columnWrapperStyle={styles.row} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 15 },
  backCircle: { backgroundColor: '#A2D2FF', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  titleBadge: { backgroundColor: '#D4E9FF', flex: 1, marginLeft: 15, paddingVertical: 12, borderRadius: 30, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#5A9BD5' },
  row: { justifyContent: 'space-between', paddingHorizontal: 20 },
  card: { backgroundColor: '#D4E9FF', width: width * 0.43, borderRadius: 35, padding: 15, alignItems: 'center', marginTop: 20, elevation: 6 },
  imageContainer: { backgroundColor: '#FFF', width: '90%', height: width * 0.28, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardImage: { width: '75%', height: '75%' },
  cardText: { fontSize: 18, fontWeight: 'bold', color: '#5A9BD5', textAlign: 'center' }
});