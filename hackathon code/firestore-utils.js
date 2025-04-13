// Import Firebase modules
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, 
         addDoc, deleteDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/**
 * Firestore Database Utility Functions
 */

// Create a user profile document
export async function createUserProfile(userId, userData) {
  const db = getFirestore();
  try {
    await setDoc(doc(db, "users", userId), {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error("Error creating user profile:", error);
    return { success: false, error };
  }
}

// Get user profile by ID
export async function getUserProfile(userId) {
  const db = getFirestore();
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: "User profile not found" };
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    return { success: false, error };
  }
}

// Update user profile
export async function updateUserProfile(userId, userData) {
  const db = getFirestore();
  try {
    await updateDoc(doc(db, "users", userId), {
      ...userData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error };
  }
}

// Save assessment results
export async function saveAssessmentResults(userId, assessmentData) {
  const db = getFirestore();
  try {
    const userAssessmentsRef = collection(db, "users", userId, "assessments");
    
    await addDoc(userAssessmentsRef, {
      ...assessmentData,
      createdAt: new Date().toISOString()
    });
    
    // Also update the user profile with latest assessment summary
    await updateDoc(doc(db, "users", userId), {
      lastAssessment: {
        date: new Date().toISOString(),
        topSkills: assessmentData.topSkills || [],
        suggestedCareers: assessmentData.suggestedCareers || []
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error saving assessment results:", error);
    return { success: false, error };
  }
}

// Get user's assessment history
export async function getAssessmentHistory(userId) {
  const db = getFirestore();
  try {
    const userAssessmentsRef = collection(db, "users", userId, "assessments");
    const querySnapshot = await getDocs(userAssessmentsRef);
    
    const assessments = [];
    querySnapshot.forEach((doc) => {
      assessments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, data: assessments };
  } catch (error) {
    console.error("Error getting assessment history:", error);
    return { success: false, error };
  }
}

// Save AI advisor conversation
export async function saveConversation(userId, conversationData) {
  const db = getFirestore();
  try {
    const userConversationsRef = collection(db, "users", userId, "conversations");
    
    await addDoc(userConversationsRef, {
      ...conversationData,
      createdAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error saving conversation:", error);
    return { success: false, error };
  }
}

// Get user's conversation history
export async function getConversationHistory(userId) {
  const db = getFirestore();
  try {
    const userConversationsRef = collection(db, "users", userId, "conversations");
    const querySnapshot = await getDocs(userConversationsRef);
    
    const conversations = [];
    querySnapshot.forEach((doc) => {
      conversations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, data: conversations };
  } catch (error) {
    console.error("Error getting conversation history:", error);
    return { success: false, error };
  }
}

// Helper function to check if user exists
export async function checkUserExists(email) {
  const db = getFirestore();
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking if user exists:", error);
    return false;
  }
} 