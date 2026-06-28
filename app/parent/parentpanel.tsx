import { useRouter } from 'expo-router';
// FIXED: All icons must be imported here
import {
  ChevronLeft,
  Info,
  MessageSquare,
  Star,
  TrendingUp
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from "react-native-gifted-charts";

// Firebase
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

// Components
// Ensure this path matches your folder structure
import { StatCard } from '../../components/StatCard';

const screenWidth = Dimensions.get('window').width;

export default function ParentDashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, "buddies", user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) setUserData(docSnap.data());
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7C4DFF" />;

  // --- 1. DYNAMIC CALCULATIONS ---
  const academicProgress = Math.round(((userData?.academicWatched || 0) / (userData?.totalAcademic || 10)) * 100);
  const routineProgress = Math.round(((userData?.routineCompleted || 0) / (userData?.totalRoutine || 7)) * 100);
  const playProgress = Math.round(((userData?.gamesPlayed || 0) / (userData?.totalGames || 5)) * 100);
  const overallScore = Math.round((academicProgress + routineProgress + playProgress) / 3);

  // Chart Data Preparation
  const routineHistory = userData?.routineHistory || [20, 50, 30, 80, 60, 90, 40];
  const academicHistory = userData?.academicHistory || [40, 30, 60, 70, 50, 85, 65];
  const gamesHistory = userData?.gamesHistory || [60, 70, 40, 50, 80, 100, 30];

  const formatData = (arr: number[]) => {
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return arr.map((val, i) => ({ value: val, label: labels[i] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft color="#333" size={28} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Parent Analytics</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.welcomeTitle}>{userData?.name || "Child"}'s Progress</Text>

        {/* TOP STATS */}
        <View style={styles.statsRow}>
          <StatCard label="Total Stars" value={userData?.stars || "0"} icon={Star} color="#FFD700" />
          <StatCard label="Tasks Done" value={`${userData?.routineCompleted || 0}/${userData?.totalRoutine || 10}`} icon={TrendingUp} color="#4CAF50" />
        </View>

        {/* DAILY CIRCLE ANALYSIS */}
        <View style={styles.premiumCard}>
          <Text style={styles.cardMainTitle}>Daily Analysis</Text>
          <View style={styles.chartFlex}>
            <View style={styles.ringsContainer}>
              <View style={[styles.baseRing, { borderColor: '#26CE71', width: 120, height: 120 }]}>
                <Text style={styles.overallText}>{overallScore}%</Text>
                <Text style={styles.overallLabel}>TOTAL</Text>
              </View>
            </View>
            <View style={styles.legendContainer}>
              <LegendRow color="#26CE71" label="Routine" val={routineProgress} />
              <LegendRow color="#42A5F5" label="Academic" val={academicProgress} />
              <LegendRow color="#FFC107" label="Play" val={playProgress} />
            </View>
          </View>
        </View>

        {/* WEEKLY REPORT LINE GRAPH */}
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>Weekly Progress Report</Text>
            <Info size={18} color="#999" />
          </View>

          <LineChart
            data={formatData(routineHistory)}
            data2={formatData(academicHistory)}
            data3={formatData(gamesHistory)}
            height={200}
            width={screenWidth - 100}
            initialSpacing={10}
            spacing={45}
            color1="#26CE71"
            color2="#42A5F5"
            color3="#FFC107"
            thickness={4}
            dataPointsHeight={8}
            dataPointsWidth={8}
            curved
            hideRules
            yAxisThickness={0}
            xAxisThickness={0}
            yAxisTextStyle={{ color: '#AAA', fontSize: 10 }}
            xAxisLabelTextStyle={{ color: '#AAA', fontSize: 10 }}
          />

          <View style={styles.graphLegendRow}>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#26CE71' }]} /><Text style={styles.dotText}>Routine</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#42A5F5' }]} /><Text style={styles.dotText}>Academic</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#FFC107' }]} /><Text style={styles.dotText}>Play</Text></View>
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fabFeedback} onPress={() => router.push('/feedback' as any)}>
        <MessageSquare color="#fff" size={28} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// FIXED: Helper component defined outside/bottom of main component
const LegendRow = ({ color, label, val }: any) => (
  <View style={styles.lRow}>
    <View style={[styles.lDot, { backgroundColor: color }]} />
    <Text style={styles.lLabel}>{label}</Text>
    <Text style={styles.lVal}>{val}%</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 50 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { paddingBottom: 100 },
  welcomeTitle: { fontSize: 24, fontWeight: 'bold', marginHorizontal: 20, marginVertical: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  premiumCard: { backgroundColor: '#fff', marginHorizontal: 20, padding: 20, borderRadius: 25, elevation: 5, marginBottom: 20 },
  cardMainTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
  chartFlex: { flexDirection: 'row', alignItems: 'center' },
  ringsContainer: { width: 130, height: 130, justifyContent: 'center', alignItems: 'center' },
  baseRing: { borderRadius: 100, borderWidth: 10, justifyContent: 'center', alignItems: 'center' },
  overallText: { fontSize: 22, fontWeight: '900' },
  overallLabel: { fontSize: 8, color: '#999', fontWeight: 'bold' },
  legendContainer: { flex: 1, marginLeft: 20, gap: 10 },
  lRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  lLabel: { flex: 1, fontSize: 14, color: '#444' },
  lVal: { fontWeight: 'bold' },
  reportCard: { backgroundColor: '#fff', marginHorizontal: 20, padding: 20, borderRadius: 25, elevation: 5, alignItems: 'center' },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  reportTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  graphLegendRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  dotText: { fontSize: 12, color: '#666', fontWeight: '600' },
  fabFeedback: { position: 'absolute', bottom:25, right: 25, backgroundColor: '#7C4DFF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
});