import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';

const { width } = Dimensions.get('window');

const BuddyItem = ({ item, isSelected, onSelect, disabled }: any) => {
  const isLottie = item.image?.endsWith('.json');
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: scale.value }] };
  });

  const handlePress = () => {
    if (disabled) return; // Prevent clicking while audio plays
    scale.value = withSequence(withSpring(1.3), withSpring(1));
    onSelect(item);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={disabled ? 1 : 0.9}>
      <Animated.View style={[styles.card, isSelected && styles.selectedCard, animatedStyle]}>
        {isLottie ? (
          <LottieView source={{ uri: item.image }} autoPlay loop style={styles.buddyImage} />
        ) : (
          <Image source={{ uri: item.image }} style={styles.buddyImage} resizeMode="contain" />
        )}
        <Text style={styles.buddyName}>{item.name}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function ChooseBuddy() {
  const router = useRouter();
  const [buddies, setBuddies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // NEW: Track if sound is playing

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  useEffect(() => {
    async function fetchBuddies() {
      try {
        const querySnapshot = await getDocs(collection(db, "buddies"));
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBuddies(list);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchBuddies();
  }, []);

  const handleSelection = async (buddy: any) => {
    if (isProcessing) return; // Stop user from clicking multiple times
    
    setIsProcessing(true);
    setSelectedId(buddy.id);

    // 1. Play the Audio
    if (buddy.audio) {
      try {
        if (sound) await sound.unloadAsync();
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: buddy.audio },
          { shouldPlay: true }
        );
        setSound(newSound);
      } catch (error) {
        console.log("Audio Error:", error);
      }
    }

    // 2. Update Firestore
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          selectedBuddy: buddy.image,
          buddyName: buddy.name
        });

        // 3. WAIT FOR 3 SECONDS (Audio Duration)
        // We use 3200ms to give a tiny buffer so the voice fully finishes
        setTimeout(() => {
          router.replace('/parent/main');
        }, 3200); 
      }
    } catch (e) {
      console.log(e);
      setIsProcessing(false); // Reset if error occurs
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFC26D" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pick a Friend! ✨</Text>
        <Text style={styles.subtitle}>Who do you want to learn with today?</Text>
      </View>

      <FlatList
        data={buddies}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <BuddyItem 
            item={item} 
            isSelected={selectedId === item.id} 
            onSelect={handleSelection}
            disabled={isProcessing} // Disable items while sound plays
          />
        )}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextButton, isProcessing && { opacity: 0.6 }]} 
          onPress={() => !isProcessing && router.replace('/parent/main')}
          disabled={isProcessing}
        >
          <Text style={styles.nextButtonText}>
            {isProcessing ? "Wait for it..." : "Next"}
          </Text>
          {!isProcessing && <Ionicons name="arrow-forward" size={24} color="#FFF" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 30, alignItems: 'center' },
  title: { fontSize: 36, fontWeight: '900', color: '#E87D88', textAlign: 'center' },
  subtitle: { fontSize: 18, color: '#B48454', textAlign: 'center', marginTop: 10 },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  row: { justifyContent: 'space-around' },
  card: {
    backgroundColor: '#FFF',
    width: width * 0.42,
    height: width * 0.5,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#FDEFD9',
    elevation: 5,
  },
  selectedCard: { borderColor: '#FFC26D', backgroundColor: '#FFF4E5' },
  buddyImage: { width: 100, height: 100, marginBottom: 15 },
  buddyName: { fontSize: 20, fontWeight: 'bold', color: '#B48454' },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: width,
    padding: 20,
    backgroundColor: 'rgba(255, 249, 233, 0.9)',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#FFC26D',
    flexDirection: 'row',
    width: '90%',
    height: 65,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  nextButtonText: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginRight: 10 },
});