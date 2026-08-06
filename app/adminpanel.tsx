import { useRouter } from 'expo-router';
import { Bell, Settings, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function TeacherPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'review'>('home');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // --- 1. HEADER SECTION (Matches your screenshot) ---
  const Header = () => (
    <View style={styles.headerCard}>
      <View style={styles.profileInfo}>
        <View style={styles.avatarCircle}><User color="#90caf9" size={30} /></View>
        <View>
          <Text style={styles.welcomeText}>Hello Teacher 👋</Text>
          <Text style={styles.teacherName}>Hifza</Text>
        </View>
      </View>
      <View style={styles.headerIcons}>
        <TouchableOpacity style={styles.iconBtn}><Bell color="#8d6e63" size={20} /></TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}><Settings color="#8d6e63" size={20} /></TouchableOpacity>
      </View>
    </View>
  );

  // --- 2. MAIN MENU CARDS ---
  const MainMenu = () => (
    <ScrollView style={styles.content}>
      <MenuCard 
        title="Upload Activities" 
        color="#E3F2FD" 
        btnColor="#90CAF9" 
        onPress={() => setShowUploadModal(true)} 
      />
      <MenuCard 
        title="Review Submissions" 
        color="#FCE4EC" 
        btnColor="#F06292" 
        onPress={() => setActiveTab('review')} 
      />
      <MenuCard 
        title="Progress Board" 
        color="#E8F5E9" 
        btnColor="#81C784" 
        onPress={() => Alert.alert("Opening Board", "Loading class analytics...")} 
      />
    </ScrollView>
  );

  // --- 3. SUBMISSION REVIEW LIST ---
  const ReviewList = () => (
    <View style={styles.content}>
      <TouchableOpacity onPress={() => setActiveTab('home')} style={styles.backLink}>
        <Text style={{color: '#7C4DFF'}}>← Back to Dashboard</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Pending Reviews</Text>
      {['Ali Ahmed', 'Sara Khan', 'Zainab Bibi'].map((name, i) => (
        <View key={i} style={styles.submissionCard}>
          <Text style={styles.studentName}>{name}</Text>
          <Text style={styles.taskName}>Math Assignment #1</Text>
          <TouchableOpacity style={styles.reviewBtn} onPress={() => Alert.alert("Feedback", "Write comment for " + name)}>
            <Text style={{color: 'white', fontWeight: 'bold'}}>Review</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      {activeTab === 'home' ? <MainMenu /> : <ReviewList />}

      {/* UPLOAD MODAL */}
      <Modal visible={showUploadModal} animationType="slide">
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={() => setShowUploadModal(false)}><X size={30} /></TouchableOpacity>
          <Text style={styles.modalTitle}>Upload New Activity</Text>
          <TextInput style={styles.input} placeholder="Activity Title" />
          <TextInput style={[styles.input, {height: 100}]} placeholder="Instructions..." multiline />
          <TouchableOpacity style={styles.submitBtn} onPress={() => {Alert.alert("Success", "Posted!"); setShowUploadModal(false);}}>
            <Text style={{color:'white', fontWeight:'bold'}}>Post to Classroom</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- REUSABLE COMPONENTS ---
const MenuCard = ({ title, color, btnColor, onPress }: any) => (
  <View style={[styles.menuCard, { backgroundColor: color }]}>
    <Text style={styles.menuTitle}>{title}</Text>
    <TouchableOpacity style={[styles.startBtn, { backgroundColor: btnColor }]} onPress={onPress}>
      <Text style={styles.startBtnText}>Start now</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf9ec' },
  headerCard: { backgroundColor: 'white', margin: 20, padding: 30, borderRadius: 35, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 5 },
  profileInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ffcc80' },
  welcomeText: { fontSize: 12, color: '#888' },
  teacherName: { fontSize: 18, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, backgroundColor: '#fffcf2', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ffe0b2' },
  content: { padding: 20 },
  menuCard: { height: 160, borderRadius: 30, padding: 25, marginBottom: 20, justifyContent: 'center' },
  menuTitle: { fontSize: 22, fontWeight: 'bold', color: '#5c92c1', marginBottom: 15 },
  startBtn: { width: 100, padding: 10, borderRadius: 15, alignItems: 'center' },
  startBtnText: { color: 'white', fontWeight: 'bold' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 15 },
  backLink: { marginBottom: 10 },
  submissionCard: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  studentName: { fontWeight: 'bold' },
  taskName: { fontSize: 12, color: '#666' },
  reviewBtn: { backgroundColor: '#7C4DFF', padding: 8, borderRadius: 10 },
  modalContent: { flex: 1, padding: 30, paddingTop: 60 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginVertical: 20 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 20, padding: 10 },
  submitBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 15, alignItems: 'center' }
});

