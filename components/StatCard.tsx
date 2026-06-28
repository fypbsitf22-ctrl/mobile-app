import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <View style={styles.card}>
    <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
      <Icon color={color} size={20} />
    </View>
    <View>
      <Text style={styles.valText}>{value}</Text>
      <Text style={styles.labelText}>{label}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', width: '48%', padding: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  iconCircle: { width: 35, height: 35, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  valText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  labelText: { fontSize: 10, color: '#888', fontWeight: '600' }
});