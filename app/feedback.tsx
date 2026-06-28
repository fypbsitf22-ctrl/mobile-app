import { useRouter } from 'expo-router';
import { Send } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

export default function FeedbackScreen() {
  const router = useRouter();
  const [comment, setComment] = useState('');

  const sendFeedback = () => {
    if (comment.trim().length === 0) return;
    // Logic to save to Firebase goes here
    alert("Message Sent Successfully!");
    router.back();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Text style={styles.title}>Send Feedback / Comment</Text>
      <Text style={styles.subtitle}>Your message will be visible to the teacher and parent.</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Type your feedback here..."
        multiline
        numberOfLines={10}
        value={comment}
        onChangeText={setComment}
      />

      <TouchableOpacity style={styles.sendBtn} onPress={sendFeedback}>
        <Send color="white" size={20} />
        <Text style={styles.sendText}>Post Feedback</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: 30},
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#777', marginVertical: 10 },
  input: { backgroundColor: '#F9F9F9', borderRadius: 15, padding: 20, height: 200, textAlignVertical: 'top', borderWidth: 1, borderColor: '#EEE', marginTop: 20 },
  sendBtn: { backgroundColor: '#0D8ABC', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  sendText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 }
});