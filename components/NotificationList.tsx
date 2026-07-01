import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../firebaseConfig';

type Role = 'parent' | 'teacher';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  category: string;
  timestamp?: Timestamp;
  isRead?: boolean;
  timeStr?: string;
}

const CATEGORY_THEMES: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  Academic: { icon: 'book', color: '#4A90E2', bg: '#E1F0FF' },
  'Child Progress': { icon: 'trending-up', color: '#8E44AD', bg: '#F3E5F5' },
  Achievements: { icon: 'trophy', color: '#F1C40F', bg: '#FFFDE7' },
  'Teacher Updates': { icon: 'person-circle', color: '#2980B9', bg: '#E1F5FE' },
  Attendance: { icon: 'location', color: '#2ECC71', bg: '#E8F5E9' },
  Communication: { icon: 'chatbubbles', color: '#16A085', bg: '#E0F2F1' },
  'School Updates': { icon: 'school', color: '#E67E22', bg: '#FFF3E0' },
};

export default function NotificationList({ role }: { role: Role }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role) return;
    const q = query(collection(db, 'notifications'), where('role', '==', role), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: NotificationItem[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        const ts = d.timestamp as Timestamp;
        return {
          id: doc.id,
          title: d.title,
          description: d.description,
          category: d.category || 'School Updates',
          timestamp: ts,
          isRead: d.isRead ?? false,
          timeStr: ts ? ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        };
      });
      setNotifications(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return unsubscribe;
  }, [role]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFB347" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#444" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const theme = CATEGORY_THEMES[item.category] || CATEGORY_THEMES['School Updates'];
          return (
            <TouchableOpacity style={[styles.card, !item.isRead && styles.unreadCard]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.bg }]}>
                <Ionicons name={theme.icon} size={22} color={theme.color} />
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Text style={[styles.categoryText, { color: theme.color }]}>{item.category}</Text>
                  <Text style={styles.timeText}>{item.timeStr}</Text>
                </View>
                <Text style={styles.titleText} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.descText} numberOfLines={2}>{item.description}</Text>
              </View>

              {!item.isRead && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={60} color="#DDD" />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>No {role} notifications at the moment.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#8daece' }, // Soft blue-grey background
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 35,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
  },
  backBtn: { backgroundColor: '#F5F5F5', padding: 8, borderRadius: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#2C3E50' },
  list: { padding: 20, paddingBottom: 40 },
  
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 35,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  unreadCard: { borderLeftWidth: 5, borderLeftColor: '#FFB347' }, // Accent for unread
  iconContainer: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  categoryText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  timeText: { fontSize: 11, color: '#999' },
  titleText: { fontSize: 16, fontWeight: '700', color: '#333' },
  descText: { fontSize: 13, color: '#777', marginTop: 2, lineHeight: 18 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFB347', marginLeft: 10 },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 2 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#444' },
  emptySub: { fontSize: 14, color: '#999', marginTop: 5 },
});