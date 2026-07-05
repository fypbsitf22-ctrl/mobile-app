import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  SafeAreaView, StatusBar,
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
  purpleArrow: '#8B5CF6', 
  white: '#FFFFFF',
};

const SCENARIOS = [
  {
    id: 1,
    label: 'Sunny Day',
    emoji: '☀️',
    color: '#FEF9C3',
    correctId: 'sunglasses',
    options: [
      { id: 'boots', emoji: '👢' },
      { id: 'sunglasses', emoji: '🕶️' },
      { id: 'scarf', emoji: '🧣' },
    ]
  },
  {
    id: 2,
    label: 'Rainy Day',
    emoji: '🌧️',
    color: '#DBEAFE',
    correctId: 'umbrella',
    options: [
      { id: 'umbrella', emoji: '☂️' },
      { id: 'sunhat', emoji: '👒' },
      { id: 'shorts', emoji: '🩳' },
    ]
  },
  {
    id: 3,
    label: 'Winter Day',
    emoji: '❄️',
    color: '#F3E8FF',
    correctId: 'jacket',
    options: [
      { id: 'tshirt', emoji: '👕' },
      { id: 'swimsuit', emoji: '🩱' },
      { id: 'jacket', emoji: '🧥' },
    ]
  },
  {
    id: 4,
    label: 'Autumn Day',
    emoji: '🍂',
    color: '#FFEDD5',
    correctId: 'scarf',
    options: [
      { id: 'scarf', emoji: '🧣' },
      { id: 'flipflops', emoji: '🩴' },
      { id: 'sunglasses', emoji: '🕶️' },
    ]
  },
  {
    id: 5,
    label: 'Beach Day',
    emoji: '🏖️',
    color: '#FEF3C7',
    correctId: 'swimsuit',
    options: [
      { id: 'parka', emoji: '🧥' },
      { id: 'swimsuit', emoji: '🩱' },
      { id: 'tie', emoji: '👔' },
    ]
  },
  {
    id: 6,
    label: 'Windy Day',
    emoji: '🌬️',
    color: '#F0FDFA',
    correctId: 'kite',
    options: [
      { id: 'kite', emoji: '🪁' },
      { id: 'heels', emoji: '👠' },
      { id: 'umbrella', emoji: '☂️' },
    ]
  }
];

