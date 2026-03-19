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

  // Helper function for the audio delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    // Audio Logic from Sample
    if (item.audio) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: item.audio },
          { shouldPlay: true }
        );
        await delay(1200); 
        await sound.unloadAsync();
      } catch (error) { 
        console.log("Audio error", error); 
      }
    } else {
      await delay(200);
    }

    const basePath = role === 'parent' ? '/parent/gk' : '/teacher/gk';
    router.push({ 
      pathname: `${basePath}/categorydetail` as any, 
      params: { catId: item.id, title: item.name } 
    });
  };

  const renderCategory = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => handlePress(item)} activeOpacity={0.8}>
      <View style={styles.whiteBox}>
        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="contain" />
        <View style={styles.cardFooter}>
          <Text style={styles.cardText} numberOfLines={1}>{item.name}</Text>
        </View>
      </View>
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
        <FlatList 
          data={categories} 
          keyExtractor={item => item.id} 
          numColumns={2} 
          renderItem={renderCategory} 
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
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 15, marginBottom: 10 },
  backCircle: { backgroundColor: '#7E57C2', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  titleBadge: { backgroundColor: '#FCE4EC', flex: 1, marginLeft: 15, paddingVertical: 12, borderRadius: 30, alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#7E57C2' },
  row: { justifyContent: 'space-between', paddingHorizontal: 20 },
  listPadding: { paddingBottom: 30, paddingTop: 10 },
  
  // Card styles modified to match sample code exactly
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
  cardText: { fontSize: 18, fontWeight: 'bold', color: '#444', textAlign: 'center' }
});