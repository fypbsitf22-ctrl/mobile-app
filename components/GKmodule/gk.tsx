import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../firebaseConfig';
import MainHeader from '../MainHeaderShared';

const { width } = Dimensions.get('window');

export default function GKMain({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchCategories = () => {
    setLoading(true);
    setHasError(false);
    const q = query(collection(db, "gk_categories"), orderBy("uploaded", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(data);
      setLoading(false);
    }, (error) => {
      setHasError(true);
      setLoading(false);
    });
    return unsubscribe;
  };

  useEffect(() => {
    const unsub = fetchCategories();
    return () => unsub();
  }, []);

  const handlePress = async (item: any) => {
    const basePath = role === 'parent' ? '/parent/gk' : '/teacher/gk';
    if (item.audio) {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: item.audio });
        await sound.playAsync();
      } catch (error) { console.log("Audio error", error); }
    }
    setTimeout(() => {
      router.push({ 
        pathname: `${basePath}/categorydetail` as any, 
        params: { catId: item.id, title: item.name } 
      });
    }, 500);
  };

  const renderCategory = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => handlePress(item)} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="contain" />
      </View>
      <View style={styles.textWrapper}><Text style={styles.cardText}>{item.name}</Text></View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MainHeader role={role} /> 
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.titleBadge}><Text style={styles.headerTitle}>General Knowledge</Text></View>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#7E57C2" style={{ marginTop: 50 }} />
      ) : hasError ? (
        <View style={{ alignItems: 'center', marginTop: 50 }}>
          <Text style={{ color: '#E87D88', fontSize: 18, marginBottom: 10 }}>Unable to load topics</Text>
          <TouchableOpacity style={styles.backCircle} onPress={fetchCategories}><Ionicons name="refresh" size={24} color="#FFF" /></TouchableOpacity>
        </View>
      ) : (
        <FlatList data={categories} keyExtractor={item => item.id} numColumns={2} renderItem={renderCategory} columnWrapperStyle={styles.row} contentContainerStyle={styles.listPadding} showsVerticalScrollIndicator={false} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 15, marginBottom: 10 },
  backCircle: { backgroundColor: '#7E57C2', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  titleBadge: { backgroundColor: '#FCE4EC', flex: 1, marginLeft: 15, paddingVertical: 12, borderRadius: 30, alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#7E57C2' },
  row: { justifyContent: 'space-between', paddingHorizontal: 20 },
  listPadding: { paddingBottom: 30 },
  card: { backgroundColor: '#FCE4EC', width: width * 0.42, borderRadius: 35, padding: 15, alignItems: 'center', marginBottom: 20, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5 },
  imageContainer: { backgroundColor: '#FFF', width: '90%', height: width * 0.28, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardImage: { width: '75%', height: '75%' },
  textWrapper: { paddingHorizontal: 15, paddingVertical: 5, width: '100%' },
  cardText: { fontSize: 18, fontWeight: 'bold', color: '#E87D88', textAlign: 'center' }
});