export default function DressSeasonGame() {
  const [screen, setScreen] = useState('menu');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const active = SCENARIOS[currentIdx];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // FIXED: Explicit function to force navigation to Menu
  const handleGoToMenu = () => {
    setScreen('menu');
    setCurrentIdx(0); // Optional: reset progress when leaving
  };

  const handleChoice = (id: string) => {
    if (id === active.correctId) {
      setScore(s => s + 10);
      if (currentIdx < SCENARIOS.length - 1) {
        setCurrentIdx(currentIdx + 1);
      } else {
        handleGoToMenu();
      }
    }
  };

  const EnhancedBackground = () => (
    <View style={styles.absoluteBg}>
      <View style={[styles.blobStatic, { backgroundColor: COLORS.pinkBlob, top: -height * 0.1, left: -width * 0.2, width: width * 1.2, height: width * 1.2 }]} />
      <View style={[styles.blobStatic, { backgroundColor: COLORS.mintBlob, bottom: -height * 0.1, right: -width * 0.3, width: width * 1.3, height: width * 1.3 }]} />
      <Animated.View style={[styles.blobPulse, {
        backgroundColor: COLORS.blueBlob, top: height * 0.3, right: -width * 0.2,
        transform: [{ scale: pulseAnim.interpolate({inputRange:[0, 1], outputRange:[1, 1.3]}) }]
      }]} />
    </View>
  );

  if (screen === 'menu') {
    return (
      <View style={styles.fullScreen}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
        <EnhancedBackground />
        
        {/* Menu screen arrow (Purely decorative or for external navigation) */}
        <SafeAreaView style={styles.menuHeaderContainer}>
            <TouchableOpacity 
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              style={styles.transparentBackBtn} 
              onPress={() => console.log('Exit App')}>
                <Text style={styles.purpleArrowIcon}>←</Text>
            </TouchableOpacity>
        </SafeAreaView>

        <View style={styles.menuTop}>
          <Text style={{ fontSize: 150 }}>🌦️</Text>
          <View style={styles.heroBadge}>
             <Text style={styles.badgeText}>Seasons</Text>
          </View>
        </View>
        <View style={styles.menuBottom}>
          <Text style={styles.mainTitle}>DRESS THE{"\n"}SEASON</Text>
          <TouchableOpacity style={styles.mainBtn} onPress={() => setScreen('playing')}>
            <View style={styles.mainBtnShadow} />
            <View style={styles.mainBtnTop}><Text style={styles.mainBtnText}>Start now</Text></View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <EnhancedBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.gameHeader}>
          {/* FIXED: Added hitSlop and ensured high zIndex via transparentBackBtn style */}
          <TouchableOpacity 
            onPress={handleGoToMenu} 
            hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
            style={styles.transparentBackBtn}>
            <Text style={styles.purpleArrowIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>Points: {score}</Text>
          </View>
        </View>
        <View style={styles.gameBody}>
          <View style={styles.targetContainer}>
            <Text style={styles.targetEmoji}>{active.emoji}</Text>
            <Text style={styles.targetHint}>{active.label}</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <View style={styles.basketRow}>
            {active.options.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.basketTouch} onPress={() => handleChoice(item.id)}>
                <View style={[styles.basketCard, { backgroundColor: active.color }]}>
                    <View style={styles.basketRim} />
                    <Text style={{ fontSize: 45 }}>{item.emoji}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: '#FFFBF2' },
  absoluteBg: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  safeArea: { flex: 1, zIndex: 5 },
  blobStatic: { position: 'absolute', borderRadius: 1000 },
  blobPulse: { position: 'absolute', width: width * 0.7, height: width * 0.7, borderRadius: width * 0.35, opacity: 0.5 },
  
  // FIXED: Added zIndex to the buttons to ensure they aren't covered by invisible views
  menuHeaderContainer: { position: 'absolute', top: 20, left: 15, zIndex: 99 },
  transparentBackBtn: { padding: 10, backgroundColor: 'transparent', zIndex: 100 },
  purpleArrowIcon: { fontSize: 40, color: '#8B5CF6', fontWeight: 'bold' },

  menuTop: { flex: 3, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
  menuBottom: { flex: 2, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  heroBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 25, marginTop: 30 },
  badgeText: { color: '#059669', fontWeight: '900', fontSize: 20 },
  mainTitle: { fontSize: 48, fontWeight: '900', color: '#5B4D7B', textAlign: 'center', marginBottom: 30, lineHeight: 52 },
  mainBtn: { width: width * 0.85, height: 85 },
  mainBtnShadow: { position: 'absolute', top: 8, width: '100%', height: '100%', backgroundColor: '#BE94F5', borderRadius: 40 },
  mainBtnTop: { width: '100%', height: '100%', backgroundColor: '#E9D5FF', borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFFFFF' },
  mainBtnText: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  
  gameHeader: { width: '100%', paddingHorizontal: 15, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 },
  statsRow: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, elevation: 2 },
  statText: { fontSize: 18, fontWeight: '800', color: '#5B4D7B' },
  gameBody: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  targetContainer: { alignItems: 'center', width: '100%' },
  targetEmoji: { fontSize: 160, textAlign: 'center' },
  targetHint: { fontSize: 32, fontWeight: '900', color: '#5B4D7B', marginTop: 5 },
  footer: { width: '100%', paddingBottom: 30 },
  basketRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 15 },
  basketTouch: { width: '30%' },
  basketCard: { height: 130, borderRadius: 35, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 8, borderBottomColor: 'rgba(0,0,0,0.1)', elevation: 5 },
  basketRim: { position: 'absolute', top: 0, width: '100%', height: 25, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 30 },
});