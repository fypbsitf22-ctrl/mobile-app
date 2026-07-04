import { arrayUnion, doc, getDoc, setDoc } from 'firebase/firestore';
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  ChevronRight,
  Clock,
  Send, // Added for feedback
  User
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput, // Added for typing messages
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
  
  // State for typing new feedback
  const [feedbackText, setFeedbackText] = useState("");

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfileName(userSnap.data().name || "User");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    const unsubscribe = firebaseService.subscribeToStudentDashboard(
      userRole,
      userId,
      (fetched) => {
        setData(fetched || []);
        setIsLoading(false);
      }
    );

    fetchProfile();
    return () => unsubscribe();
  }, [userId, userRole]);

  // --- Logic to calculate Weekly Performance ---
  const getWeeklyStats = (history: any[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    if (history) {
      history.forEach(item => {
        const date = new Date(item.completedAt);
        const day = date.getDay(); // 0 is Sunday
        const index = day === 0 ? 6 : day - 1; // Convert to Mon=0, Sun=6
        counts[index]++;
      });
    }
    const max = Math.max(...counts, 5); // Base scale of 5
    return { days, counts, max };
  };

  // --- Function to Send Feedback ---
  const handleSendMessage = async () => {
    const student = activeStudent || (data.length > 0 ? data[0] : null);
    if (!student || !student.id) {
        Alert.alert("Note", "Please finish a lesson in the student app first to link the profile.");
        return;
    }
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

      setFeedbackText(""); // Clear input
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const renderProgressDetail = (student: any, onBack?: () => void) => {
    const displayStudent = student || { name: "Student", grade: "Pre-K" };
    const { days, counts, max } = getWeeklyStats(student?.history);

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.detailHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {onBack && (
              <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <ArrowLeft size={24} color="#1e293b" />
              </TouchableOpacity>
            )}
            <View>
                <Text style={styles.welcomeSmall}>Report for {displayStudent.name}</Text>
                <Text style={styles.detailTitle}>{profileName}'s Panel</Text>
            </View>
          </View>
          <TouchableOpacity><Bell size={24} color="#6366f1" /></TouchableOpacity>
        </View>

        {/* 5. Dynamic Weekly Performance Chart */}
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
           <Text style={styles.placeholderText}>Progress updates live as lessons finish</Text>
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
          {student?.history?.length > 0 ? student.history.map((h: any, i: number) => (
            <View key={i} style={styles.historyItem}>
              <View>
                <Text style={styles.modTag}>{h.subject}</Text>
                <Text style={styles.lesName}>{h.lessonName}</Text>
              </View>
              <View style={styles.timerContainer}>
                <Clock size={12} color="#10b981" style={{marginRight: 4}}/>
                <Text style={styles.lesTimer}>{h.timeSpent}</Text>
              </View>
            </View>
          )) : (
             <View style={styles.emptyState}>
               <CheckCircle size={30} color="#f1f5f9" />
               <Text style={styles.emptyText}>No lessons completed yet.</Text>
             </View>
          )}
        </View>

        {/* 2. Incomplete Lessons */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: '#f59e0b' }]}>Incomplete </Text>
          {student?.incomplete?.length > 0 ? student.incomplete.map((inc: any, i: number) => (
            <View key={i} style={styles.incItem}>
              <View>
                <Text style={styles.modTag}>{inc.subject}</Text>
                <Text style={styles.lesName}>{inc.lessonName}</Text>
              </View>
              <Text style={styles.timerText}>{inc.currentTimer}</Text>
            </View>
          )) : <Text style={styles.emptyText}>No active incomplete modules.</Text>}
        </View>

        {/* 4. Feedback & Inbox (Input Added Here) */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: '#3b82f6' }]}>Feedback & Inbox</Text>
          
          {/* New Input Row */}
          <View style={styles.inputRow}>
            <TextInput 
              style={styles.input}
              placeholder="Send a message to student..."
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
              <Send size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {student?.communications?.length > 0 ? student.communications.map((c: any, i: number) => (
            <View key={i} style={[styles.msgCard, c.type === 'feedback' ? styles.msgBlue : styles.msgGray]}>
              <Text style={styles.msgSender}>{c.sender} • {c.date}</Text>
              <Text style={styles.msgContent}>{c.content}</Text>
            </View>
          )) : <Text style={styles.emptyText}>Inbox is currently empty.</Text>}
        </View>
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Syncing Database...</Text>
      </SafeAreaView>
    );
  }

  if (userRole === 'teacher' && !activeStudent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.welcomeSmall}>Hello, {profileName} 👋</Text>
            <Text style={styles.helloText}>Teacher Dashboard</Text>
          </View>
          <View style={styles.avatarCircle}><User color="#fff" /></View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.sectionHeading}>Registered Students ({data.length})</Text>
          <View style={styles.grid}>
            {data.length > 0 ? data.map(s => (
              <TouchableOpacity key={s.id} style={styles.studentCard} onPress={() => setActiveStudent(s)}>
                <Text style={styles.cardInitial}>{s.name[0]}</Text>
                <Text style={styles.cardName}>{s.name}</Text>
                <Text style={styles.cardGrade}>{s.grade}</Text>
                <ChevronRight size={16} color="#6366f1" style={{ marginTop: 10 }} />
              </TouchableOpacity>
            )) : <Text style={styles.emptyText}>No students linked to your teacher account.</Text>}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
  loadingText: { marginTop: 10, fontWeight: 'bold', color: '#6366f1' },
  welcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, paddingTop: 45, backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 4 },
  helloText: { fontSize: 26, fontWeight: '900', color: '#1e293b' },
  welcomeSmall: { color: '#6366f1', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  avatarCircle: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  studentCard: { width: (width / 2) - 30, backgroundColor: '#fff', padding: 20, borderRadius: 25, alignItems: 'center', marginBottom: 20, elevation: 3 },
  cardInitial: { fontSize: 24, fontWeight: 'bold', color: '#6366f1', backgroundColor: '#eef2ff', width: 50, height: 50, textAlign: 'center', lineHeight: 50, borderRadius: 15, marginBottom: 10 },
  cardName: { fontWeight: 'bold', fontSize: 16, color: '#1e293b' },
  cardGrade: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40 },
  detailTitle: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  backBtn: { marginRight: 15 },
  chartSection: { backgroundColor: '#fff', marginHorizontal: 20, padding: 20, borderRadius: 25, marginBottom: 20, elevation: 1 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingHorizontal: 10, marginBottom: 10 },
  barWrapper: { alignItems: 'center', flex: 1 },
  bar: { width: 12, borderRadius: 6, marginBottom: 5 },
  barLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
  placeholderText: { fontSize: 10, color: '#94a3b8', marginTop: 10, fontStyle: 'italic', textAlign: 'center' },
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
  emptyState: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#94a3b8', fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
  incItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#fff7ed', borderRadius: 15, marginBottom: 10 },
  timerText: { color: '#f59e0b', fontWeight: 'bold', fontFamily: 'monospace' },
  msgCard: { padding: 15, borderRadius: 15, marginBottom: 10 },
  msgBlue: { backgroundColor: '#eff6ff', borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  msgGray: { backgroundColor: '#f8fafc' },
  msgSender: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  msgContent: { fontSize: 13, color: '#334155', marginTop: 5, lineHeight: 18 },
});