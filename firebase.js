// Browser-friendly ESM imports from Firebase CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA3WEd2Zr6nG5oM0TmNJxYQdJtEeG3n_ts",
  authDomain: "aurraaapp.firebaseapp.com",
  projectId: "aurraaapp",
  storageBucket: "aurraaapp.firebasestorage.app",
  messagingSenderId: "912439260111",
  appId: "1:912439260111:web:d19b3a9b8b58449e02d8ba",
  measurementId: "G-6P5FC01KY0"
};

// Initialize Firebase
let app;
try {
    app = initializeApp(firebaseConfig);
    console.info('Firebase initialized successfully with config:', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain
    });
} catch (e) {
    console.error('Failed to initialize Firebase:', e);
    throw new Error('Firebase initialization failed. Please check your configuration.');
}

let analytics;
try { 
    analytics = getAnalytics(app); 
} catch (e) { 
    console.warn('Analytics initialization failed:', e);
    /* analytics may fail in some environments */ 
}

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Auth / Firestore helper functions
async function signIn(emailOrUsername, password) {
  console.log('Sign in attempt with:', { emailOrUsername });
  
  let emailToUse = emailOrUsername;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // If input is not an email, try to find corresponding email
  if (!emailRegex.test(emailOrUsername)) {
    console.log('Input is not an email, attempting to resolve username:', emailOrUsername);
    try {
      // First check local storage
      const localProfile = localStorage.getItem('studentProfile');
      if (localProfile) {
        const profile = JSON.parse(localProfile);
        if (profile.username === emailOrUsername && profile.email) {
          console.log('Found email in local storage:', profile.email);
          emailToUse = profile.email;
        }
      }
      
      // If not found in local storage and Firebase is available, check Firestore
      if (emailToUse === emailOrUsername && db) {
        console.log('Querying Firestore for username:', emailOrUsername);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', emailOrUsername));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          if (userData.email) {
            console.log('Found email in Firestore:', userData.email);
            emailToUse = userData.email;
          }
        }
      }
      
      if (emailToUse === emailOrUsername) {
        console.log('Could not resolve username to email');
        throw new Error('Username not found. Please use your email address or sign up.');
      }
    } catch (e) {
      console.error('Error resolving username:', e);
      if (e.message.includes('Missing or insufficient permissions')) {
        throw new Error('System error: Unable to verify username. Please use your email address to log in.');
      }
      throw e;
    }
  }
  
  try {
    console.log('Attempting Firebase sign in with email:', emailToUse);
    const result = await signInWithEmailAndPassword(auth, emailToUse, password);
    console.log('Sign in successful:', {
      uid: result.user.uid,
      email: result.user.email,
      emailVerified: result.user.emailVerified
    });
    return result;
  } catch (error) {
    console.error('Firebase signin error:', {
      code: error.code,
      message: error.message,
      email,
      stack: error.stack,
      authInstance: !!auth,
      timestamp: new Date().toISOString()
    });
    
    // Enhance error messages
    if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email. Please sign up first.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw error;
  }
}

async function signUp(email, password, profile = {}) {
  console.log('Starting signup process with:', {
    email,
    hasPassword: !!password,
    profile: { ...profile, password: undefined }, // Log profile without password
    timestamp: new Date().toISOString()
  });

  // Verify auth is initialized
  if (!auth) {
    console.error('Firebase Auth not initialized:', {
      firebaseApp: !!app,
      authConfig: !!firebaseConfig,
      environment: {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        userAgent: navigator.userAgent
      }
    });
    throw new Error('Authentication service not available. Please check Firebase configuration.');
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    console.error('Email validation failed:', {
      email,
      isValid: emailRegex.test(email),
      code: 'auth/invalid-email',
      timestamp: new Date().toISOString()
    });
    const error = new Error('Please enter a valid email address');
    error.code = 'auth/invalid-email';
    throw error;
  }

  // Verify we're on an authorized domain
  const currentDomain = window.location.hostname;
  console.info('Attempting signup from domain:', currentDomain);

  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    console.info('User created successfully:', { email: res.user.email, uid: res.user.uid });
    
    try {
      await setDoc(doc(db, 'users', res.user.uid), { 
        email, 
        ...profile,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      });
      console.info('User profile created in Firestore');
    } catch (e) {
      console.warn('Failed to write user profile:', e);
      // Still return the auth result even if profile save fails
    }
    return res;
  } catch (error) {
    console.error('Firebase signup error:', error);
    
    // Handle configuration errors first
    if (error.code === 'auth/configuration-not-found') {
      console.error('Firebase configuration not found. Please verify:');
      console.error('1. Firebase project is properly set up');
      console.error('2. Authentication is enabled');
      console.error('3. Current domain is authorized');
      throw new Error('Application not properly configured. Please contact support.');
    }
    
    // Handle other common errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please login or use a different email.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/Password sign up is not enabled. Please contact support.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 6 characters.');
    }
    
    // For any other errors, throw with full details in console but user-friendly message
    console.error('Detailed error:', error);
    throw new Error('Sign up failed: ' + (error.message || 'Unknown error occurred'));
  }
}

