import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Ensuring this path is correct for your project

export const firebaseService = {
  // --- ADDED: Listen to Notifications dynamically based on Role ---
  subscribeToNotifications: (role: string, callback: (data: any[]) => void) => {
    try {
      const q = query(
        collection(db, "notifications"), 
        where("role", "==", role), 
        orderBy("timestamp", "desc")
      );
      
      return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          // Convert timestamp to a readable string immediately
          timeStr: doc.data().timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Now'
        }));
        callback(docs);
      }, (error) => {
        console.error("Notification Sync Error:", error);
      });
    } catch (err) {
      console.error("Notification Query Error:", err);
      return () => {};
    }
  },

  // --- YOUR EXISTING CODE ---
  subscribeToSubmissions: (callback: (data: any[]) => void) => {
    const q = query(collection(db, "submissions"), orderBy("submittedAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(docs);
    });
  },

  subscribeToActivities: (callback: (data: any[]) => void) => {
    const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(docs);
    });
  },

  postNewActivity: async (title: string, description: string, type: string) => {
    try {
      await addDoc(collection(db, "activities"), {
        title,
        description,
        type, 
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error adding activity: ", e);
    }
  },

  submitFeedback: async (submissionId: string, feedback: string, score: string) => {
    try {
      const submissionRef = doc(db, "submissions", submissionId);
      await updateDoc(submissionRef, {
        feedback,
        score,
        status: "Reviewed",
        reviewedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error submitting feedback: ", e);
    }
  },

  subscribeToClassStudents: (classCode: string, callback: (data: any[]) => void) => {
    try {
      const q = query(collection(db, "users"), where("joinedClassCode", "==", classCode));
      return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(docs);
      }, (error) => {
        console.error("Firestore Listen Error:", error);
      });
    } catch (err) {
      console.error("Query Error:", err);
      return () => {};
    }
  }
};