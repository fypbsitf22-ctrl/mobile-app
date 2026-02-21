import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MainHeader from '../MainHeaderShared';

interface TypeProps {
  role: 'parent' | 'teacher';
}

export default function LearningType({ role }: TypeProps) {
  const router = useRouter();
  const { grade, subject } = useLocalSearchParams();
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  async function playAndNavigate(type: string) {
    const basePath = role === 'parent' ? '/parent/academic' : '/teacher/academic';
    const audioFile = type === 'Reading' ? require('../../assets/audio/reading.mp3') : require('../../assets/audio/writing.mp3');
    try {
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
      setSound(newSound);
      await newSound.playAsync();
      
      setTimeout(() => {
        router.push({ 
            pathname: `${basePath}/contentlist` as any, 
            params: { grade, subject, type } 
        });
      }, 1500);
    } catch (e) {
      router.push({ 
        pathname: `${basePath}/contentlist` as any, 
        params: { grade, subject, type } 
      });
    }
  }

  useEffect(() => {
    return () => { if(sound) sound.unloadAsync(); };
  }, [sound]);

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader role={role} />
      <View style={styles.headerRow}>
        {/* MODIFIED: Explicitly navigate to subjectselection with grade param */}
        <TouchableOpacity 
          onPress={() => router.push({
            pathname: (role === 'parent' ? '/parent/academic/subjectselection' : '/teacher/academic/subjectselection') as any,
            params: { grade }
          })} 
          style={styles.backCircle}
        >
            <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.contextBadge}>
            <Text style={styles.contextText}>{subject} - {grade}</Text>
        </View>
      </View>

      <Text style={styles.mainTitle}>What do you want to do?</Text>
      
      <View style={styles.btnContainer}>
        <TouchableOpacity style={styles.bigBtn} onPress={() => playAndNavigate('Reading')}>
          <View style={styles.iconBox}><Ionicons name="eye" size={40} color="#66BB6A" /></View>
          <Text style={styles.btnText}>Reading</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigBtn, {backgroundColor: '#D4E9FF'}]} onPress={() => playAndNavigate('Writing')}>
          <View style={[styles.iconBox, {backgroundColor: '#FFF'}]}><Ionicons name="brush" size={40} color="#5A9BD5" /></View>
          <Text style={[styles.btnText, {color: '#5A9BD5'}]}>Writing</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backCircle: { backgroundColor: '#A2D2FF', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  contextBadge: { marginLeft: 15, backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 2, borderColor: '#D4E9FF' },
  contextText: { fontSize: 16, fontWeight: 'bold', color: '#5A9BD5' },
  mainTitle: { fontSize: 28, fontWeight: '900', color: '#444', textAlign: 'center', marginTop: 10 },
  btnContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 25 },
  bigBtn: { backgroundColor: '#E0F9E9', width: '100%', paddingVertical: 35, borderRadius: 50, alignItems: 'center', marginBottom: 25, elevation: 8 },
  iconBox: { backgroundColor: '#FFF', padding: 15, borderRadius: 30, marginBottom: 10 },
  btnText: { fontSize: 36, fontWeight: '900', color: '#66BB6A' },
});