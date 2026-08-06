import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const QuickAction = ({ title, onPress, color, icon }: any) => (
  <TouchableOpacity 
    style={[styles.btn, { backgroundColor: color }]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.iconContainer}>{icon}</View>
    <Text style={styles.btnText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  btn: { 
    width: '31%', 
    aspectRatio: 1, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  iconContainer: { marginBottom: 5 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});