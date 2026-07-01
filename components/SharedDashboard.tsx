import { useRouter } from 'expo-router';
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  MessageSquare,
  Settings,
  TrendingUp,
  Users
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// --- 1. DEFINE TYPES (These fix the red errors on lines 35 and 39) ---
export type UserRole = 'parent' | 'teacher';

interface DashboardStat {
  label: string;
  value: string;
  icon: any;
  color: string;
}

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  location: string;
  type: 'class' | 'meeting' | 'event';
}

interface DashboardData {
  userName: string;
  stats: DashboardStat[];
  schedule: ScheduleItem[];
  performance: { label: string; score: number }[];
  announcements: { id: string; title: string; date: string; preview: string }[];
}

const { width } = Dimensions.get('window');

// --- 2. MOCK DATA FUNCTION (Fixes red error on line 44) ---
const getMockData = (role: UserRole): DashboardData => ({
  userName: role === 'parent' ? "Mr. Thompson" : "Sarah Jenkins",
  stats: role === 'parent' ? [
    { label: 'Attendance', value: '98%', icon: CheckCircle, color: '#10B981' },
    { label: 'Avg Grade', value: 'A-', icon: TrendingUp, color: '#3B82F6' },
    { label: 'Rank', value: '4/32', icon: Award, color: '#F59E0B' },
  ] : [
    { label: 'Students', value: '124', icon: Users, color: '#3B82F6' },
    { label: 'Attendance', value: '92%', icon: CheckCircle, color: '#10B981' },
    { label: 'To Grade', value: '12', icon: FileText, color: '#EF4444' },
  ],
  schedule: [
    { id: '1', title: role === 'parent' ? 'Mathematics Class' : '10th Grade Math', time: '08:30 AM', location: 'Room 204', type: 'class' },
    { id: '2', title: 'Parent-Teacher Meet', time: '02:00 PM', location: 'Conference Hall', type: 'meeting' },
  ],
  performance: [
    { label: 'Math', score: 92 },
    { label: 'Science', score: 85 },
    { label: 'English', score: 78 },
    { label: 'History', score: 88 },
  ],
  announcements: [
    { id: 'a1', title: 'Science Fair 2024', date: 'Oct 15', preview: 'Registration for the annual science fair is now open...' },
    { id: 'a2', title: 'Winter Break', date: 'Oct 12', preview: 'School will remain closed from Dec 20 to Jan 5.' },
  ]
});

// --- 3. HELPER COMPONENTS ---
const SectionTitle = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const ActionItem = ({ icon: Icon, label, color }: any) => (
  <TouchableOpacity style={styles.actionItem}>
    <View style={[styles.actionIcon, { backgroundColor: `${color}10` }]}>
      <Icon size={24} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

// --- 4. MAIN COMPONENT ---
export default function SharedDashboard({ userRole }: { userRole: UserRole }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);

  const loadData = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setData(getMockData(userRole));
      setLoading(false);
      setRefreshing(false);
    }, 1200);
  };

  useEffect(() => {
    loadData();
  }, [userRole]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: 20 }}>
          <View style={[styles.skeleton, { height: 40, width: '60%', marginBottom: 20 }]} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={[styles.skeleton, { height: 100, width: '30%', borderRadius: 15 }]} />
            <View style={[styles.skeleton, { height: 100, width: '30%', borderRadius: 15 }]} />
            <View style={[styles.skeleton, { height: 100, width: '30%', borderRadius: 15 }]} />
          </View>
          <View style={[styles.skeleton, { height: 180, width: '100%', marginTop: 25, borderRadius: 20 }]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome Back,</Text>
          <Text style={styles.userName}>{data?.userName} 👋</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationBtn}
          onPress={() => router.push(`/${userRole}/notifications` as any)}
        >
          <Bell size={22} color="#1E293B" />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={['#3B82F6']} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          {data?.stats.map((item, idx) => (
            <View key={idx} style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: `${item.color}15` }]}>
                <item.icon size={20} color={item.color} />
              </View>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <ActionItem icon={BookOpen} label="Courses" color="#4F46E5" />
          <ActionItem icon={MessageSquare} label="Chat" color="#10B981" />
          <ActionItem icon={Calendar} label="Events" color="#F59E0B" />
          <ActionItem icon={Settings} label="Setup" color="#64748B" />
        </View>

        <SectionTitle title="Today's Schedule" />
        {data?.schedule.map((item) => (
          <View key={item.id} style={styles.scheduleItem}>
            <View style={[styles.scheduleIndicator, { backgroundColor: item.type === 'meeting' ? '#F59E0B' : '#3B82F6' }]} />
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.scheduleTitle}>{item.title}</Text>
              <View style={styles.scheduleMeta}>
                <Clock size={14} color="#94A3B8" />
                <Text style={styles.metaText}>{item.time}</Text>
                <MapPin size={14} color="#94A3B8" style={{ marginLeft: 10 }} />
                <Text style={styles.metaText}>{item.location}</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#CBD5E1" />
          </View>
        ))}

        <SectionTitle title={userRole === 'parent' ? "Academic Progress" : "Class Average"} />
        <View style={styles.card}>
          {data?.performance.map((item, idx) => (
            <View key={idx} style={styles.progressRow}>
              <Text style={styles.progressLabel}>{item.label}</Text>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${item.score}%` }]} />
              </View>
              <Text style={styles.progressValue}>{item.score}%</Text>
            </View>
          ))}
        </View>

        <SectionTitle title="Announcements" />
        <FlatList
          horizontal
          data={data?.announcements}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.announcementCard}>
              <Text style={styles.announcementTitle}>{item.title}</Text>
              <Text style={styles.announcementDate}>{item.date}</Text>
              <Text style={styles.announcementText} numberOfLines={2}>{item.preview}</Text>
            </View>
          )}
        />
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- 5. STYLES (Fixes all red errors on lines 57-65) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  skeleton: { backgroundColor: '#E2E8F0', borderRadius: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', alignItems: 'center' },
  greeting: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
  notificationBtn: { padding: 10, backgroundColor: '#F1F5F9', borderRadius: 12 },
  notifBadge: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFF' },
  scrollContainer: { paddingHorizontal: 20 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 },
  statCard: { backgroundColor: '#FFF', width: (width - 60) / 3, padding: 15, borderRadius: 16, alignItems: 'center', elevation: 2, shadowOpacity: 0.05, shadowColor: '#000', shadowOffset: { width: 0, height: 2 } },
  statIconWrapper: { padding: 8, borderRadius: 10, marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  statLabel: { fontSize: 11, color: '#64748B' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 25 },
  actionItem: { alignItems: 'center' },
  actionIcon: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 15, marginTop: 10 },
  scheduleItem: { backgroundColor: '#FFF', padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  scheduleIndicator: { width: 4, height: 35, borderRadius: 2 },
  scheduleTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  scheduleMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 12, color: '#94A3B8', marginLeft: 4 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  progressLabel: { width: 60, fontSize: 13, color: '#64748B' },
  progressBg: { flex: 1, height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, marginHorizontal: 10 },
  progressFill: { height: 8, backgroundColor: '#3B82F6', borderRadius: 4 },
  progressValue: { width: 35, fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  announcementCard: { backgroundColor: '#FFF', width: width * 0.7, padding: 15, borderRadius: 16, marginRight: 15, borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
  announcementTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  announcementDate: { fontSize: 11, color: '#94A3B8', marginVertical: 4 },
  announcementText: { fontSize: 12, color: '#64748B' },
});