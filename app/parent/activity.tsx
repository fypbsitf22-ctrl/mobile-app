import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PlaceholderScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#B48454" />
        </TouchableOpacity>
        <Text style={styles.title}>Coming Soon! ✨</Text>
      </View>

      <View style={styles.content}>
        <Ionicons name="construct-outline" size={100} color="#FFC26D" />
        <Text style={styles.message}>
          We are building this page for you!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40 },
  backBtn: { padding: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#B48454', marginLeft: 15 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  message: { fontSize: 20, color: '#B48454', textAlign: 'center', marginTop: 20, fontWeight: '600' }
});