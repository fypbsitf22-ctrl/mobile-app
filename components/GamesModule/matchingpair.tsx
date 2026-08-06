import { useRouter } from 'expo-router'; // 1. Import Router
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
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
  tag: '#DCFCE7',      
  tagText: '#059669',
  cardBack: '#F3E8FF',
  lavender: '#E9D5FF'
};

const PAIR_ITEMS = ['⭐️', '🍀', '💎', '🍭', '🎈', '🎁', '🎨', '🚀'];

export default function MatchPairsGame() {
  const router = useRouter(); // 2. Initialize Router
  const [screen, setScreen] = useState('loading');
  const [cards, setCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [showPopup, setShowPopup] = useState(false);

  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const popupScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (screen === 'loading') {
      const t = setTimeout(() => setScreen('menu'), 2000);
      return () => clearTimeout(t);
    }
   
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      ])
    ).start();
  }, [screen]);

  useEffect(() => {
    let timer: any;
    if (screen === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft <= 0 && screen === 'playing') {
      triggerEnd();
    }
    return () => clearInterval(timer);
  }, [screen, timeLeft]);

  const initGame = () => {
    const selectedItems = PAIR_ITEMS.slice(0, 6);
    const gamePairs = [...selectedItems, ...selectedItems];
    const shuffled = gamePairs
      .sort(() => Math.random() - 0.5)
      .map((item, index) => ({ id: index, content: item }));
   
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setScore(0);
    setTimeLeft(45);
    setScreen('playing');
  };

  const handleFlip = (index: number) => {
    if (flipped.length === 2 || matched.includes(index) || flipped.includes(index)) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first].content === cards[second].content) {
        const newMatched = [...matched, first, second];
        setMatched(newMatched);
        setFlipped([]);
        setScore(s => s + 50);
        if (newMatched.length === cards.length) {
          setTimeout(() => triggerEnd(), 500);
        }
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  const triggerEnd = () => {
    setShowPopup(true);
    popupScale.setValue(0);
    Animated.spring(popupScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    setScreen('menu');
  };

  const Background = () => (
    <View style={StyleSheet.absoluteFill}>
      <View style={[styles.blob, { backgroundColor: COLORS.pinkBlob, top: -height * 0.1, left: -width * 0.3 }]} />
      <View style={[styles.blob, { backgroundColor: COLORS.mintBlob, bottom: -height * 0.1, right: -width * 0.3 }]} />
      <Animated.View style={[styles.pulseBlob, {
        backgroundColor: COLORS.blueBlob, top: height * 0.4, right: -width * 0.1,
        transform: [{ scale: pulseAnim.interpolate({inputRange:[0, 1], outputRange:[1, 1.2]}) }]
      }]} />
    </View>
  );

  if (screen === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.button} />
        <Text style={styles.loadingText}>LOADING PAIRS...</Text>
      </View>
    );
  }

  if (screen === 'menu') {
    return (
      <View style={styles.mainContainer}>
        <Background />

        {/* 3. Back Arrow on Menu */}
        <TouchableOpacity style={styles.menuBackBtn} onPress={() => router.back()}>
            <Text style={styles.purpleArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.topSection}>
          <Animated.View style={{ transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }) }] }}>
            <View style={styles.heroCard}>
               <View style={styles.gridRow}><Text style={styles.gridEmoji}>⭐️</Text><Text style={styles.gridEmoji}>⭐️</Text></View>
               <View style={styles.gridRow}><Text style={styles.gridEmoji}>💎</Text><Text style={styles.gridEmoji}>💎</Text></View>
               <View style={styles.heroBadge}><Text style={styles.badgeText}>Matching Pairs</Text></View>
            </View>
          </Animated.View>
        </View>
        <View style={styles.bottomSection}>
          <Text style={styles.mainTitle}>MATCH THE{"\n"}PAIRS</Text>
          <TouchableOpacity style={styles.mainBtn} onPress={initGame}>
            <View style={styles.btnShadow} /><View style={styles.btnTop}><Text style={styles.btnText}>Start now</Text></View>
          </TouchableOpacity>
        </View>

        <Modal transparent visible={showPopup} animationType="fade">
          <View style={styles.overlay}>
            <Animated.View style={[styles.popup, { transform: [{ scale: popupScale }] }]}>
              <View style={styles.ribbon}><Text style={styles.ribbonText}>WELL DONE!</Text></View>
              <Text style={{ fontSize: 75 }}>🦁</Text>
              <Text style={styles.scoreText}>Points: {score}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPopup(false)}>
                <Text style={styles.closeBtnText}>Play Again</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.gameContainer}>
      <Background />
      <View style={styles.gameHeader}>
        {/* 4. Purple Arrow Back in Game Header (No background) */}
        <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.purpleArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.stats}><Text style={styles.statLabel}>Pts: {score}</Text><Text style={styles.statLabel}>Time: {timeLeft}s</Text></View>
      </View>
      <View style={styles.gridContainer}>
        <View style={styles.cardGrid}>
          {cards.map((item, index) => {
            const isVisible = flipped.includes(index) || matched.includes(index);
            return (
              <TouchableOpacity key={index} style={styles.cardWrapper} onPress={() => handleFlip(index)}>
                <View style={[styles.card, { backgroundColor: isVisible ? COLORS.white : COLORS.cardBack }]}>
                  <Text style={styles.cardEmoji}>{isVisible ? item.content : '?'}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  mainContainer: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'space-between' },
  gameContainer: { flex: 1, backgroundColor: COLORS.bg },
  
  // Arrow Styling
  purpleArrow: {
    fontSize: 45,
    color: '#D8B4FE',
    fontWeight: 'bold',
  },
  menuBackBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10
  },

  loadingText: { marginTop: 20, fontSize: 24, fontWeight: '900', color: COLORS.text },
  blob: { position: 'absolute', width: width * 1.2, height: width * 1.2, borderRadius: width * 0.6 },
  pulseBlob: { position: 'absolute', width: width * 0.6, height: width * 0.6, borderRadius: width * 0.3, opacity: 0.4 },
  topSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroCard: { width: width * 0.72, height: width * 0.72, backgroundColor: COLORS.white, borderRadius: 60, justifyContent: 'center', alignItems: 'center', elevation: 10, borderBottomWidth: 10, borderBottomColor: COLORS.pinkBlob },
  gridRow: { flexDirection: 'row' },
  gridEmoji: { fontSize: 55, margin: 10 },
  heroBadge: { backgroundColor: COLORS.tag, paddingHorizontal: 25, paddingVertical: 10, borderRadius: 25, marginTop: 20 },
  badgeText: { color: COLORS.tagText, fontWeight: '900', fontSize: 18 },
  bottomSection: { width: '100%', alignItems: 'center', paddingBottom: 70 },
  mainTitle: { fontSize: 46, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 35 },
  mainBtn: { width: width * 0.8, height: 85 },
  btnShadow: { position: 'absolute', top: 10, width: '100%', height: '100%', backgroundColor: '#BE94F5', borderRadius: 40 },
  btnTop: { width: '100%', height: '100%', backgroundColor: '#E9D5FF', borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.white },
  btnText: { color: COLORS.white, fontSize: 26, fontWeight: '900' },
  
  gameHeader: { 
    width: '100%', 
    paddingHorizontal: 20, 
    paddingTop: 30, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  stats: { alignItems: 'flex-end' },
  statLabel: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  gridContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 15 },
  cardGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  cardWrapper: { width: (width - 70) / 3, height: (width - 70) / 3, margin: 8 },
  card: { flex: 1, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  cardEmoji: { fontSize: 42, fontWeight: '900', color: '#5B4D7B' },
  overlay: { flex: 1, backgroundColor: 'rgba(91, 77, 123, 0.6)', justifyContent: 'center', alignItems: 'center' },
  popup: { width: width * 0.85, backgroundColor: COLORS.white, borderRadius: 55, padding: 35, alignItems: 'center', borderBottomWidth: 15, borderBottomColor: '#F3F4F6' },
  ribbon: { backgroundColor: COLORS.mintBlob, paddingHorizontal: 35, paddingVertical: 12, borderRadius: 25, marginTop: -70, marginBottom: 25 },
  ribbonText: { color: COLORS.tagText, fontSize: 24, fontWeight: '900' },
  scoreText: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginVertical: 20 },
  closeBtn: { backgroundColor: COLORS.button, paddingVertical: 18, paddingHorizontal: 60, borderRadius: 35 },
  closeBtnText: { color: COLORS.white, fontWeight: '900', fontSize: 20 }
});