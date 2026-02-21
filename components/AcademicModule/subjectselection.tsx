import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MainHeader from '../MainHeaderShared';

const SUBJECTS = [
  { id: 'English', name: 'English', color: '#E8E0FF', icon: 'text', textColor: '#8A70D6', audio: require('../../assets/audio/english.mp3') },
  { id: 'Urdu', name: 'Urdu', color: '#E0F9E9', icon: 'pencil', textColor: '#66BB6A', audio: require('../../assets/audio/urdu.mp3') },
  { id: 'Maths', name: 'Maths', color: '#FDE4E4', icon: 'calculator', textColor: '#E87D88', audio: require('../../assets/audio/maths.mp3') },
];

interface SubjectProps {
  role: 'parent' | 'teacher';
}

export default function SubjectSelection({ role }: SubjectProps) {
  const router = useRouter();
  const { grade } = useLocalSearchParams();
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  async function playAndNavigate(item: any) {
    const basePath = role === 'parent' ? '/parent/academic' : '/teacher/academic';
    try {
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync(item.audio);
      setSound(newSound);
      await newSound.playAsync();
      setTimeout(() => {
        router.push({ 
            pathname: `${basePath}/learningtype` as any, 
            params: { grade, subject: item.id } 
        });
      }, 1500);
    } catch (e) {
      router.push({ 
        pathname: `${basePath}/learningtype` as any, 
        params: { grade, subject: item.id } 
      });
    }
  }

  useEffect(() => {
    return () => { if(sound) sound.unloadAsync(); };
  }, [sound]);

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader role={role} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.gradeBadge}><Text style={styles.gradeBadgeText}>{grade}</Text></View>
      </View>

      <Text style={styles.title}>Pick a Subject</Text>

      <FlatList 
        data={SUBJECTS} 
        renderItem={({item}) => (
            <TouchableOpacity style={[styles.subjectCard, { backgroundColor: item.color }]} onPress={() => playAndNavigate(item)}>
              <View style={styles.subjectContent}>
                <View style={styles.iconContainer}>
                    <Ionicons name={item.icon as any} size={45} color={item.textColor} />
                </View>
                <Text style={[styles.subjectText, { color: item.textColor }]}>{item.name}</Text>
              </View>
              <Ionicons name="chevron-forward-circle" size={40} color={item.textColor} />
            </TouchableOpacity>
        )} 
        keyExtractor={item => item.id} 
        contentContainerStyle={styles.list} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backCircle: { backgroundColor: '#A2D2FF', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  gradeBadge: { marginLeft: 15, backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, elevation: 2, borderWidth: 2, borderColor: '#A2D2FF' },
  gradeBadgeText: { fontSize: 18, fontWeight: 'bold', color: '#A2D2FF' },
  title: { fontSize: 32, fontWeight: '900', color: '#444', textAlign: 'center', marginBottom: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  subjectCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 25, borderRadius: 40, marginBottom: 20, elevation: 6 },
  subjectContent: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { backgroundColor: '#FFF', padding: 15, borderRadius: 25, marginRight: 15 },
  subjectText: { fontSize: 28, fontWeight: '900' },
});