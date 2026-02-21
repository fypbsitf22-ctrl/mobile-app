import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function EditProfile() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Edit Profile Coming Soon! ✨</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9', justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, color: '#B48454', fontWeight: 'bold' }
});