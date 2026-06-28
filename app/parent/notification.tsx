import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Firebase - FIXED PATH BELOW
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'lesson_complete' | 'admin_upload' | 'feedback';
  timestamp: any;
}

export default function NotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    // Fetch notifications for this user OR general admin uploads
    const q = query(
      collection(db, "notifications"),
      where("userId", "in", [userId, "all"]), 
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationItem[];
      setNotifications(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Dynamic Icons based on notification type
  const getIconData = (type: string) => {
    switch (type) {
      case 'lesson_complete': 
        return { name: 'school', color: '#4CAF50', label: 'Completion' };
      case 'admin_upload': 
        return { name: 'cloud-upload', color: '#2196F3', label: 'New Content' };
      case 'feedback': 
        return { name: 'chatbubble-ellipses', color: '#C4A6FB', label: 'Feedback' };
      default: 
        return { name: 'notifications', color: '#B48454', label: 'Alert' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#B48454" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications ✨</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#B48454" /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={80} color="#FFC26D" />
              <Text style={styles.emptyMsg}>No notifications yet!</Text>
            </View>
          }
          renderItem={({ item }) => {
            const icon = getIconData(item.type);
            return (
              <View style={styles.card}>
                <View style={[styles.iconCircle, { backgroundColor: icon.color + '20' }]}>
                   <Ionicons name={icon.name as any} size={24} color={icon.color} />
                </View>
                <View style={styles.textCont}>
                  <View style={styles.row}>
                    <Text style={[styles.typeLabel, { color: icon.color }]}>{icon.label}</Text>
                    <Text style={styles.time}>Just now</Text>
                  </View>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifBody}>{item.message}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40 },
  backBtn: { padding: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#B48454', marginLeft: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyMsg: { fontSize: 18, color: '#B48454', marginTop: 20 },
  
  card: { 
    flexDirection: 'row', 
    backgroundColor: 'white', 
    padding: 18, 
    borderRadius: 25, 
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconCircle: { width: 55, height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  textCont: { flex: 1, marginLeft: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  typeLabel: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  time: { fontSize: 10, color: '#999' },
  notifTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  notifBody: { color: '#666', fontSize: 14, marginTop: 2, lineHeight: 20 }
});