import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MainHeaderShared from './MainHeaderShared';

const { width } = Dimensions.get('window');

interface Props {
  role: 'parent' | 'teacher';
}

export default function SharedMenu({ role }: Props) {
  const router = useRouter();
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const CATEGORIES = [
    { id: '1', title: 'Academic learning', color: '#E8E0FF', btnColor: '#C4A6FB', image: require('../assets/images/academic.png'), route: `/${role}/academic/academic`, audio: require('../assets/audio/academic.mp3') },
    { id: '2', title: 'Daily routine', color: '#E0F9E9', btnColor: '#A5E9B9', image: require('../assets/images/routine.png'), route: `/${role}/dailyroutine/dailyroutine`, audio: require('../assets/audio/routine.mp3') },
    { id: '3', title: 'General knowledge', color: '#FDE4E4', btnColor: '#FFADAD', image: require('../assets/images/gk.png'), route: `/${role}/gk/gk`, audio: require('../assets/audio/gk.mp3') },
    { id: '4', title: 'Islamic teachings', color: '#D4E9FF', btnColor: '#A2D2FF', image: require('../assets/images/islamic.png'), route: `/${role}/islamic/islamic`, audio: require('../assets/audio/islamic.mp3') },
    { id: '5', title: 'Fun games', color: '#F9E0F2', btnColor: '#F9A6DB', image: require('../assets/images/games.png'), route: `/${role}/games/games`, audio: require('../assets/audio/games.mp3') },
    { id: '6', title: 'Activities', color: '#E0F1F9', btnColor: '#A6DFF9', image: require('../assets/images/activity.png'), route: `/${role}/activity/activity`, audio: require('../assets/audio/activity.mp3') },
    { 
      id: '7', 
      title: role === 'teacher' ? 'Progress Board' : 'Parent panel', 
      color: '#E9F9E0', 
      btnColor: '#A5E9B9', 
      image: require('../assets/images/animals.png'), 
      route: role === 'teacher' ? '/teacher/activity/activity' : '/parent/parentpanel', 
      isParent: true, 
      audio: require('../assets/audio/parent.mp3') 
    },
  ];

  async function playAndNavigate(item: any) {
    if (sound) {
      await sound.unloadAsync();
    }
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(item.audio);
      setSound(newSound);
      await newSound.playAsync();
      setTimeout(() => {
        router.push(item.route as any);
      }, 1500);
    } catch (e) {
      router.push(item.route as any);
    }
  }

  useEffect(() => {
    return () => { if (sound) sound.unloadAsync(); };
  }, [sound]);

  const renderCard = (item: any) => (
    <TouchableOpacity
      key={item.id}
      activeOpacity={0.9}
      style={[styles.card, { backgroundColor: item.color }]}
      onPress={() => playAndNavigate(item)}
    >
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: item.btnColor }]}>{item.title}</Text>
        <View style={[styles.btn, { backgroundColor: item.btnColor }]}>
          <Text style={styles.btnText}>{item.isParent ? 'Check' : 'Start now'}</Text>
        </View>
      </View>
      <Image source={item.image} style={styles.cardImage} resizeMode="contain" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <MainHeaderShared role={role} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {CATEGORIES.map((item) => renderCard(item))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF9E9' },
  scrollContent: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 40 },
  card: { width: '100%', height: 160, borderRadius: 30, marginBottom: 20, flexDirection: 'row', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 10 },
  cardContent: { flex: 1, justifyContent: 'center', paddingLeft: 25, zIndex: 2 },
  cardTitle: { fontSize: 22, fontWeight: '900', marginBottom: 15, width: '60%' },
  btn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 15, alignSelf: 'flex-start', elevation: 4 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cardImage: { position: 'absolute', right: 10, bottom: 5, width: width * 0.4, height: '90%' }
});