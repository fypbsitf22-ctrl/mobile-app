import { Ionicons } from '@expo/vector-icons';
import { Buffer } from 'buffer';
import { Audio, ResizeMode, Video } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as IntentLauncher from 'expo-intent-launcher';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { auth, db } from '../../firebaseConfig';
import { supabase } from '../../supabaseConfig';
import MainHeader from '../MainHeaderShared';

global.Buffer = global.Buffer || Buffer;
const { width } = Dimensions.get('window');

export default function ActivityModule({ role }: { role: 'parent' | 'teacher' }) {
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successType, setSuccessType] = useState<'download' | 'submit'>('download');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ coll: string, id: string } | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState<{ [key: string]: string }>({});
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerType, setViewerType] = useState<'image' | 'video' | 'pdf' | null>(null);
  
  const [instruction1, setInstruction1] = useState<string | null>(null);
  const [instruction2, setInstruction2] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [submitSuccessUrl, setSubmitSuccessUrl] = useState<string | null>(null);
  const [sendWorkUrl, setSendWorkUrl] = useState<string | null>(null);
  const [warningUrl, setWarningUrl] = useState<string | null>(null);
  const [teacherTab, setTeacherTab] = useState<'submissions' | 'myActivities'>('submissions');
  const [parentTab, setParentTab] = useState<'available' | 'mySubmissions'>('available');

  const soundRef = useRef<Audio.Sound | null>(null);
  const popupScale = useRef(new Animated.Value(0)).current;

  const playSound = async (url: string | null) => {
    if (!url) return;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      soundRef.current = sound;
      await sound.playAsync();
    } catch (e) {
      console.log("Audio Playback Error:", e);
    }
  };

  useEffect(() => {
    if (role === 'parent') {
      const url = parentTab === 'available' ? instruction1 : instruction2;
      if (url) playSound(url);
    }
  }, [parentTab, instruction1, instruction2]);

  useEffect(() => {
    let unsubAct: (() => void) | null = null;
    let unsubSub: (() => void) | null = null;
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        if (unsubAct) {
          unsubAct();
          unsubAct = null;
        }
        if (unsubSub) {
          unsubSub();
          unsubSub = null;
        }
        setActivities([]);
        setSubmissions([]);
        setLoading(false);
        return;
      }
      try {
        const configSnap = await getDoc(doc(db, "app_config", "activity_sounds"));
        if (configSnap.exists()) {
          const data = configSnap.data();
          setInstruction1(data.instruction1_url);
          setInstruction2(data.instruction2_url);
          setSuccessUrl(data.success1_url);
          setSubmitSuccessUrl(data.success3_url);
          setSendWorkUrl(data.sendwork_url);
          setWarningUrl(data.warning1_url);
        }
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (!userSnap.exists()) {
          setLoading(false);
          return;
        }
        const userData = userSnap.data();
        const connectionId = userData?.teacherId;
        const qAct = query(collection(db, "activities"), where("teacherId", "==", role === 'teacher' ? user.uid : connectionId), orderBy("createdAt", "desc"));
        unsubAct = onSnapshot(qAct, (snap) => {
          setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        }, (err) => {
          if (err.code !== 'permission-denied') console.log("Act error:", err);
        });
        const qSub = role === 'teacher' ? query(collection(db, "submissions"), where("teacherId", "==", user.uid), orderBy("submittedAt", "desc")) : query(collection(db, "submissions"), where("studentId", "==", user.uid), orderBy("submittedAt", "desc"));
        unsubSub = onSnapshot(qSub, (snap) => {
          setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => {
          if (err.code !== 'permission-denied') console.log("Sub error:", err);
        });
      } catch (e) {
        console.log("Error fetching data:", e);
        setLoading(false);
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubAct) {
        unsubAct();
        unsubAct = null;
      }
      if (unsubSub) {
        unsubSub();
        unsubSub = null;
      }
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, [role]);

  const triggerSuccessPopup = (type: 'download' | 'submit') => {
    setSuccessType(type);
    setShowSuccessPopup(true);
    popupScale.setValue(0);
    Animated.spring(popupScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    if (role === 'parent') {
      const soundToPlay = type === 'download' ? successUrl : submitSuccessUrl;
      if (soundToPlay) playSound(soundToPlay);
    }
    setTimeout(() => {
      setShowSuccessPopup(false);
    }, 4000);
  };

  const processUpload = async (uri: string, name: string) => {
    setUploading(true);
    try {
      const fileExt = name.split('.').pop() || 'file';
      const fileName = `${Date.now()}.${fileExt}`;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const bytes = new Uint8Array(Buffer.from(base64, 'base64'));
      const { error } = await supabase.storage.from('activity-files').upload(fileName, bytes, { contentType: 'application/octet-stream' });
      if (error) throw error;
      const { data } = supabase.storage.from('activity-files').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      Alert.alert("Upload failed", "Check connection.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const saveActivityToFirebase = async (title: string, url: string) => {
    try {
      await addDoc(collection(db, "activities"), { title, fileUrl: url, createdAt: new Date().toISOString(), teacherId: auth.currentUser?.uid, teacherName: auth.currentUser?.displayName || "Teacher" });
      Alert.alert("Activity Published", "Material is now live.");
    } catch (e) {
      Alert.alert("Error", "Save failed.");
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (result.canceled) return;
    const asset = result.assets[0];
    const url = await processUpload(asset.uri, asset.name);
    if (url) saveActivityToFirebase(asset.name, url);
  };

  const pickMedia = async (isCamera: boolean, target: 'activity' | 'submission', activityId?: string, activityTitle?: string, activityTeacherId?: string) => {
    try {
      let result;
      if (isCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Alert.alert("Permission Denied", "Camera access required.");
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.7 });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.7 });
      }
      if (result.canceled) return;
      const asset = result.assets[0];
      const url = await processUpload(asset.uri, asset.fileName || `media_${Date.now()}`);
      if (!url) return;
      if (target === 'activity') {
        await saveActivityToFirebase(asset.fileName || "New Activity", url);
      } else if (target === 'submission' && activityId && activityTeacherId) {
        await addDoc(collection(db, "submissions"), { activityId, activityTitle, teacherId: activityTeacherId, studentId: auth.currentUser?.uid, studentName: auth.currentUser?.displayName || "Student", fileUrl: url, grade: "", status: "Pending", submittedAt: new Date().toISOString() });
        triggerSuccessPopup('submit');
      }
    } catch (e) {
      console.log("pickMedia error:", e);
      Alert.alert("Error", "Could not process media.");
    }
  };

  const sendWork = (item: any) => {
    if (sendWorkUrl) playSound(sendWorkUrl);
    setSelectedActivity(item);
    setShowSubmitModal(true);
    popupScale.setValue(0);
    Animated.spring(popupScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  const handlePickFileSubmission = async () => {
    if (!selectedActivity) return;
    setShowSubmitModal(false);
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (result.canceled) return;
    const asset = result.assets[0];
    const url = await processUpload(asset.uri, asset.name);
    if (url) {
      await addDoc(collection(db, "submissions"), { activityId: selectedActivity.id, activityTitle: selectedActivity.title, teacherId: selectedActivity.teacherId, studentId: auth.currentUser?.uid, studentName: auth.currentUser?.displayName || "Student", fileUrl: url, grade: "", status: "Pending", submittedAt: new Date().toISOString() });
      triggerSuccessPopup('submit');
    }
  };

  const handleDownload = async (remoteUrl: string, title: string) => {
  setUploading(true);
  try {
    const fileExt = remoteUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'pdf';
    const fileName = `${title.replace(/\s+/g, '_')}.${fileExt}`;
    const localUri = `${FileSystem.documentDirectory}${fileName}`;

    const downloadResult = await FileSystem.downloadAsync(remoteUrl, localUri);

    if (downloadResult.status === 200) {
      let finalUri = downloadResult.uri;

      // ✅ ANDROID: Save to Downloads folder (REAL FIX)
      try {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const uri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            getMimeType(fileExt)
          );

          await FileSystem.writeAsStringAsync(uri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          finalUri = uri;
        }
      } catch (e) {
        console.log("SAF Save Error:", e);
      }

      // ✅ MEDIA FILES (images/videos) → gallery
      const isMedia = ['jpg', 'jpeg', 'png', 'mp4'].includes(fileExt);
      if (isMedia) {
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync(false);
          if (status === 'granted') {
            await MediaLibrary.createAssetAsync(downloadResult.uri);
          }
        } catch (libErr) {
          console.log("Media Library Save Skip", libErr);
        }
      }

      setUploading(false);
      triggerSuccessPopup('download');

      // ✅ Open AFTER popup
      setTimeout(async () => {
        try {
          const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1,
            type: getMimeType(fileExt),
          });
        } catch (err) {
          Alert.alert("Error", "No app found to open this file.");
        }
      }, 3900);
    }
  } catch (e) {
    setUploading(false);
    Alert.alert("Error", "Download failed.");
  }
};

  const getMimeType = (ext: string) => {
    ext = ext.toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'mp4') return 'video/mp4';
    if (ext === 'mp3') return 'audio/mpeg';
    return '*/*';
  };

  const handleViewWork = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
      setViewerType('image');
    } else if (ext === 'mp4') {
      setViewerType('video');
    } else {
      setViewerType('pdf');
    }
    setViewerUrl(url);
    setViewerVisible(true);
  };

  const handleDelete = async (coll: string, id: string) => {
    if (warningUrl) playSound(warningUrl);
    setItemToDelete({ coll, id });
    setShowDeleteModal(true);
    popupScale.setValue(0);
    Animated.spring(popupScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteDoc(doc(db, itemToDelete.coll, itemToDelete.id));
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleGrade = async (submissionId: string) => {
    const grade = gradeInput[submissionId];
    if (!grade) return Alert.alert("Wait", "Enter marks.");
    try {
      await updateDoc(doc(db, "submissions", submissionId), { grade, status: "Graded" });
      Alert.alert("Success ✅", "Marks assigned.");
    } catch (e) {
      Alert.alert("Error", "Could not save.");
    }
  };

  const renderActivity = ({ item }: any) => (
    <View style={styles.activityCard}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}><Ionicons name="document-text" size={28} color="#FF9F43" /></View>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSub}>By: {item.teacherName}</Text>
        </View>
        {role === 'teacher' && teacherTab === 'myActivities' && (
          <TouchableOpacity onPress={() => handleDelete("activities", item.id)}>
            <Ionicons name="trash-outline" size={24} color="#9575CD" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.cuteBtnBlue} 
          onPress={() => { 
            if (role === 'teacher' && teacherTab === 'myActivities') { 
              handleViewWork(item.fileUrl); 
            } else { 
              handleDownload(item.fileUrl, item.title); 
            } 
          }} 
        >
          <Ionicons 
            name={(role === 'teacher' && teacherTab === 'myActivities') ? "eye" : "cloud-download"} 
            size={20} 
            color="#FFF" 
          />
          <Text style={styles.btnText}> 
            {(role === 'teacher' && teacherTab === 'myActivities') ? 'View Work' : 'Download Work'} 
          </Text>
        </TouchableOpacity>
        
        {role === 'parent' && (
          <TouchableOpacity style={styles.cuteBtnGreen} onPress={() => sendWork(item)}>
            <Ionicons name="camera" size={20} color="#FFF" />
            <Text style={styles.btnText}>Send Work</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderSubmission = ({ item }: any) => (
    <View style={styles.activityCard}>
      {item.grade && (
        <View style={styles.starBadge}>
          <Ionicons name="star" size={20} color="#FFD700" />
        </View>
      )}
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}><Ionicons name="checkmark-circle" size={28} color="#5A9BD5" /></View>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={styles.cardTitle}>{item.activityTitle}</Text>
          {role === 'teacher' && (
            <Text style={[styles.cardSub, { color: '#5A9BD5', fontWeight: 'bold' }]}> Student: {item.studentName} </Text>
          )}
          <Text style={styles.cardSub}>Status: {item.status}</Text>
        </View>
        {role === 'parent' && (
          <TouchableOpacity onPress={() => handleDelete("submissions", item.id)}>
            <Ionicons name="trash-outline" size={24} color="#9575CD" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cuteBtnBlue} onPress={() => {
  if (role === 'parent') {
    handleViewWork(item.fileUrl);
  } else if (role === 'teacher' && teacherTab === 'submissions') {
    handleDownload(item.fileUrl, item.activityTitle);
  }
}} >
          <Ionicons name={role === 'parent' ? "eye" : "cloud-download"} size={20} color="#FFF" />
          <Text style={styles.btnText}> {role === 'parent' ? 'View Work' : 'Download'} </Text>
        </TouchableOpacity>
        <View style={[styles.statusBadge, { flex: 0.48, justifyContent: 'center', alignItems: 'center' }, item.grade ? { backgroundColor: '#4CAF50', borderColor: '#388E3C' } : { backgroundColor: '#F5F5F5', borderColor: '#DDD' }]}>
          <Text style={[styles.statusText, item.grade ? { color: '#FFF' } : { color: '#777' }]}> {item.grade ? `Marks: ${item.grade}` : "Waiting..."} </Text>
        </View>
      </View>
      {role === 'teacher' && (
        <View style={styles.gradeBox}>
          <TextInput style={styles.cuteInput} placeholder="Marks" keyboardType="numeric" onChangeText={(text) => setGradeInput({ ...gradeInput, [item.id]: text })} />
          <TouchableOpacity style={styles.gradeActionBtn} onPress={() => handleGrade(item.id)}>
            <Ionicons name="checkmark" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MainHeader role={role} />
      <Modal visible={viewerVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity onPress={() => setViewerVisible(false)} style={{ padding: 15 }}>
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          {viewerType === 'image' && viewerUrl && <Image source={{ uri: viewerUrl }} style={{ flex: 1, resizeMode: 'contain' }} />}
          {viewerType === 'video' && viewerUrl && <Video source={{ uri: viewerUrl }} useNativeControls resizeMode={ResizeMode.CONTAIN} style={{ flex: 1 }} />}
          {viewerType === 'pdf' && viewerUrl && (
            <WebView source={{ uri: `https://docs.google.com/gview?embedded=true&url=${viewerUrl}` }} style={{ flex: 1 }} />
          )}
        </SafeAreaView>
      </Modal>
      <Modal visible={showSuccessPopup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.rewardBox, { transform: [{ scale: popupScale }] }]}>
            <View style={[styles.iconCircleLarge, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
            </View>
            <Text style={styles.wellDoneText}>GREAT JOB! ✅</Text>
            <Text style={styles.rewardSubText}> {successType === 'download' ? "your activity is downloaded successfully 🎉" : "your activity is submitted successfully 🎉"} </Text>
          </Animated.View>
        </View>
      </Modal>
      <Modal visible={showSubmitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.rewardBox, { transform: [{ scale: popupScale }] }]}>
            <View style={[styles.iconCircleLarge, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="cloud-upload" size={100} color="#FF9F43" />
            </View>
            <Text style={styles.wellDoneText}>Send Your Work ✨</Text>
            <Text style={[styles.rewardSubText, { marginTop: 15, marginBottom: 20 }]}>Choose how you want to submit:</Text>
            <TouchableOpacity style={styles.submitModalBtn} onPress={handlePickFileSubmission}>
              <Ionicons name="document-text" size={24} color="#FFF" />
              <Text style={styles.submitModalBtnText}>Pick File 📄</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitModalBtn, { backgroundColor: '#66BB6A' }]} onPress={() => { setShowSubmitModal(false); pickMedia(true, 'submission', selectedActivity.id, selectedActivity.title, selectedActivity.teacherId); }}>
              <Ionicons name="camera" size={24} color="#FFF" />
              <Text style={styles.submitModalBtnText}>Take Photo/Video 📸</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSubmitModal(false)} style={{ marginTop: 15 }}>
              <Text style={{ fontSize: 18, color: '#FF5252', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.rewardBox, { transform: [{ scale: popupScale }], borderColor: '#F3E5F5' }]}>
            <View style={[styles.iconCircleLarge, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="trash" size={90} color="#9575CD" />
            </View>
            <Text style={[styles.wellDoneText, { color: '#673AB7' }]}>Wait! ⚠️</Text>
            <Text style={[styles.rewardSubText, { marginTop: 15, marginBottom: 25 }]}>Are you sure you want to delete this activity?</Text>
            <TouchableOpacity style={[styles.submitModalBtn, { backgroundColor: '#9575CD' }]} onPress={confirmDelete}>
              <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              <Text style={styles.submitModalBtnText}>Yes, Delete 🗑️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={{ marginTop: 15 }}>
              <Text style={{ fontSize: 19, color: '#5A9BD5', fontWeight: '900' }}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
      <View style={styles.titleRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={30} color="#FFF" /></TouchableOpacity>
        <View style={styles.headerCard}><Text style={styles.headerText}>Activities</Text></View>
      </View>
      <View style={styles.toggleContainer}>
        {role === 'teacher' ? (
          <>
            <TouchableOpacity style={[styles.toggleBtn, teacherTab === 'submissions' && styles.toggleBtnActive]} onPress={() => setTeacherTab('submissions')}><Text style={[styles.toggleText, teacherTab === 'submissions' && styles.toggleTextActive]}>Student Work</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, teacherTab === 'myActivities' && styles.toggleBtnActive]} onPress={() => setTeacherTab('myActivities')}><Text style={[styles.toggleText, teacherTab === 'myActivities' && styles.toggleTextActive]}>My Uploads</Text></TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={[styles.toggleBtn, parentTab === 'available' && styles.toggleBtnActive]} onPress={() => setParentTab('available')}><Text style={[styles.toggleText, parentTab === 'available' && styles.toggleTextActive]}>Activities</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, parentTab === 'mySubmissions' && styles.toggleBtnActive]} onPress={() => setParentTab('mySubmissions')}><Text style={[styles.toggleText, parentTab === 'mySubmissions' && styles.toggleTextActive]}>My Uploads</Text></TouchableOpacity>
          </>
        )}
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#5A9BD5" /></View>
      ) : (
        <FlatList data={role === 'teacher' ? (teacherTab === 'submissions' ? submissions : activities) : (parentTab === 'available' ? activities : submissions)} keyExtractor={item => item.id} renderItem={role === 'teacher' ? (teacherTab === 'submissions' ? renderSubmission : renderActivity) : (parentTab === 'available' ? renderActivity : renderSubmission)} contentContainerStyle={{ padding: 20, paddingBottom: 50 }} ListHeaderComponent={
          <>
            {role === 'parent' && (
              <View style={styles.instructionCard}>
                <View style={styles.instructionRow}>
                  <ScrollView style={{ flex: 1, maxHeight: 60 }} showsVerticalScrollIndicator={false}>
                    <Text style={styles.topInstruction}> {parentTab === 'available' ? "Tap download to see activity. Tap send work to submit! ✨" : "Here is your uploaded work! Check for marks from teacher. 🍎"} </Text>
                  </ScrollView>
                  <TouchableOpacity style={styles.speakerBtn} onPress={() => playSound(parentTab === 'available' ? instruction1 : instruction2)}>
                    <Ionicons name="volume-high" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {role === 'teacher' && (
              <View style={styles.teacherBar}>
                <Text style={styles.teacherBarText}>Post New:</Text>
                <TouchableOpacity style={[styles.miniBtn, { backgroundColor: '#A2D2FF' }]} onPress={pickDocument}><Ionicons name="folder" size={24} color="#FFF" /></TouchableOpacity>
                <TouchableOpacity style={[styles.miniBtn, { backgroundColor: '#66BB6A' }]} onPress={() => pickMedia(true, 'activity')}><Ionicons name="camera" size={24} color="#FFF" /></TouchableOpacity>
              </View>
            )}
            {uploading && <ActivityIndicator size="small" color="#66BB6A" style={{ margin: 10 }} />}
          </>
        } />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  backBtn: { backgroundColor: '#5A9BD5', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  headerCard: { flex: 1, backgroundColor: '#D4E9FF', padding: 15, borderRadius: 25, alignItems: 'center', marginLeft: 15 },
  headerText: { fontSize: 24, fontWeight: 'bold', color: '#5A9BD5' },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#E0E0E0', marginHorizontal: 20, marginTop: 15, borderRadius: 15, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  toggleBtnActive: { backgroundColor: '#FFF', elevation: 2 },
  toggleText: { fontWeight: 'bold', color: '#777' },
  toggleTextActive: { color: '#5A9BD5' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  rewardBox: { backgroundColor: '#FFF', padding: 30, borderRadius: 50, alignItems: 'center', elevation: 20, width: '90%', borderWidth: 10, borderColor: '#E1F5FE' },
  wellDoneText: { fontSize: 30, fontWeight: '900', color: '#4CAF50', textAlign: 'center', marginTop: 10, width: '100%' },
  rewardSubText: { fontSize: 18, color: '#555', fontWeight: '700', marginTop: 30, textAlign: 'center', lineHeight: 26 },
  iconCircleLarge: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center' },
  submitModalBtn: { backgroundColor: '#5A9BD5', flexDirection: 'row', width: '100%', paddingVertical: 18, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 3 },
  submitModalBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
  instructionCard: { backgroundColor: '#E3F2FD', marginHorizontal: 20, marginTop: 15, borderRadius: 25, padding: 15, borderWidth: 3, borderColor: '#BBDEFB', elevation: 3, marginBottom: 10 },
  instructionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  topInstruction: { fontSize: 16, fontWeight: '800', color: '#1565C0', marginRight: 10, textAlign: 'center', flex: 1 },
  speakerBtn: { backgroundColor: '#5A9BD5', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  teacherBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, marginTop: 15, marginBottom: 10 },
  teacherBarText: { fontSize: 16, fontWeight: 'bold', color: '#5A9BD5', marginRight: 10 },
  miniBtn: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginLeft: 10, elevation: 3 },
  activityCard: { backgroundColor: '#FFF', borderRadius: 25, padding: 20, marginBottom: 15, elevation: 5, position: 'relative' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconCircle: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardSub: { fontSize: 13, color: '#999' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  cuteBtnBlue: { backgroundColor: '#A2D2FF', flexDirection: 'row', padding: 12, borderRadius: 15, flex: 0.48, justifyContent: 'center', alignItems: 'center' },
  cuteBtnGreen: { backgroundColor: '#66BB6A', flexDirection: 'row', padding: 12, borderRadius: 15, flex: 0.48, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
  statusBadge: { paddingHorizontal: 12, borderRadius: 15, borderWidth: 1 },
  statusText: { fontWeight: 'bold', fontSize: 13 },
  gradeBox: { flexDirection: 'row', marginTop: 15, alignItems: 'center' },
  cuteInput: { backgroundColor: '#F5F5F5', flex: 1, padding: 12, borderRadius: 15, marginRight: 10, borderWidth: 1, borderColor: '#DDD' },
  gradeActionBtn: { backgroundColor: '#5A9BD5', width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  starBadge: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FFF', padding: 5, borderRadius: 20, elevation: 8, borderWidth: 2, borderColor: '#FFD700', zIndex: 10 }
});