import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
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

  // Add these to your firebaseService object in firebaseService.ts

  // --- Save Incomplete Progress ---
  saveIncompleteProgress: async (studentId: string, lessonData: any) => {
    try {
      const studentRef = doc(db, "students", studentId);
      const studentSnap = await getDoc(studentRef);
      
      let incompleteList = [];
      if (studentSnap.exists()) {
        incompleteList = studentSnap.data().incomplete || [];
      }

      // Remove existing entry for this specific lesson to prevent duplicates
      const filteredList = incompleteList.filter((item: any) => item.lessonId !== lessonData.lessonId);

      // Add the new progress
      filteredList.push({
        subject: lessonData.subject,
        lessonName: lessonData.lessonName,
        lessonId: lessonData.lessonId,
        currentTimer: lessonData.currentTimer,
        lastAttempted: new Date().toISOString(),
      });

      // Use setDoc with merge: true instead of updateDoc
      // We MUST include parentId so the Dashboard query where("parentId", "==", userId) works!
      await setDoc(studentRef, { 
        incomplete: filteredList,
        parentId: studentId, // This links it to the parent dashboard
        name: auth.currentUser?.displayName || "Student",
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log("Incomplete progress tracked successfully");
    } catch (e) {
      console.error("Error saving incomplete:", e);
    }
  },

  // --- Update saveLessonProgress to remove from Incomplete ---
  saveLessonProgress: async (studentId: string, lessonData: LessonProgress, role: 'parent' | 'teacher' = 'parent') => {
    try {
      const studentRef = doc(db, "students", studentId);
      const studentSnap = await getDoc(studentRef);
      
      let incompleteList = [];
      if (studentSnap.exists()) {
        incompleteList = studentSnap.data().incomplete || [];
      }

      // Filter out this lesson from the incomplete list since it's now finished
      const updatedIncomplete = incompleteList.filter((item: any) => item.lessonName !== lessonData.lessonName);

      const linkField = role === 'teacher' ? 'teacherId' : 'parentId';
      const studentName = auth.currentUser?.displayName || "Student";

      await setDoc(studentRef, {
        [linkField]: studentId,
        name: studentName,
        incomplete: updatedIncomplete, // Update the list with the lesson removed
        history: arrayUnion({
          subject: lessonData.subject,
          lessonName: lessonData.lessonName,
          timeSpent: lessonData.timeSpent,
          starsEarned: lessonData.starsEarned,
          completedAt: new Date().toISOString(),
        }),
        totalStars: increment(lessonData.starsEarned),
        updatedAt: serverTimestamp(),
      }, { merge: true });

    } catch (e) {
      console.error("Save Progress Error:", e);
    }
  },

  // --- Dashboard Real-time Listener ---
// Inside services/firebaseService.ts

  // Update this in your firebaseService object in firebaseService.ts
subscribeToStudentDashboard: (
  role: 'parent' | 'teacher',
  identifier: string,
  callback: (data: any[]) => void
) => {
  if (!identifier) { callback([]); return () => {}; }

  // --- PARENT: unchanged, students collection is fine here ---
  if (role === 'parent') {
    try {
      const q = query(collection(db, "students"), where("parentId", "==", identifier));
      return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(docs);
      });
    } catch (err) {
      return () => {};
    }
  }

  // --- TEACHER: registration truth lives in "users", progress lives in "students" ---
  try {
    const usersQuery = query(
      collection(db, "users"),
      where("teacherId", "==", identifier),
      where("role", "==", "parent")
    );

    let registeredList: any[] = [];
    const studentUnsubs: Record<string, () => void> = {};
    const studentDataMap: Record<string, any> = {};

    const emit = () => {
      const merged = registeredList.map(u => ({
        id: u.id,
        name: u.name || "Student",
        grade: u.grade || "N/A",
        ...studentDataMap[u.id], // history, incomplete, communications, totalStars (if any exist yet)
      }));
      callback(merged);
    };

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      registeredList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const currentIds = new Set(registeredList.map(u => u.id));

      // stop listening to students no longer linked to this teacher
      Object.keys(studentUnsubs).forEach(id => {
        if (!currentIds.has(id)) {
          studentUnsubs[id]();
          delete studentUnsubs[id];
          delete studentDataMap[id];
        }
      });

      // start listening to newly registered students' progress doc
      registeredList.forEach(u => {
        if (!studentUnsubs[u.id]) {
          const studentRef = doc(db, "students", u.id);
          studentUnsubs[u.id] = onSnapshot(studentRef, (snap) => {
            studentDataMap[u.id] = snap.exists() ? snap.data() : {};
            emit();
          });
        }
      });

      emit();
    });

    return () => {
      unsubscribeUsers();
      Object.values(studentUnsubs).forEach(unsub => unsub());
    };
  } catch (err) {
    return () => {};
  }
},
};