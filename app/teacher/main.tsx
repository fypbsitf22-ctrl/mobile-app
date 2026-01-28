import { StyleSheet, Text, View } from 'react-native';

export default function Main() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is teacher  Main Page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
  },
});
