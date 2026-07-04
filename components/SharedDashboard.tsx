import { useRouter } from 'expo-router';
import { arrayUnion, doc, getDoc, setDoc } from 'firebase/firestore';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Send,
  User
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../firebaseConfig';
import { firebaseService } from '../services/firebaseService';

const { width } = Dimensions.get('window');

type UserRole = 'parent' | 'teacher';

export default function SharedDashboard({ userRole, userId }: { userRole: UserRole, userId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [profileName, setProfileName] = useState<string>("User"); 
  const [activeStudent, setActiveStudent] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [incompleteExpanded, setIncompleteExpanded] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const initializeDashboard = async () => {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfileName(userSnap.data().name || "User");
        }

        const unsubscribe = firebaseService.subscribeToStudentDashboard(
          userRole,
          userId, 
          (fetched) => {
            setData(fetched || []);
            setIsLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (err) {
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, [userId, userRole]);

  const getWeeklyStats = (history: any[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    if (history) {
      history.forEach(item => {
        const date = new Date(item.completedAt);
        const day = date.getDay(); 
        const index = day === 0 ? 6 : day - 1; 
        counts[index]++;
      });
    }
    const max = Math.max(...counts, 5); 
    return { days, counts, max };
  };

  const handleSendMessage = async () => {
    const student = activeStudent || (data.length > 0 ? data[0] : null);
    if (!student || !student.id) return;
    if (!feedbackText.trim()) return;

    try {
      const studentRef = doc(db, "students", student.id);
      await setDoc(studentRef, {
        communications: arrayUnion({
          sender: profileName,
          date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          content: feedbackText,
          type: 'feedback'
        })
      }, { merge: true });
      setFeedbackText(""); 
    } catch (err) { console.error(err); }
  };

  const renderProgressDetail = (student: any, onBackToList?: () => void) => {
    const displayStudent = student || { name: "Student", grade: "N/A" };
    const { days, counts, max } = getWeeklyStats(student?.history);

    const historyData = student?.history || [];
    const visibleHistory = historyExpanded ? historyData : historyData.slice(0, 5);
    const incompleteData = student?.incomplete || [];
    const visibleIncomplete = incompleteExpanded ? incompleteData : incompleteData.slice(0, 5);

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.detailHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Logic: If teacher, go back to list. If parent, go back to main menu */}
            <TouchableOpacity 
                onPress={onBackToList ? onBackToList : () => router.back()} 
                style={styles.backButton}
            >
                <ArrowLeft size={24} color="#1e293b" />
            </TouchableOpacity>
            <View>
                <Text style={styles.welcomeSmall}>Report for {displayStudent.name}</Text>
                <Text style={styles.detailTitle}>{profileName}'s Panel</Text>
            </View>
          </View>
        </View>

      <View style={styles.chartSection}>
        <Text style={styles.sectionHeading}>Weekly Performance</Text>
        <View style={styles.chartContainer}>
            {counts.map((val, i) => (
                <View key={i} style={styles.barWrapper}>
                <View style={[styles.bar, { height: (val / max) * 100 + 5, backgroundColor: val > 0 ? '#6366f1' : '#e2e8f0' }]} />
                <Text style={styles.barLabel}>{days[i]}</Text>
                </View>
            ))}
        </View>
      </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#eef2ff' }]}>
            <Text style={styles.statNum}>{student?.history?.length || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fff7ed' }]}>
            <Text style={styles.statNum}>{student?.incomplete?.length || 0}</Text>
            <Text style={styles.statLabel}>Incomplete</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Lesson History</Text>
          {visibleHistory.map((h: any, i: number) => (
            <View key={i} style={styles.historyItem}>
              <View><Text style={styles.modTag}>{h.subject}</Text><Text style={styles.lesName}>{h.lessonName}</Text></View>
              <View style={styles.timerContainer}><Clock size={12} color="#10b981" style={{marginRight: 4}}/><Text style={styles.lesTimer}>{h.timeSpent}</Text></View>
            </View>
          ))}
          {historyData.length > 5 && (
            <TouchableOpacity style={styles.seeMoreBtn} onPress={() => setHistoryExpanded(!historyExpanded)}>
              <Text style={styles.seeMoreText}>{historyExpanded ? "See Less" : "See More"}</Text>
              {historyExpanded ? <ChevronUp size={16} color="#6366f1" /> : <ChevronDown size={16} color="#6366f1" />}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: '#f59e0b' }]}>Incomplete </Text>
          {visibleIncomplete.map((inc: any, i: number) => (
            <View key={i} style={styles.incItem}>
              <View><Text style={styles.modTag}>{inc.subject}</Text><Text style={styles.lesName}>{inc.lessonName}</Text></View>
              <Text style={styles.timerText}>{inc.currentTimer}</Text>
            </View>
          ))}
          {incompleteData.length > 5 && (
            <TouchableOpacity style={styles.seeMoreBtn} onPress={() => setIncompleteExpanded(!incompleteExpanded)}>
              <Text style={[styles.seeMoreText, { color: '#f59e0b' }]}>{incompleteExpanded ? "See Less" : "See More"}</Text>
              {incompleteExpanded ? <ChevronUp size={16} color="#f59e0b" /> : <ChevronDown size={16} color="#f59e0b" />}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: '#3b82f6' }]}>Feedback & Inbox</Text>
          <View style={styles.inputRow}>
            <TextInput style={styles.input} placeholder="Send a message..." value={feedbackText} onChangeText={setFeedbackText} multiline />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}><Send size={18} color="#fff" /></TouchableOpacity>
          </View>
          {student?.communications?.map((c: any, i: number) => (
            <View key={i} style={[styles.msgCard, c.type === 'feedback' ? styles.msgBlue : styles.msgGray]}>
              <Text style={styles.msgSender}>{c.sender} • {c.date}</Text>
              <Text style={styles.msgContent}>{c.content}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  if (isLoading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></SafeAreaView>;
  }

  // Teacher Main List View
  if (userRole === 'teacher' && !activeStudent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.welcomeHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#1e293b" />
            </TouchableOpacity>
            <View>
                <Text style={styles.welcomeSmall}>Hello, {profileName} 👋</Text>
                <Text style={styles.helloText}>Teacher Dashboard</Text>
            </View>
          </View>
          <View style={styles.avatarCircle}><User color="#fff" /></View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.sectionHeading}>My Registered Students ({data.length})</Text>
          <View style={styles.grid}>
            {data.length > 0 ? data.map(s => (
              <TouchableOpacity key={s.id} style={styles.studentCard} onPress={() => setActiveStudent(s)}>
                <View style={styles.cardInitialBox}><Text style={styles.cardInitial}>{s.name ? s.name[0] : "S"}</Text></View>
                <Text style={styles.cardName}>{s.name || "Student"}</Text>
                <Text style={styles.cardGrade}>{s.grade || "Grade N/A"}</Text>
                <View style={styles.viewBadge}><Text style={styles.viewText}>View Progress</Text></View>
              </TouchableOpacity>
            )) : (
              <View style={styles.emptyState}>
                <User size={50} color="#e2e8f0" />
                <Text style={styles.emptyText}>No students joined yet. Code: {userId}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Progress Detail View (Parents or Teacher looking at specific student)
  return (
    <SafeAreaView style={styles.container}>
      {renderProgressDetail(
        activeStudent || data[0],
        userRole === 'teacher' ? () => setActiveStudent(null) : undefined
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 45, backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 4 },
  helloText: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  welcomeSmall: { color: '#6366f1', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  avatarCircle: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  backButton: { marginRight: 15, padding: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  studentCard: { width: (width / 2) - 30, backgroundColor: '#fff', padding: 20, borderRadius: 25, alignItems: 'center', marginBottom: 20, elevation: 3 },
  cardInitialBox: { backgroundColor: '#eef2ff', width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardInitial: { fontSize: 28, fontWeight: 'bold', color: '#6366f1' },
  cardName: { fontWeight: 'bold', fontSize: 16, color: '#1e293b', textAlign: 'center' },
  cardGrade: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  viewBadge: { marginTop: 12, backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  viewText: { fontSize: 10, color: '#10b981', fontWeight: 'bold' },
  detailHeader: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', padding: 20, paddingTop: 40 },
  detailTitle: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  chartSection: { backgroundColor: '#fff', marginHorizontal: 20, padding: 20, borderRadius: 25, marginBottom: 20, elevation: 1 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingHorizontal: 10, marginBottom: 10 },
  barWrapper: { alignItems: 'center', flex: 1 },
  bar: { width: 12, borderRadius: 6, marginBottom: 5 },
  barLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: 15, paddingHorizontal: 20, marginBottom: 20 },
  statCard: { flex: 1, padding: 20, borderRadius: 20, alignItems: 'center', elevation: 1 },
  statNum: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
  section: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 25, padding: 20, marginBottom: 20, elevation: 1 },
  sectionHeading: { fontSize: 14, fontWeight: '900', marginBottom: 15, letterSpacing: 1, color: '#1e293b' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 15, padding: 10, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  input: { flex: 1, paddingHorizontal: 10, fontSize: 14, color: '#1e293b' },
  sendBtn: { backgroundColor: '#6366f1', padding: 10, borderRadius: 12, marginLeft: 10 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  timerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  modTag: { fontSize: 9, fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase' },
  lesName: { fontSize: 15, fontWeight: 'bold', color: '#334155' },
  lesTimer: { fontWeight: '900', color: '#10b981', fontSize: 12 },
  incItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#fff7ed', borderRadius: 15, marginBottom: 10 },
  timerText: { color: '#f59e0b', fontWeight: 'bold', fontFamily: 'monospace' },
  msgCard: { padding: 15, borderRadius: 15, marginBottom: 10 },
  msgBlue: { backgroundColor: '#eff6ff', borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  msgGray: { backgroundColor: '#f8fafc' },
  msgSender: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  msgContent: { fontSize: 13, color: '#334155', marginTop: 5, lineHeight: 18 },
  seeMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 15, marginTop: 5, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  seeMoreText: { fontSize: 13, fontWeight: 'bold', color: '#6366f1', marginRight: 5 },
  emptyState: { alignItems: 'center', padding: 40, width: '100%' },
  emptyText: { color: '#94a3b8', fontSize: 14, marginTop: 10, textAlign: 'center' },
});