import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  SafeAreaView, StatusBar,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#FFFBF2',      
  text: '#5B4D7B',    
  pinkBlob: '#FDE2E4',  
  mintBlob: '#E2F7ED',  
  blueBlob: '#E0F2FE',
  button: '#D8B4FE',  
  white: '#FFFFFF',
};

const PALETTE = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D', '#9333EA', '#FF9F43'];

export default function ColoringGame() {
  const [screen, setScreen] = useState('menu');
  const [activeColor, setActiveColor] = useState(PALETTE[0]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [score, setScore] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  const [houseColors, setHouseColors] = useState<any>({
    sun: '#FFF', roof: '#FFF', walls: '#FFF', door: '#FFF', grass: '#FFF',
  });

  const popupScale = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    let timer: any;
    if (screen === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft <= 0 && screen === 'playing') {
      triggerFinish();
    }
    return () => clearInterval(timer);
  }, [screen, timeLeft]);

  const startGame = () => {
    setHouseColors({ sun: '#FFF', roof: '#FFF', walls: '#FFF', door: '#FFF', grass: '#FFF' });
    setScore(0);
    setTimeLeft(20);
    setScreen('playing');
  };

  const handlePaint = (part: string) => {
    if (houseColors[part] === '#FFF') {
      setScore(s => s + 10);
    }
    setHouseColors({ ...houseColors, [part]: activeColor });
  };

  const triggerFinish = () => {
    setScreen('menu');
    setShowPopup(true);
    Animated.spring(popupScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  const EnhancedBackground = () => (
    <View style={StyleSheet.absoluteFill}>
      <View style={[styles.blob, { backgroundColor: COLORS.pinkBlob, top: -50, left: -50 }]} />
      <View style={[styles.blob, { backgroundColor: COLORS.mintBlob, bottom: -50, right: -50 }]} />
    </View>
  );

  if (screen === 'menu') {
    return (
      <View style={styles.container}>
        <EnhancedBackground />
        <Animated.Text style={[styles.mainTitle, { transform: [{ translateY: floatAnim.interpolate({inputRange:[0,1], outputRange:[0, -20]}) }] }]}>
          COLORING{"\n"}TIME! 🎨
        </Animated.Text>
        <TouchableOpacity style={styles.startBtn} onPress={startGame}>
            <Text style={styles.startBtnText}>START GAME</Text>
        </TouchableOpacity>

        <Modal transparent visible={showPopup} animationType="fade">
          <View style={styles.overlay}>
            <Animated.View style={[styles.popupCard, { transform: [{ scale: popupScale }] }]}>
              <Text style={{fontSize: 50}}>🌟</Text>
              <Text style={styles.popupTitle}>BEAUTIFUL!</Text>
              <Text style={styles.popupSub}>You earned {score} stars</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPopup(false)}>
                <Text style={styles.closeBtnText}>PLAY AGAIN</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.gameContainer}>
      <StatusBar barStyle="dark-content" />
      <EnhancedBackground />
      <View style={styles.header}>
        <Text style={styles.headerText}>Stars: {score} ⭐</Text>
        <View style={styles.timerBadge}><Text style={styles.timerText}>{timeLeft}s</Text></View>
        <TouchableOpacity onPress={() => setScreen('menu')}><Text style={{fontSize: 20, color: '#5B4D7B'}}>Exit</Text></TouchableOpacity>
      </View>

      <View style={styles.canvas}>
        <Text style={styles.instruction}>Tap the house to color it!</Text>
        <TouchableOpacity style={[styles.sun, { backgroundColor: houseColors.sun }]} onPress={() => handlePaint('sun')} />
        <View style={styles.houseContainer}>
          <TouchableOpacity style={[styles.roof, { borderBottomColor: houseColors.roof }]} onPress={() => handlePaint('roof')} />
          <TouchableOpacity style={[styles.walls, { backgroundColor: houseColors.walls }]} onPress={() => handlePaint('walls')}>
            <TouchableOpacity style={[styles.door, { backgroundColor: houseColors.door }]} onPress={() => handlePaint('door')} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.grass, { backgroundColor: houseColors.grass }]} onPress={() => handlePaint('grass')} />
      </View>

      <View style={styles.paletteContainer}>
        <Text style={styles.paletteTitle}>Pick a Magic Color:</Text>
        <View style={styles.paletteRow}>
          {PALETTE.map((color, idx) => (
            <TouchableOpacity key={idx} onPress={() => setActiveColor(color)}
              style={[styles.pencil, { backgroundColor: color, transform: [{ scale: activeColor === color ? 1.2 : 1 }] }, activeColor === color && styles.activePencil]}>
              {activeColor === color && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  gameContainer: { flex: 1, backgroundColor: COLORS.bg },
  blob: { position: 'absolute', width: width, height: width, borderRadius: width/2, opacity: 0.5 },
  mainTitle: { fontSize: 48, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 50 },
  startBtn: { backgroundColor: '#D8B4FE', paddingHorizontal: 40, paddingVertical: 18, borderRadius: 30, elevation: 5 },
  startBtnText: { color: 'white', fontSize: 22, fontWeight: '900' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 40, alignItems: 'center' },
  headerText: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  timerBadge: { backgroundColor: '#FFD93D', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15 },
  timerText: { fontSize: 18, fontWeight: '900' },
  canvas: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  instruction: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 40, opacity: 0.6 },
  sun: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#5B4D7B', position: 'absolute', top: 50, right: 40 },
  houseContainer: { alignItems: 'center' },
  roof: { width: 0, height: 0, borderStyle: 'solid', borderLeftWidth: 110, borderRightWidth: 110, borderBottomWidth: 100, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#FFF', marginBottom: -2 },
  walls: { width: 200, height: 160, borderWidth: 4, borderColor: '#5B4D7B', justifyContent: 'flex-end', alignItems: 'center' },
  door: { width: 50, height: 80, borderWidth: 4, borderColor: '#5B4D7B', borderBottomWidth: 0 },
  grass: { width: width, height: 100, borderTopWidth: 4, borderColor: '#5B4D7B', position: 'absolute', bottom: 0 },
  paletteContainer: { paddingBottom: 40, alignItems: 'center' },
  paletteTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 15 },
  paletteRow: { flexDirection: 'row', justifyContent: 'center', width: '100%' },
  pencil: { width: 45, height: 45, borderRadius: 22.5, marginHorizontal: 8, elevation: 3, justifyContent: 'center', alignItems: 'center' },
  activePencil: { borderWidth: 3, borderColor: '#5B4D7B' },
  check: { color: 'white', fontWeight: 'bold' },
  overlay: { flex: 1, backgroundColor: 'rgba(91, 77, 123, 0.7)', justifyContent: 'center', alignItems: 'center' },
  popupCard: { width: '80%', backgroundColor: '#FFF', borderRadius: 40, padding: 30, alignItems: 'center' },
  popupTitle: { fontSize: 32, fontWeight: '900', color: COLORS.text, marginTop: 15 },
  popupSub: { fontSize: 18, color: '#747D8C', marginVertical: 15 },
  closeBtn: { backgroundColor: '#D8B4FE', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  closeBtnText: { color: '#FFF', fontWeight: '900' }
});