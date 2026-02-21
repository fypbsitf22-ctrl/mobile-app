import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../firebaseConfig';
import MainHeader from '../MainHeaderShared';

const { width } = Dimensions.get('window');

interface ListProps {
  role: 'parent' | 'teacher';
}

export default function AcademicContentList({ role }: ListProps) {
  const router = useRouter();
  const { grade, subject, type } = useLocalSearchParams();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!grade || !subject || !type) return;
    const q = query(
        collection(db, "academic_lessons", `${grade}_section`, subject as string), 
        where("type", "==", type), 
        orderBy("order", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLessons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [grade, subject, type]);

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader role={role} />
      <View style={styles.headerRow}>
        {/* MODIFIED: Back button now explicitly routes to learningtype */}
        <TouchableOpacity 
          onPress={() => router.push({
            pathname: (role === 'parent' ? '/parent/academic/learningtype' : '/teacher/academic/learningtype') as any,
            params: { grade, subject }
          })} 
          style={styles.backCircle}
        >
            <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.titleBadge}>
            <Text style={styles.headerTitle}>{subject} {type}</Text>
        </View>
      </View>

      {loading ? <ActivityIndicator size="large" color="#A2D2FF" style={{marginTop: 50}} /> : (
        <FlatList 
          data={lessons} 
          numColumns={2} 
          renderItem={({item}) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push({
              pathname: (role === 'parent' ? '/parent/academic/academicplayer' : '/teacher/academic/academicplayer') as any,
              params: { lessonId: item.id, type, grade, subject }
            })}>
              <View style={styles.imageContainer}>
                {item.image ? <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="contain" /> : <Ionicons name="book-outline" size={50} color="#A2D2FF" />}
              </View>
              <Text style={styles.cardText}>{item.title}</Text>
              <View style={styles.startButton}>
                <Text style={styles.startBtnText}>{role === 'teacher' ? 'View' : 'Start'}</Text>
              </View>
            </TouchableOpacity>
          )} 
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
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 15 },
  backCircle: { backgroundColor: '#A2D2FF', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  titleBadge: { backgroundColor: '#D4E9FF', flex: 1, marginLeft: 15, paddingVertical: 12, borderRadius: 30, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#5A9BD5' },
  row: { justifyContent: 'space-between', paddingHorizontal: 20 },
  card: { backgroundColor: '#FFF', width: width * 0.43, borderRadius: 30, padding: 15, alignItems: 'center', marginTop: 20, elevation: 5 },
  imageContainer: { width: '100%', height: 100, justifyContent: 'center', alignItems: 'center' },
  cardImage: { width: '100%', height: '100%' },
  cardText: { fontSize: 18, fontWeight: 'bold', color: '#444', textAlign: 'center', marginVertical: 10 },
  startButton: { backgroundColor: '#A2D2FF', paddingVertical: 5, paddingHorizontal: 15, borderRadius: 15 },
  startBtnText: { color: '#FFF', fontWeight: 'bold' },
});