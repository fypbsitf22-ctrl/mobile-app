import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MainHeader from '../MainHeaderShared';

const { width } = Dimensions.get('window');

// Data for your 5 Games
const GAMES = [
  { id: 'fruitsort', name: 'Fruit Sort', color: '#FFADAD', icon: '🍎', audio: require('../../assets/audio/games.mp3') },
  { id: 'colouringtime', name: 'Coloring Time', color: '#A2D2FF', icon: '🎨', audio: require('../../assets/audio/activity.mp3') },
  { id: 'matchingpair', name: 'Match Pairs', color: '#CAFFBF', icon: '💎', audio: require('../../assets/audio/games.mp3') },
  { id: 'catchstars', name: 'Catch Stars', color: '#FFD6A5', icon: '⭐', audio: require('../../assets/audio/games.mp3') },
  { id: 'dressseason', name: 'Dress Season', color: '#E8E0FF', icon: '👕', audio: require('../../assets/audio/routine.mp3') },
];

export default function GamesMain({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  
  const [selectedGame, setSelectedGame] = useState('');

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  async function playAudio(source: any) {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
      soundRef.current = newSound;
    } catch (e) {
      console.log("Audio Error", e);
    }
  }

  const handleGameSelect = (item: any) => {
    setSelectedGame(item.id);
    playAudio(item.audio);
  };

  const startGame = () => {
    if (!selectedGame) return;
    
    // Path logic based on role
    const basePath = role === 'parent' ? '/parent/games' : '/teacher/games';
    router.push(`${basePath}/${selectedGame}` as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <MainHeader role={role} />

      <View style={styles.titleRow}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={30} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCard}>
          <Text style={styles.headerText}>Fun Games Zone</Text>
        </View>
      </View>
      
      <ScrollView 
        ref={scrollRef} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Instruction Section */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionText}>Pick a game to play! 🎮</Text>
          <TouchableOpacity onPress={() => playAudio(require('../../assets/audio/games.mp3'))} style={styles.speakerBtn}>
            <Ionicons name="volume-high" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Games Grid */}
        <View style={styles.grid}>
          {GAMES.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={[
                styles.card, 
                { backgroundColor: item.color }, 
                selectedGame === item.id && styles.selectedBorder
              ]} 
              onPress={() => handleGameSelect(item)}
            >
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 40 }}>{item.icon}</Text>
              </View>
              <Text style={styles.cardText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Start Button appears after selection */}
        {selectedGame !== '' && (
          <TouchableOpacity style={styles.startBtn} onPress={startGame}>
            <Text style={styles.startBtnText}>Start Playing 🚀</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 20 },
  backBtn: { backgroundColor: '#C4A6FB', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  headerCard: { flex: 1, backgroundColor: '#F3EFFF', padding: 15, borderRadius: 25, alignItems: 'center', marginLeft: 15 },
  headerText: { fontSize: 22, fontWeight: 'bold', color: '#6B46C1' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 20 },
  instructionCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 20, alignItems: 'center', justifyContent: 'space-between', marginBottom: 25, elevation: 3 },
  instructionText: { fontSize: 18, fontWeight: '900', color: '#444', flex: 1 },
  speakerBtn: { backgroundColor: '#C4A6FB', padding: 8, borderRadius: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: width * 0.42, height: 140, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 15, elevation: 2 },
  selectedBorder: { borderWidth: 5, borderColor: '#C4A6FB', backgroundColor: '#FFF' },
  iconCircle: { backgroundColor: '#FFF', width: 65, height: 65, borderRadius: 32.5, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  cardText: { fontSize: 17, fontWeight: 'bold', color: '#444' },
  startBtn: { backgroundColor: '#66BB6A', padding: 20, borderRadius: 30, alignItems: 'center', marginTop: 20, elevation: 5, borderBottomWidth: 5, borderBottomColor: '#4CAF50' },
  startBtnText: { color: '#FFF', fontSize: 24, fontWeight: '900' }
});