import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import MainHeaderShared from '../MainHeaderShared';
const { width, height } = Dimensions.get('window');
interface QuizProps { role: 'parent' | 'teacher'; }
export default function QuizPlayer({ role }: QuizProps) {
  const router = useRouter();
  const { grade, subject } = useLocalSearchParams();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReward, setShowReward] = useState(false);
  const [showWrongModal, setShowWrongModal] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [voiceUrls, setVoiceUrls] = useState<any>(null);
  // --- TIMER LOGIC ---
  const [elapsedTime, setElapsedTime] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerInterval = useRef<any>(null);
  useEffect(() => {
    timerInterval.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerInterval.current);
  }, [currentIndex]);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const configSnap = await getDoc(doc(db, "app_config", "academic_sounds"));
        if (configSnap.exists()) setVoiceUrls(configSnap.data());
        const q = query(
          collection(db, "academic_lessons", `${grade}_section`, subject as string),
          where("type", "==", "Quiz")
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (data.length > 0) setQuestions(data.sort(() => Math.random() - 0.5));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchAll();
  }, [grade, subject]);
  async function playSound(url: string | undefined) {
    if (!url) return;
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      soundRef.current = sound;
    } catch (e) { }
  }
  // --- AUTO-PLAY QUESTION AUDIO ---
  useEffect(() => {
    if (!loading && questions[currentIndex]?.question_audio) {
      playSound(questions[currentIndex].question_audio);
    }
  }, [currentIndex, loading]);
  const handleNextQuestion = () => {
    setWrongAttempts(0);
    setElapsedTime(0);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.back();
    }
  };

  // --- Saves a quiz result (Correct or Wrong) to the student's dashboard doc ---
 const saveQuizResult = async (status: "Correct" | "Wrong") => {
    const currentQ = questions[currentIndex];
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, "students", user.uid), {
        quiz_results: arrayUnion({
          grade: grade || null,
          subject,
          title: currentQ?.title || "Quiz",
          question: currentQ?.question || "",   // NEW: store the actual question text
          date: new Date().toISOString(),
          status,
          timeSpent: formatTime(elapsedTime)
        })
      }, { merge: true });
    } catch (e) { /* silent fail, same behavior as before */ }
  };

  const checkAnswer = async (selected: string) => {
    const currentQ = questions[currentIndex];
    if (selected === currentQ.correctAnswer) {
      if (voiceUrls?.quiz_success) playSound(voiceUrls.quiz_success);
      setShowReward(true);

      await saveQuizResult("Correct");

      setTimeout(() => {
        setShowReward(false);
        handleNextQuestion();
      }, 2500);
    } else {
      const newCount = wrongAttempts + 1;
      setWrongAttempts(newCount);
      setShowWrongModal(true);
      if (newCount === 1) {
        if (voiceUrls?.quiz_wrong) playSound(voiceUrls.quiz_wrong);
        setTimeout(() => setShowWrongModal(false), 2500);
      } else {
        if (currentQ.correct_answer_audio) playSound(currentQ.correct_answer_audio);

        await saveQuizResult("Wrong");

        setTimeout(() => {
          setShowWrongModal(false);
          handleNextQuestion();
        }, 4000);
      }
    }
  };
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#C4A6FB" /></View>;
  const currentQuiz = questions[currentIndex];
  // Find the correct option object (works for both text options and {value, image} options)
  const correctOption = currentQuiz?.options?.find((opt: any) => {
    const val = typeof opt === 'object' && opt !== null ? opt.value : opt;
    return val === currentQuiz?.correctAnswer;
  });
  const correctIsImage = typeof correctOption === 'object' && correctOption !== null && correctOption.image;
  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderShared role={role} />
      <View style={styles.titleRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={30} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCard}>
          <Text style={styles.headerText} numberOfLines={1}>{currentQuiz?.title || "Quiz"}</Text>
        </View>
      </View>
      <View style={styles.playerContent}>
        
       
        <View style={styles.topSection}>
            {/* INSTRUCTION ROW WITH SPEAKER */}
            <View style={styles.instructionRow}>
                <TouchableOpacity 
                  style={styles.speakerBtn} 
                  onPress={() => playSound(currentQuiz?.question_audio)}
                >
                    <Ionicons name="volume-high" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.topInstruction}>{currentQuiz?.question}</Text>
            </View>
            
            <View style={styles.imageWhiteCard}>
                <Image source={{ uri: currentQuiz?.image }} style={styles.mainImage} resizeMode="contain" />
            </View>
        </View>
      <View style={styles.optionsContainer}>
  {currentQuiz?.options?.map((option: any, index: number) => {
    const isImageOption = typeof option === 'object' && option !== null && option.image;
    const optionValue = isImageOption ? option.value : option;
    const isCorrect = optionValue === currentQuiz.correctAnswer;
    return (
      <TouchableOpacity
        key={index}
        style={[
          isImageOption ? styles.imageOptionBtn : styles.optionBtn,
          (wrongAttempts >= 2 && isCorrect) && styles.highlightCorrect,
        ]}
        onPress={() => checkAnswer(optionValue)}
      >
        {isImageOption ? (
          <Image source={{ uri: option.image }} style={styles.optionImage} resizeMode="contain" />
        ) : (
          <Text style={styles.optionText}>{option}</Text>
        )}
      </TouchableOpacity>
    );
  })}
