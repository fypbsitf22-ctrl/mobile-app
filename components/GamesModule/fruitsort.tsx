import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const COLORS = {
  bg: '#FFFBF2',       
  text: '#5B4D7B',     
  pinkBlob: '#FDE2E4',  
  mintBlob: '#E2F7ED',  
  blueBlob: '#E0F2FE',
  button: '#D8B4FE',   
  white: '#FFFFFF',
  lavender: '#E9D5FF'
};

const ITEMS = [
  { id: 1, emoji: '🍎', color: '#FFE4E6' },
  { id: 2, emoji: '🍌', color: '#FEF9C3' },
  { id: 3, emoji: '🍇', color: '#F3E8FF' },
  { id: 4, emoji: '🍐', color: '#DBEAFE' },
];

export default function FruitSortGame() {
  const [screen, setScreen] = useState('playing'); 
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [target, setTarget] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);

  useEffect(() => {
    nextRound();
    const timer = setInterval(() => {
      setTimeLeft(t => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const nextRound = () => {
    const randomTarget = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    setTarget(randomTarget);
    setOptions([...ITEMS].sort(() => 0.5 - Math.random()));
  };

  const handleChoice = (id: number) => {
    if (id === target?.id) {
      setScore(s => s + 10);
      nextRound();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stats}>Points: {score}</Text>
        <Text style={styles.stats}>Time: {timeLeft}s</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.targetCard}>
          <Text style={{fontSize: 100}}>{target?.emoji}</Text>
          <Text style={styles.hint}>Find this fruit!</Text>
        </View>

        <View style={styles.grid}>
          {options.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.card, {backgroundColor: item.color}]}
              onPress={() => handleChoice(item.id)}
            >
              <Text style={{fontSize: 40}}>{item.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF2' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 40 },
  stats: { fontSize: 20, fontWeight: 'bold', color: '#5B4D7B' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  targetCard: { padding: 40, backgroundColor: 'white', borderRadius: 30, elevation: 5, alignItems: 'center', marginBottom: 40 },
  hint: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  card: { width: 80, height: 80, margin: 10, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3 }
});