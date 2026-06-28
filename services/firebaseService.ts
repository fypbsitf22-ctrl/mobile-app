import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where // <--- MAKE SURE THIS IS HERE
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const firebaseService = {
  // 1. Listen to Student Submissions (Real-time Review)
  subscribeToSubmissions: (callback: (data: any[]) => void) => {
    const q = query(collection(db, "submissions"), orderBy("submittedAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(docs);
    });
  },

  // 2. Listen to Teacher Uploads (Real-time Activities)
  subscribeToActivities: (callback: (data: any[]) => void) => {
    const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(docs);
    });
  },

  // 3. Upload Custom Activities
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

  // 4. Submit Review & Feedback
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

  // 5. FIXED: Fetch all students registered to this teacher's class code
  subscribeToClassStudents: (classCode: string, callback: (data: any[]) => void) => {
    try {
      // We look in the "users" collection for everyone who joined using THIS classCode
      const q = query(collection(db, "users"), where("joinedClassCode", "==", classCode));
      
      return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        callback(docs);
      }, (error) => {
        console.error("Firestore Listen Error:", error);
      });
    } catch (err) {
      console.error("Query Error:", err);
      return () => {}; // Return empty function to prevent crash
    }
  }
};