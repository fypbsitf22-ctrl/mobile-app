import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; // Added auth import

export interface LessonProgress {
  subject: string;
  lessonName: string;
  timeSpent: string;
  starsEarned: number;
}

export const firebaseService = {
  // --- Notifications ---
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
          timeStr: doc.data().timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Now'
        }));
        callback(docs);
      });
    } catch (err) {
      console.error("Notification Error:", err);
      return () => { };
    }
  },

  // --- Submissions ---
  subscribeToSubmissions: (callback: (data: any[]) => void) => {
    const q = query(collection(db, "submissions"), orderBy("submittedAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(docs);
    });
  },

  // --- Activities ---
  subscribeToActivities: (callback: (data: any[]) => void) => {
    try {
      const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(docs);
      });
    } catch (error) {
      console.error("Activities Sync Error:", error);
      return () => {};
    }
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

  // --- Feedback ---
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

  // --- Students and Class Management ---
  subscribeToClassStudents: (classCode: string, callback: (data: any[]) => void) => {
    try {
      const q = query(collection(db, "users"), where("joinedClassCode", "==", classCode));
      return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(docs);
      });
    } catch (err) {
      return () => { };
    }
  },

  // --- Dashboard Save Logic (UPDATED TO FIX LINKING) ---
  saveLessonProgress: async (studentId: string, lessonData: LessonProgress, role: 'parent' | 'teacher' = 'parent') => {
    try {
      const studentRef = doc(db, "students", studentId);
      
      // Important: linkField must match what the Dashboard queries (parentId or teacherId)
      const linkField = role === 'teacher' ? 'teacherId' : 'parentId';
      
      // Get the current student's name from Auth to show in the Dashboard
      const studentName = auth.currentUser?.displayName || "Hifza Khalid";

      await setDoc(
        studentRef,
        {
          // 1. Link the student to the dashboard query
          [linkField]: studentId, 
          
          // 2. Set the student name so it's not "New Student"
          name: studentName,
          
          // 3. Add to the history array
          history: arrayUnion({
            subject: lessonData.subject,
            lessonName: lessonData.lessonName,
            timeSpent: lessonData.timeSpent,
            starsEarned: lessonData.starsEarned,
            completedAt: new Date().toISOString(),
          }),
          
          // 4. Update stats
          totalStars: increment(lessonData.starsEarned),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log("Lesson Progress Saved and Dashboard Linked!");
    } catch (e) {
      console.error("Save Progress Error:", e);
    }
  },

  // --- Dashboard Real-time Listener ---
  subscribeToStudentDashboard: (role: 'parent' | 'teacher', userId: string, callback: (data: any[]) => void) => {
    try {
      const filterColumn = role === 'teacher' ? 'teacherId' : 'parentId';
      
      // This query looks for docs where parentId == logged-in userId
      const q = query(
        collection(db, "students"),
        where(filterColumn, "==", userId)
      );

      return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(docs);
      }, (error) => {
        console.error("Dashboard Sync Error:", error);
      });
    } catch (err) {
      console.error("Dashboard Query Error:", err);
      return () => { };
    }
  },
};