async function signOutUser() {
  return await signOut(auth);
}

async function getUserData(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// Retrieve all users from Firestore
async function getAllUsers() {
  const usersCol = collection(db, 'users');
  const snap = await getDocs(usersCol);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Compute simple dashboard metrics from the users collection
async function getDashboardMetrics() {
  const users = await getAllUsers();
  const totalStudents = users.length;

  // averageScore: compute from user.averageScore if present
  let totalScore = 0, scoreCount = 0;
  users.forEach(u => {
    if (u.averageScore != null) {
      totalScore += Number(u.averageScore) || 0;
      scoreCount++;
    }
  });
  const averageScore = scoreCount ? (totalScore / scoreCount) : 0;

  // completionRate: percent of users with progress.completed === true or completedModules > 0
  const usersCompleted = users.filter(u => (u.progress && (u.progress.completed || (u.progress.completedModules && u.progress.completedModules > 0)))).length;
  const completionRate = totalStudents ? Math.round((usersCompleted / totalStudents) * 100) : 0;

  // top performers by averageScore
  const topPerformers = users.filter(u => u.averageScore != null).sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0)).slice(0, 5);

  // recent quiz results: gather any user.recentQuizzes arrays into one list
  let recentQuizResults = [];
  users.forEach(u => {
    if (Array.isArray(u.recentQuizzes)) {
      u.recentQuizzes.forEach(q => recentQuizResults.push(Object.assign({ studentName: u.fullName || u.name || u.email || 'Student' }, q)));
    }
  });
  recentQuizResults.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  recentQuizResults = recentQuizResults.slice(0, 5);

  // activeModules: try to infer or default to 0/12
  const activeModules = users.reduce((acc, u) => acc + (u.activeModulesCount ? Number(u.activeModulesCount) : 0), 0) || 12;

  return {
    totalStudents,
    averageScore: Math.round(averageScore * 10) / 10,
    completionRate,
    activeModules,
    topPerformers,
    recentQuizResults
  };
}

// Allow page scripts to hook into auth state changes
function onAuthChange(cb) {
  return onAuthStateChanged(auth, cb);
}

// Attach to window for scripts that don't import modules
if (typeof window !== 'undefined') {
  window.AURRAA = window.AURRAA || {};
  window.AURRAA.firebaseApp = app;
  window.AURRAA.analytics = analytics;
  window.AURRAA.auth = auth;
  window.AURRAA.db = db;
  window.AURRAA.signIn = async (email, password) => {
    try { 
      console.group('AURRAA Sign In Attempt');
      console.log('Sign in initiated:', {
        email,
        hasPassword: !!password,
        timestamp: new Date().toISOString(),
        firebaseInitialized: !!auth
      });
      const result = await signIn(email, password);
      console.log('Sign in completed successfully');
      console.groupEnd();
      return result;
    } catch (e) { 
      console.error('SignIn error in window.AURRAA:', {
        code: e.code,
        message: e.message,
        email,
        stack: e.stack,
        timestamp: new Date().toISOString(),
        firebaseStatus: {
          initialized: !!auth,
          app: !!app,
          config: !!firebaseConfig
        }
      });
      console.groupEnd();
      throw e; 
    }
  };
  window.AURRAA.signUp = async (email, password, profile) => {
    try {
      console.group('AURRAA Sign Up Attempt');
      console.log('Sign up initiated:', {
        email,
        hasPassword: !!password,
        profile: { ...profile, password: undefined },
        timestamp: new Date().toISOString(),
        firebaseInitialized: !!auth
      });
      const result = await signUp(email, password, profile);
      console.log('Sign up completed successfully:', {
        uid: result.user.uid,
        email: result.user.email
      });
      console.groupEnd();
      return result;
    } catch (e) {
      console.error('SignUp error in window.AURRAA:', {
        code: e.code,
        message: e.message,
        email,
        stack: e.stack,
        timestamp: new Date().toISOString(),
        firebaseStatus: {
          initialized: !!auth,
          app: !!app,
          config: !!firebaseConfig
        }
      });
      console.groupEnd();
      // Preserve the error message and code from our main signUp function
      throw e instanceof Error ? e : new Error(e.message || 'Unknown error occurred');
    }
  };
  window.AURRAA.signOut = async () => { return await signOutUser(); };
  window.AURRAA.getUserData = getUserData;
  window.AURRAA.onAuthChange = onAuthChange;
  window.AURRAA.getAllUsers = getAllUsers;
  window.AURRAA.getDashboardMetrics = getDashboardMetrics;
}