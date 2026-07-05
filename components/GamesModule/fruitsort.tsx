import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  StyleSheet, Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#FFFBF2',
  text: '#5B4D7B',
  purple: '#D8B4FE', // This is your purple color
  white: '#FFFFFF',
};

const CATEGORIES = [
  {
    id: 'fruits',
    title: 'Fruits',
    icon: '🍎',
    items: [
      { id: 1, emoji: '🍎', color: '#FFE4E6' },
      { id: 2, emoji: '🍌', color: '#FEF9C3' },
      { id: 3, emoji: '🍇', color: '#F3E8FF' },
      { id: 4, emoji: '🍐', color: '#DBEAFE' },
    ]
  },
  {
    id: 'animals',
    title: 'Animals',
    icon: '🐱',
    items: [
      { id: 5, emoji: '🐱', color: '#FFEDD5' },
      { id: 6, emoji: '🐶', color: '#E0F2FE' },
      { id: 7, emoji: '🦊', color: '#FFEDD5' },
      { id: 8, emoji: '🦁', color: '#FEF9C3' },
    ]
  },
  {
    id: 'shapes',
    title: 'Shapes',
    icon: '⭐',
    items: [
      { id: 9, emoji: '⭐', color: '#FEF9C3' },
      { id: 10, emoji: '💎', color: '#E0F2FE' },
      { id: 11, emoji: '🌀', color: '#F3E8FF' },
      { id: 12, emoji: '🎈', color: '#FFE4E6' },
    ]
  }
];

export default function FruitSortGame() {
  const router = useRouter();
  const [screen, setScreen] = useState('categories'); 
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [activeItems, setActiveItems] = useState<any[]>([]);
  const [target, setTarget] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);

  useEffect(() => {
    let timer: any; 
    if (screen === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [screen, timeLeft]);

  const startCategory = (categoryItems: any[]) => {
    setActiveItems(categoryItems);
    setScore(0);
    setTimeLeft(30);
    setScreen('playing');
    const randomTarget = categoryItems[Math.floor(Math.random() * categoryItems.length)];
    setTarget(randomTarget);
    setOptions([...categoryItems].sort(() => 0.5 - Math.random()));
  };

  const nextRound = () => {
    const randomTarget = activeItems[Math.floor(Math.random() * activeItems.length)];
    setTarget(randomTarget);
    setOptions([...activeItems].sort(() => 0.5 - Math.random()));
  };

  const handleChoice = (id: number) => {
    if (id === target?.id) {
      setScore(s => s + 10);
      nextRound();
    }
  };

  // --- CATEGORY SELECTION SCREEN ---
  if (screen === 'categories') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.purpleArrow}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.title}>Select Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.categoryCard}
                onPress={() => startCategory(cat.items)}
              >
                <Text style={{fontSize: 50}}>{cat.icon}</Text>
                <Text style={styles.categoryText}>{cat.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- GAMEPLAY SCREEN ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('categories')}>
          <Text style={styles.purpleArrow}>←</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.stats}>Score: {score}</Text>
          <Text style={styles.stats}>Time: {timeLeft}s</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.targetCard}>
          <Text style={{fontSize: 100}}>{target?.emoji}</Text>
          <Text style={styles.hint}>Match the item!</Text>
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
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 30,
    alignItems: 'center'
  },
  purpleArrow: {
    fontSize: 45,       // Large enough to tap easily
    color: COLORS.purple,
    fontWeight: 'bold',
  },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 30 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  categoryCard: {
    width: width * 0.4,
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 4,
  },
  categoryText: { marginTop: 10, fontSize: 18, fontWeight: '600', color: COLORS.text },
  stats: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  targetCard: { padding: 40, backgroundColor: 'white', borderRadius: 30, elevation: 5, alignItems: 'center', marginBottom: 40 },
  hint: { fontSize: 18, fontWeight: 'bold', marginTop: 10, color: COLORS.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  card: { width: 80, height: 80, margin: 10, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3 }
});