// utils/progressHelper.ts
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; // Ensure this path is correct

export const updateAutomaticProgress = async (category: 'academic' | 'routine' | 'games') => {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "buddies", user.uid); // Changed to 'buddies' to match your database
  
  // 1. Get the current day index (0 = Monday, 6 = Sunday)
  const today = new Date().getDay();
  const dayIndex = today === 0 ? 6 : today - 1; 

  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();

      // Get current counts or set to 0 if they don't exist yet
      const currentCount = 
        category === 'academic' ? (data.academicWatched || 0) :
        category === 'routine' ? (data.routineCompleted || 0) :
        (data.gamesPlayed || 0);

      // Get total goals or default to 10
      const totalGoal = 
        category === 'academic' ? (data.totalAcademic || 10) :
        category === 'routine' ? (data.totalRoutine || 10) :
        (data.totalGames || 5);

      const newCount = currentCount + 1;

      // Calculate new percentage for the line graph
      let history = data[`${category}History`] || [0, 0, 0, 0, 0, 0, 0];
      history[dayIndex] = Math.round((newCount / totalGoal) * 100);

      // Save back to Firebase
      const updateData: any = {
        [`${category}History`]: history,
      };

      if (category === 'academic') updateData.academicWatched = newCount;
      if (category === 'routine') updateData.routineCompleted = newCount;
      if (category === 'games') updateData.gamesPlayed = newCount;

      await updateDoc(userRef, updateData);
      console.log(`${category} progress updated automatically!`);
    }
  } catch (error) {
    console.error("Error updating progress:", error);
  }
};