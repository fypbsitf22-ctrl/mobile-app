import { User, Users } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// We use 'export' here (named export)
export function ToggleHeader({ activeView, onToggle, title }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>{title}</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          onPress={() => onToggle('parent')}
          style={[styles.toggleBtn, activeView === 'parent' && styles.activeBtn]}
        >
          <User size={18} color={activeView === 'parent' ? 'white' : '#666'} />
          <Text style={[styles.btnText, activeView === 'parent' && styles.activeText]}>Parent View</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => onToggle('teacher')}
          style={[styles.toggleBtn, activeView === 'teacher' && styles.activeBtn]}
        >
          <Users size={18} color={activeView === 'teacher' ? 'white' : '#666'} />
          <Text style={[styles.btnText, activeView === 'teacher' && styles.activeText]}>Teacher View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 50, backgroundColor: '#FFFAF3' },
  titleText: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 25, padding: 4 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 22 },
  activeBtn: { backgroundColor: '#0D8ABC' },
  btnText: { marginLeft: 8, fontSize: 13, color: '#666', fontWeight: '600' },
  activeText: { color: 'white' }
});