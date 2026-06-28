import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Firebase 
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

// Define Interfaces
interface StudentData {
  id: string;
  name: string;
  progress: number;
  improvement: string;
}

interface SubmissionData {
  id: string;
  studentName: string;
  activityTitle: string;
  status: string;
  content: string;
}

interface Message {
  id: string;
  text: string;
  senderRole: 'teacher' | 'student';
  senderName: string;
  timestamp: any;
}

export default function TeacherProgressBoard() {
  const [view, setView] = useState<'stats' | 'review'>('stats');
  const [students, setStudents] = useState<StudentData[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  
  // Modals State
  const [selectedSub, setSelectedSub] = useState<SubmissionData | null>(null);
  const [isFeedbackCenterOpen, setIsFeedbackCenterOpen] = useState(false);
  
  // Input State
  const [taskFeedback, setTaskFeedback] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const teacherId = auth.currentUser?.uid;

  // 1. DYNAMIC SYNC (Students & Submissions)
  useEffect(() => {
    if (!teacherId) return;

    const qS = query(collection(db, "students"), where("teacherId", "==", teacherId));
    const unsubS = onSnapshot(qS, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentData)));
    });

    const qR = query(collection(db, "submissions"), where("teacherId", "==", teacherId));
    const unsubR = onSnapshot(qR, (snap) => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as SubmissionData)));
    });

    // 2. DYNAMIC SYNC (Feedback Center Messages)
    const qM = query(
      collection(db, "feedback_messages"), 
      where("teacherId", "==", teacherId),
      orderBy("timestamp", "asc")
    );
    const unsubM = onSnapshot(qM, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });

    return () => { unsubS(); unsubR(); unsubM(); };
  }, [teacherId]);

  // 3. SEND TASK FEEDBACK
  const submitTaskReview = async () => {
    if (!selectedSub || !taskFeedback) return;
    try {
      await updateDoc(doc(db, "submissions", selectedSub.id), {
        feedback: taskFeedback,
        status: "Reviewed",
        reviewedAt: serverTimestamp()
      });
      Alert.alert("Success", "Feedback saved for this task.");
      setSelectedSub(null);
      setTaskFeedback('');
    } catch (e) { Alert.alert("Error", "Could not save."); }
  };

  // 4. SEND GENERAL FEEDBACK (CHAT)
  const sendChatMessage = async () => {
    if (!chatMessage || !teacherId) return;
    try {
      await addDoc(collection(db, "feedback_messages"), {
        teacherId: teacherId,
        text: chatMessage,
        senderRole: 'teacher',
        senderName: 'Teacher',
        timestamp: serverTimestamp()
      });
      setChatMessage('');
    } catch (e) { Alert.alert("Error", "Could not send message."); }
  };

  const avgProgress = students.length > 0 
    ? (students.reduce((a, b) => a + b.progress, 0) / students.length).toFixed(0) 
    : 0;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTxt}>Teacher Panel</Text>
        <Text style={styles.subTxt}>Dynamic Analytics & Feedback Center</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setView('stats')} style={[styles.tab, view === 'stats' && styles.activeTab]}>
          <Text style={[styles.tabTxt, view === 'stats' && styles.activeTabTxt]}>Statistics</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView('review')} style={[styles.tab, view === 'review' && styles.activeTab]}>
          <Text style={[styles.tabTxt, view === 'review' && styles.activeTabTxt]}>Submissions</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body}>
        {view === 'stats' ? (
          <View>
            <View style={styles.statGrid}>
              <View style={styles.statBox}><Text style={styles.statNum}>{avgProgress}%</Text><Text style={styles.statLabel}>Avg. Progress</Text></View>
              <View style={[styles.statBox, {backgroundColor: '#E3F2FD'}]}><Text style={[styles.statNum, {color: '#1976D2'}]}>{students.length}</Text><Text style={styles.statLabel}>Students</Text></View>
            </View>
            <View style={styles.chartArea}>
              <Text style={styles.chartTitle}>Class Comparison</Text>
              {students.map(s => (
                <View key={s.id} style={styles.barRow}>
                  <Text style={styles.barName} numberOfLines={1}>{s.name}</Text>
                  <View style={styles.barTrack}><View style={[styles.barFill, {width: `${s.progress}%`}]} /></View>
                  <Text style={styles.barVal}>{s.progress}%</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View>
            {submissions.map(item => (
              <TouchableOpacity key={item.id} style={styles.card} onPress={() => setSelectedSub(item)}>
                <View style={{flex:1}}><Text style={styles.cardName}>{item.studentName}</Text><Text style={styles.cardInfo}>{item.activityTitle}</Text></View>
                <View style={[styles.status, {backgroundColor: item.status === 'Reviewed' ? '#C8E6C9' : '#FFE0B2'}]}>
                  <Text style={styles.statusTxt}>{item.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={{height: 100}} />
      </ScrollView>

      {/* FLOATING FEEDBACK ICON (Opens Chat Modal) */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsFeedbackCenterOpen(true)}>
        <MaterialCommunityIcons name="message-text" size={30} color="white" />
      </TouchableOpacity>

      {/* MODAL 1: FEEDBACK CENTER (CHAT STYLE) */}
      <Modal visible={isFeedbackCenterOpen} animationType="slide">
        <SafeAreaView style={{flex: 1, backgroundColor: '#FFF'}}>
           <View style={styles.chatHeader}>
              <TouchableOpacity onPress={() => setIsFeedbackCenterOpen(false)}>
                 <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.chatTitle}>Feedback Center</Text>
           </View>
           
           <ScrollView style={{flex: 1, padding: 15}}>
              {messages.map((msg) => (
                 <View key={msg.id} style={[styles.msgWrapper, msg.senderRole === 'teacher' ? styles.teacherMsg : styles.studentMsg]}>
                    <Text style={styles.senderName}>{msg.senderName}</Text>
                    <View style={[styles.bubble, msg.senderRole === 'teacher' ? styles.teacherBubble : styles.studentBubble]}>
                       <Text style={msg.senderRole === 'teacher' ? styles.whiteTxt : styles.blackTxt}>{msg.text}</Text>
                    </View>
                 </View>
              ))}
           </ScrollView>

           <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.inputBar}>
                 <TextInput 
                   style={styles.chatInput} 
                   placeholder="Type feedback here..." 
                   value={chatMessage} 
                   onChangeText={setChatMessage} 
                 />
                 <TouchableOpacity style={styles.sendBtn} onPress={sendChatMessage}>
                    <MaterialCommunityIcons name="send" size={24} color="white" />
                 </TouchableOpacity>
              </View>
           </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* MODAL 2: TASK REVIEW MODAL */}
      <Modal visible={selectedSub !== null} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalHead}>Review Work: {selectedSub?.studentName}</Text>
            <View style={styles.contentBox}><Text style={styles.contentText}>{selectedSub?.content}</Text></View>
            <TextInput style={styles.input} placeholder="Review comments..." multiline value={taskFeedback} onChangeText={setTaskFeedback} />
            <TouchableOpacity style={styles.saveBtn} onPress={submitTaskReview}><Text style={styles.saveBtnTxt}>Submit Feedback</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedSub(null)} style={styles.close}><Text>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF9E9' },
  header: { padding: 55, backgroundColor: '#C4A6FB', borderBottomLeftRadius: 30, borderBottomRightRadius: 20 },
  headerTxt: { fontSize: 25, fontWeight: 'bold', color: 'white' },
  subTxt: { color: 'white', opacity: 0.8, fontSize: 14 },
  tabs: { flexDirection: 'row', margin: 20, backgroundColor: 'white', borderRadius: 15, elevation: 3, padding: 5 },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#C4A6FB' },
  tabTxt: { color: '#C4A6FB', fontWeight: 'bold' },
  activeTabTxt: { color: 'white' },
  body: { flex: 1, paddingHorizontal: 20 },
  statGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { flex: 0.48, backgroundColor: 'white', padding: 20, borderRadius: 20, alignItems: 'center', elevation: 1 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#C4A6FB' },
  statLabel: { fontSize: 11, color: '#888' },
  chartArea: { backgroundColor: 'white', padding: 20, borderRadius: 25, elevation: 1 },
  chartTitle: { textAlign: 'center', fontSize: 12, color: '#999', marginBottom: 15, fontWeight: 'bold' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barName: { width: 60, fontSize: 11 },
  barTrack: { flex: 1, height: 10, backgroundColor: '#F0F0F0', borderRadius: 5, marginHorizontal: 10, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#C4A6FB' },
  barVal: { width: 30, fontSize: 11, fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 18, borderRadius: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 1 },
  cardName: { fontWeight: 'bold', fontSize: 16 },
  cardInfo: { color: '#888', fontSize: 12 },
  status: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusTxt: { fontSize: 10, fontWeight: 'bold' },
  
  // CHAT MODAL STYLES
  chatHeader: { padding: 20, borderBottomWidth: 1, borderColor: '#EEE', flexDirection: 'row', alignItems: 'center' },
  chatTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  msgWrapper: { marginBottom: 15, maxWidth: '80%' },
  teacherMsg: { alignSelf: 'flex-end' },
  studentMsg: { alignSelf: 'flex-start' },
  senderName: { fontSize: 10, color: '#999', marginBottom: 2, marginHorizontal: 5 },
  bubble: { padding: 12, borderRadius: 18 },
  teacherBubble: { backgroundColor: '#7C3AED', borderBottomRightRadius: 0 },
  studentBubble: { backgroundColor: '#F3F4F6', borderBottomLeftRadius: 0 },
  whiteTxt: { color: 'white' },
  blackTxt: { color: '#333' },
  inputBar: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderColor: '#EEE', backgroundColor: '#FFF' },
  chatInput: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 25, paddingHorizontal: 20, height: 50 },
  sendBtn: { backgroundColor: '#7C3AED', width: 50, height: 50, borderRadius: 25, marginLeft: 10, justifyContent: 'center', alignItems: 'center' },

  // FAB
  fab: { position: 'absolute', bottom: 30, right: 25, backgroundColor: '#7C3AED', width: 65, height: 65, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 8 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: 'white', borderRadius: 30, padding: 25 },
  modalHead: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  contentBox: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 15, marginBottom: 15 },
  contentText: { color: '#555' },
  input: { backgroundColor: '#F9FAFB', borderRadius: 15, padding: 15, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#EEE' },
  saveBtn: { backgroundColor: '#C4A6FB', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 15 },
  saveBtnTxt: { color: 'white', fontWeight: 'bold' },
  close: { marginTop: 15, alignSelf: 'center' }
});