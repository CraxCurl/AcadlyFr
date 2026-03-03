import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Finalized Firebase configuration for Acadly Teacher App
const firebaseConfig = {
  apiKey: "AIzaSyCv2RH8heKtcLma89FDW3u8fracxsI_aqU",
  authDomain: "acadly-b5a8d.firebaseapp.com",
  databaseURL: "https://acadly-b5a8d-default-rtdb.firebaseio.com",
  projectId: "acadly-b5a8d",
  storageBucket: "acadly-b5a8d.firebasestorage.app",
  messagingSenderId: "875521559727",
  appId: "1:875521559727:web:87b65bb53e973cc425185a",
  measurementId: "G-78MY5KHG9V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

export { auth, db, storage };
