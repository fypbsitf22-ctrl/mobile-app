import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { supabase } from '../../supabaseConfig';
import MainHeader from '../MainHeaderShared';

 import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

const { width } = Dimensions.get('window');

export default function ActivityModule({ role }: { role: 'parent' | 'teacher' }) {
    const [activities, setActivities] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [gradeInput, setGradeInput] = useState<{ [key: string]: string }>({});

    // 1. LIFECYCLE: Fetch Data with Logout Safety
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        const qAct = query(collection(db, "activities"), orderBy("createdAt", "desc"));
        const unsubAct = onSnapshot(qAct, 
            (snap) => {
                setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                setLoading(false);
            },
            (err) => console.log("Listener closed safely")
        );

        let unsubSub = () => {};
        if (role === 'teacher') {
            const qSub = query(collection(db, "submissions"), orderBy("submittedAt", "desc"));
            unsubSub = onSnapshot(qSub, 
                (snap) => {
                    setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                },
                (err) => console.log("Submissions closed safely")
            );
        }

        return () => {
            unsubAct();
            unsubSub();
        };
    }, []);

    // 2. LOGIC: Process File Upload to Supabase


const processUpload = async (uri: string, name: string) => {
  setUploading(true);

  try {
    const fileExt = name.split('.').pop() || 'file';
    const fileName = `${Date.now()}.${fileExt}`;

    // ✅ Read file as base64 using legacy API
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    // ✅ Convert base64 to Uint8Array
    const bytes = new Uint8Array(Buffer.from(base64, 'base64'));

    const { error } = await supabase.storage
      .from('activity-files')
      .upload(fileName, bytes, {
        contentType: 'application/octet-stream',
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from('activity-files')
      .getPublicUrl(fileName);

    return data.publicUrl;

  } catch (error) {
    console.log("UPLOAD ERROR:", error);
    Alert.alert("Upload failed", "Please check internet connection.");
    return null;
  } finally {
    setUploading(false);
  }
};

    // 3. TEACHER FUNCTIONS
    const pickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
        if (result.canceled) return;
        const url = await processUpload(result.assets[0].uri, result.assets[0].name);
        if (url) saveActivityToFirebase(result.assets[0].name, url);
    };

    const saveActivityToFirebase = async (title: string, url: string) => {
        try {
            await addDoc(collection(db, "activities"), {
                title, 
                fileUrl: url, 
                createdAt: new Date().toISOString(),
                teacherName: auth.currentUser?.displayName || "Teacher"
            });
            Alert.alert("Success! 🌟", "New Activity posted!");
        } catch (e) { Alert.alert("Database Error", "Activity link not saved."); }
    };

    const handleGrade = async (submissionId: string) => {
        const grade = gradeInput[submissionId];
        if (!grade) return Alert.alert("Wait", "Enter marks/feedback.");
        try {
            await updateDoc(doc(db, "submissions", submissionId), { grade, status: "Graded" });
            Alert.alert("Done! ✅", "Student marks saved.");
        } catch (e) { Alert.alert("Error", "Could not save grade."); }
    };

    // 4. PARENT / STUDENT FUNCTIONS
    const saveSubmissionToFirebase = async (activityId: string, activityTitle: string, url: string) => {
        try {
            await addDoc(collection(db, "submissions"), {
                activityId, 
                activityTitle, 
                studentId: auth.currentUser?.uid,
                studentName: auth.currentUser?.displayName || auth.currentUser?.email || "Student",
                fileUrl: url, 
                grade: "", 
                status: "Pending", 
                submittedAt: new Date().toISOString()
            });
            Alert.alert("MASHALLAH! ✨", "Work submitted to teacher!");
        } catch (e) { Alert.alert("Error", "Submission record failed."); }
    };

    // 5. SHARED MEDIA PICKER (Camera or Gallery)
    const pickMedia = async (isCamera: boolean, target: 'activity' | 'submission', activityId?: string, activityTitle?: string) => {
        const result = isCamera 
            ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.7 })
            : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.7 });

        if (result.canceled) return;
        
        const fileName = result.assets[0].uri.split('/').pop() || 'upload.jpg';
        const url = await processUpload(result.assets[0].uri, fileName);
        
        if (url) {
            if (target === 'activity') saveActivityToFirebase("New Media Activity", url);
            else saveSubmissionToFirebase(activityId!, activityTitle!, url);
        }
    };

    // 6. RENDER COMPONENTS
    const renderActivity = ({ item }: any) => (
        <View style={styles.activityCard}>
            <View style={styles.cardHeader}>
                <View style={styles.iconCircle}><Ionicons name="color-palette" size={30} color="#FF9F43" /></View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSub}>Posted by: {item.teacherName}</Text>
                </View>
            </View>
            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cuteBtnBlue} onPress={() => Linking.openURL(item.fileUrl)}>
                    <Ionicons name="cloud-download" size={20} color="#FFF" />
                    <Text style={styles.btnText}>Download</Text>
                </TouchableOpacity>
                {role === 'parent' && (
                    <TouchableOpacity style={styles.cuteBtnGreen} onPress={() => pickMedia(false, 'submission', item.id, item.title)}>
                        <Ionicons name="camera" size={20} color="#FFF" />
                        <Text style={styles.btnText}>Send Work</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderSubmission = ({ item }: any) => (
        <View style={styles.submissionCard}>
            <Text style={styles.studentName}>{item.studentName}</Text>
            <Text style={styles.activityName}>{item.activityTitle}</Text>
            <TouchableOpacity style={styles.viewWorkBtn} onPress={() => Linking.openURL(item.fileUrl)}>
                <Ionicons name="eye" size={20} color="#4834D4" /><Text style={styles.viewWorkText}>See Student Work</Text>
            </TouchableOpacity>
            <View style={styles.gradeBox}>
                <TextInput 
                    style={styles.cuteInput} 
                    placeholder="Enter Grade" 
                    onChangeText={(text) => setGradeInput({...gradeInput, [item.id]: text})} 
                />
                <TouchableOpacity style={styles.gradeActionBtn} onPress={() => handleGrade(item.id)}>
                    <Ionicons name="checkmark" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <MainHeader role={role} />
            <View style={styles.headerArea}>
                <View>
                    <Text style={styles.helloText}>Activities</Text>
                    <Text style={styles.subLabel}>{role === 'teacher' ? 'Grade Work' : 'Learning Fun'}</Text>
                </View>
                {role === 'teacher' && (
                    <View style={styles.teacherActions}>
                        <TouchableOpacity style={[styles.miniBtn, {backgroundColor: '#A2D2FF'}]} onPress={pickDocument}>
                            <Ionicons name="folder" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.miniBtn, {backgroundColor: '#66BB6A'}]} onPress={() => pickMedia(true, 'activity')}>
                            <Ionicons name="camera" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {uploading && (
                <View style={styles.loaderBox}>
                    <ActivityIndicator size="large" color="#66BB6A" />
                    <Text style={styles.loaderText}>Sending to Cloud...</Text>
                </View>
            )}

            <FlatList
                data={role === 'teacher' ? submissions : activities}
                keyExtractor={item => item.id}
                renderItem={role === 'teacher' ? renderSubmission : renderActivity}
                contentContainerStyle={{ padding: 20 }}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF9E9' },
    headerArea: { padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    helloText: { fontSize: 32, fontWeight: '900', color: '#333' },
    subLabel: { fontSize: 16, color: '#999', fontWeight: 'bold' },
    teacherActions: { flexDirection: 'row' },
    miniBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginLeft: 10, elevation: 4 },
    activityCard: { backgroundColor: '#FFF', borderRadius: 30, padding: 20, marginBottom: 20, elevation: 8 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 19, fontWeight: 'bold', color: '#333' },
    cardSub: { fontSize: 13, color: '#999' },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
    cuteBtnBlue: { backgroundColor: '#A2D2FF', flexDirection: 'row', padding: 15, borderRadius: 20, flex: 0.48, justifyContent: 'center', alignItems: 'center' },
    cuteBtnGreen: { backgroundColor: '#66BB6A', flexDirection: 'row', padding: 15, borderRadius: 20, flex: 0.48, justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
    submissionCard: { backgroundColor: '#FFF', borderRadius: 30, padding: 20, marginBottom: 20, borderLeftWidth: 10, borderLeftColor: '#FFD700' },
    studentName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    activityName: { fontSize: 13, color: '#666', marginBottom: 10 },
    viewWorkBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0EFFF', padding: 10, borderRadius: 15, alignSelf: 'flex-start' },
    viewWorkText: { color: '#4834D4', fontWeight: 'bold', marginLeft: 5 },
    gradeBox: { flexDirection: 'row', marginTop: 15, alignItems: 'center' },
    cuteInput: { backgroundColor: '#F5F5F5', flex: 1, padding: 15, borderRadius: 20, marginRight: 10 },
    gradeActionBtn: { backgroundColor: '#FF9F43', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    loaderBox: { alignItems: 'center', marginVertical: 10 },
    loaderText: { color: '#66BB6A', fontWeight: 'bold', marginTop: 5 }
});