</View>
{/* TIMER BAR */}
<View style={[styles.statusIndicator, { backgroundColor: '#F5F5F5' }]}>
  <Ionicons name="play-circle" size={28} color="#555" />
  <View style={{ marginLeft: 14 }}>
    <Text style={styles.timerText}>
      Learning Time: {formatTime(elapsedTime)}
    </Text>
  </View>
</View>
<View style={styles.footer}>
  <Text style={styles.progressText}>
    Question {currentIndex + 1} of {questions.length}
  </Text>
</View>
</View> 
      {/* MODALS */}
      <Modal visible={showReward} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.rewardBox}>
            <Ionicons name="star" size={100} color="#FFD700" />
            <Text style={styles.wellDoneText}>GREAT JOB! 🎉</Text>
            <Text style={styles.rewardSubText}>That is the correct Answer!</Text>
          </View>
        </View>
      </Modal>
      <Modal visible={showWrongModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.rewardBox, { borderColor: wrongAttempts === 1 ? '#FFB74D' : '#4FC3F7', borderWidth: 4 }]}>
            <Ionicons name={wrongAttempts === 1 ? "happy-outline" : "information-circle"} size={100} color={wrongAttempts === 1 ? "#FFB74D" : "#4FC3F7"} />
            <Text style={[styles.wellDoneText, { color: wrongAttempts === 1 ? '#F57C00' : '#0288D1' }]}>
                {wrongAttempts === 1 ? "GOOD TRY! 😊" : "LET'S LEARN! ✅"}
            </Text>
            <Text style={styles.rewardSubText}>
                {wrongAttempts === 1
                  ? " let's try one more time!"
                  : correctIsImage
                    ? "The correct answer is:"
                    : `The correct answer is ${currentQuiz?.correctAnswer}`}
            </Text>
            {wrongAttempts > 1 && correctIsImage && (
              <Image
                source={{ uri: correctOption.image }}
                style={styles.correctAnswerImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 25 },
  backBtn: { backgroundColor: '#C4A6FB', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  headerCard: { flex: 1, backgroundColor: '#F3EFFF', padding: 10, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginLeft: 15 },
  headerText: { fontSize: 22, fontWeight: 'bold', color: '#6B46C1' },
  playerContent: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  
  // TIMER BAR STYLES (MATCHING SAMPLE)
 statusIndicator: {
  flexDirection: 'row',
  alignItems: 'center',
  width: '100%',
  marginTop: 10,      // change from 5 or adjust as needed
  marginBottom: 10,
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 20,
  backgroundColor: '#F5F5F5',
},
  timerText: { fontSize: 12, color: '#999', fontWeight: '600' },
  correctAnswerImage: { width: 120, height: 120, marginTop: 12, borderRadius: 20 },
  topSection: { width: '100%', alignItems: 'center', marginBottom: 20 },
  instructionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  speakerBtn: { backgroundColor: '#C4A6FB', padding: 8, borderRadius: 15, marginRight: 10 },
  topInstruction: { fontSize: 22, fontWeight: '900', color: '#5E35B1', textAlign: 'center', flexShrink: 1 },
  
  imageWhiteCard: { backgroundColor: '#FFF', width: width * 0.85, height: height * 0.25, borderRadius: 40, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  mainImage: { width: '85%', height: '85%' },
  optionsContainer: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
  optionBtn: { backgroundColor: '#FFF', width: '45%', paddingVertical: 18, borderRadius: 30, alignItems: 'center', justifyContent: 'center', elevation: 4, borderWidth: 4, borderColor: '#E0F2F1' },
  imageOptionBtn: {
    backgroundColor: '#FFF',
    width: '45%',
    height: 110,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    borderWidth: 4,
    borderColor: '#E0F2F1',
  },
  optionImage: { width: '80%', height: '80%' },
  highlightCorrect: { borderColor: '#66BB6A', backgroundColor: '#E8F5E9' },
  optionText: { fontSize: 30, fontWeight: 'bold', color: '#00796B' },
  footer: { marginTop: 'auto', marginBottom: 20, alignItems: 'center' },
  progressText: { fontSize: 16, color: '#999', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  rewardBox: { backgroundColor: '#FFF', padding: 40, borderRadius: 50, alignItems: 'center', width: '85%' },
  wellDoneText: { fontSize: 28, fontWeight: '900', color: '#4CAF50', textAlign: 'center', marginTop: 15 },
  rewardSubText: { fontSize: 18, color: '#555', fontWeight: '700', marginTop: 10, textAlign: 'center' },
});