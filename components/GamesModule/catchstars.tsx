import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  SafeAreaView, StatusBar,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const COLORS = {
  bg: '#FFFBF2',      
  text: '#5B4D7B',    
  star: '#FFD93D',
  basket: '#D8B4FE',
  pinkBlob: '#FDE2E4',  
  mintBlob: '#E2F7ED',  
  blueBlob: '#E0F2FE',
  white: '#FFFFFF',
};

const BASKET_WIDTH = 100;
const STAR_SIZE = 40;
const GAME_TIME = 20;

export default function CatchStarsGame() {
  const [screen, setScreen] = useState('menu');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [stars, setStars] = useState<any[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  const basketX = useRef(new Animated.Value(width / 2 - BASKET_WIDTH / 2)).current;
  const popupScale = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        let newX = gestureState.moveX - BASKET_WIDTH / 2;
        if (newX < 0) newX = 0;
        if (newX > width - BASKET_WIDTH) newX = width - BASKET_WIDTH;
        basketX.setValue(newX);
      },
    })
  ).current;

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
    let spawnInterval: any;

    if (screen === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      spawnInterval = setInterval(() => spawnStar(), 800);
    } else if (timeLeft <= 0 && screen === 'playing') {
      setScreen('menu');
      setShowPopup(true);
      Animated.spring(popupScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    }

    return () => {
      clearInterval(timer);
      clearInterval(spawnInterval);
    };
  }, [screen, timeLeft]);

  const spawnStar = () => {
    const id = Math.random().toString();
    const startX = Math.random() * (width - STAR_SIZE);
    const fallAnim = new Animated.Value(-50);

    const newStar = { id, startX, fallAnim };
    setStars(prev => [...prev, newStar]);

    Animated.timing(fallAnim, {
      toValue: height + 50,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(() => {
      setStars(prev => prev.filter(s => s.id !== id));
    });

    let hitDetected = false;
    const checkCollision = () => {
      if (hitDetected) return;
      // @ts-ignore
      const currentY = fallAnim._value;
      // @ts-ignore
      const currentBasketX = basketX._value;

      if (currentY > height - 160 && currentY < height - 80) {
        if (startX + STAR_SIZE > currentBasketX && startX < currentBasketX + BASKET_WIDTH) {
          hitDetected = true;
          setScore(s => s + 1);
          setStars(prev => prev.filter(s => s.id !== id));
        }
      }
      if (currentY < height) requestAnimationFrame(checkCollision);
    };
    requestAnimationFrame(checkCollision);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_TIME);
    setStars([]);
    setScreen('playing');
  };

  const Background = () => (
    <View style={StyleSheet.absoluteFill}>
      <View style={[styles.blob, { backgroundColor: COLORS.pinkBlob, top: -50, left: -50 }]} />
      <View style={[styles.blob, { backgroundColor: COLORS.blueBlob, bottom: -50, right: -50 }]} />
    </View>
  );

  if (screen === 'menu') {
    return (
      <View style={styles.container}>
        <Background />
        <Animated.View style={{ transform: [{ translateY: floatAnim.interpolate({inputRange:[0,1], outputRange:[0, -30]}) }] }}>
            <Text style={styles.menuIcon}>⭐</Text>
        </Animated.View>
        <Text style={styles.mainTitle}>CATCH THE{"\n"}STARS!</Text>
        <TouchableOpacity style={styles.startBtn} onPress={startGame}>
            <Text style={styles.startBtnText}>START PLAYING</Text>
        </TouchableOpacity>

        <Modal transparent visible={showPopup} animationType="fade">
          <View style={styles.overlay}>
            <Animated.View style={[styles.popupCard, { transform: [{ scale: popupScale }] }]}>
              <Text style={{fontSize: 60}}>🎉</Text>
              <Text style={styles.popupTitle}>Well Done!</Text>
              <Text style={styles.popupSub}>You caught {score} stars!</Text>
              <TouchableOpacity style={styles.startBtn} onPress={() => {setShowPopup(false); popupScale.setValue(0);}}>
                <Text style={styles.startBtnText}>PLAY AGAIN</Text>
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
      <Background />
      <View style={styles.header}>
        <View style={styles.statBox}>
            <Text style={styles.statLabel}>STARS</Text>
            <Text style={styles.statValue}>{score}</Text>
        </View>
        <View style={styles.statBox}>
            <Text style={styles.statLabel}>TIME</Text>
            <Text style={[styles.statValue, {color: timeLeft < 6 ? '#FF6B6B' : COLORS.text}]}>{timeLeft}s</Text>
        </View>
      </View>

      <View style={styles.playArea}>
        {stars.map(star => (
          <Animated.View key={star.id} style={[styles.star, { left: star.startX, top: star.fallAnim }]}>
            <Text style={{fontSize: STAR_SIZE}}>⭐</Text>
          </Animated.View>
        ))}
      </View>

      <Animated.View {...panResponder.panHandlers} style={[styles.basket, { transform: [{ translateX: basketX }] }]}>
        <View style={styles.basketTop} />
        <Text style={styles.basketEmoji}>🧺</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  gameContainer: { flex: 1, backgroundColor: COLORS.bg },
  blob: { position: 'absolute', width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4, opacity: 0.5 },
  menuIcon: { fontSize: 100, marginBottom: 20 },
  mainTitle: { fontSize: 44, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 50 },
  startBtn: { backgroundColor: '#D8B4FE', paddingHorizontal: 40, paddingVertical: 18, borderRadius: 30, elevation: 5 },
  startBtnText: { color: 'white', fontSize: 22, fontWeight: '900' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, paddingTop: 40 },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 14, fontWeight: '800', color: '#A095B1' },
  statValue: { fontSize: 28, fontWeight: '900', color: COLORS.text },
  playArea: { flex: 1 },
  star: { position: 'absolute', width: STAR_SIZE, height: STAR_SIZE, justifyContent: 'center', alignItems: 'center' },
  basket: { position: 'absolute', bottom: 50, width: BASKET_WIDTH, height: 80, justifyContent: 'center', alignItems: 'center' },
  basketEmoji: { fontSize: 80 },
  basketTop: { position: 'absolute', top: 10, width: 70, height: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20 },
  overlay: { flex: 1, backgroundColor: 'rgba(91, 77, 123, 0.7)', justifyContent: 'center', alignItems: 'center' },
  popupCard: { width: '85%', backgroundColor: '#FFF', borderRadius: 40, padding: 40, alignItems: 'center' },
  popupTitle: { fontSize: 32, fontWeight: '900', color: COLORS.text, marginTop: 15 },
  popupSub: { fontSize: 18, color: '#747D8C', marginVertical: 20, textAlign: 'center' }
});