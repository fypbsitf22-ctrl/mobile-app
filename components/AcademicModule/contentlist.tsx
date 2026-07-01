import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore'; // Added doc
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig'; // Added auth
import MainHeader from '../MainHeaderShared';

const { width } = Dimensions.get('window');

interface ListProps {
  role: 'parent' | 'teacher';
}

export default function AcademicContentList({ role }: ListProps) {
  const router = useRouter();
  const { grade, subject, type } = useLocalSearchParams();
  const [lessons, setLessons] = useState<any[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]); // New State
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!grade || !subject || !type) return;
    
    // Fetch Lessons
    const q = query(
        collection(db, "academic_lessons", `${grade}_section`, subject as string), 
        where("type", "==", type), 
        orderBy("order", "asc")
    );
    const unsubscribeLessons = onSnapshot(q, (snapshot) => {
      setLessons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Fetch Completed Lessons from User Profile
    const user = auth.currentUser;
    let unsubscribeUser = () => {};
    if (user) {
      unsubscribeUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setCompletedIds(docSnap.data().completedLessons || []);
        }
      });
    }

    return () => {
        unsubscribeLessons();
        unsubscribeUser();
    };
  }, [grade, subject, type]);

  const renderLesson = ({ item }: any) => {
    const isCompleted = completedIds.includes(item.id); // Check completion

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => router.push({
          pathname: (role === 'parent' ? '/parent/academic/academicplayer' : '/teacher/academic/academicplayer') as any,
          params: { lessonId: item.id, type, grade, subject }
        })}
      >
        <View style={styles.whiteBox}>
          {/* STAR BADGE - Only shows if lesson is completed */}
          {isCompleted && (
            <View style={styles.starBadge}>
              <Ionicons name="star" size={20} color="#FFD700" />
            </View>
          )}

          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="contain" />
          ) : (
            <View style={[styles.cardImage, { justifyContent: 'center', alignItems: 'center' }]}>
               <Ionicons name="book-outline" size={50} color="#A2D2FF" />
            </View>
          )}
          <View style={styles.cardFooter}>
            <Text style={styles.cardText} numberOfLines={1}>{item.title}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader role={role} />
      
      <View style={styles.titleRow}>
        <TouchableOpacity 
          onPress={() => router.push({
            pathname: (role === 'parent' ? '/parent/academic/academic' : '/teacher/academic/academic') as any,
            params: { grade, subject, type }
          })} 
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={30} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCard}>
          <Text style={styles.headerText}>{subject} {type}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
           <ActivityIndicator size="large" color="#C4A6FB" />
           <Text style={{marginTop: 10, color: '#888'}}>Finding Lessons...</Text>
        </View>
      ) : (
        <FlatList 
          data={lessons} 
          numColumns={2} 
          renderItem={renderLesson} 
          keyExtractor={item => item.id} 
          columnWrapperStyle={styles.row} 
          contentContainerStyle={{ paddingBottom: 30, paddingTop: 10 }}
          ListEmptyComponent={
            <View style={styles.center}>
               <Text style={styles.emptyText}>No lessons found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  backBtn: { backgroundColor: '#C4A6FB', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  headerCard: { flex: 1, backgroundColor: '#F3EFFF', padding: 15, borderRadius: 25, alignItems: 'center', marginLeft: 15 },
  headerText: { fontSize: 22, fontWeight: 'bold', color: '#6B46C1' },
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
  cardImage: { width: '100%', height: 110, marginBottom: 10 },
  cardFooter: { alignItems: 'center' },
  cardText: { fontSize: 18, fontWeight: 'bold', color: '#444', textAlign: 'center' },
  emptyText: { fontSize: 18, color: '#888', fontWeight: 'bold' },
  
  // Star Badge Style from Sample Code
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