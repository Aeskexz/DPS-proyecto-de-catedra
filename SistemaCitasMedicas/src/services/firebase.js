import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBlfAVEvGpSZsgrDvxjQoW2PVGpc1V8RIE",
  authDomain: "sistemacitasmedicas-7f0a2.firebaseapp.com",
  projectId: "sistemacitasmedicas-7f0a2",
  storageBucket: "sistemacitasmedicas-7f0a2.firebasestorage.app",
  messagingSenderId: "490222160132",
  appId: "1:490222160132:web:3525db6404b706acef6851",
  databaseURL: "https://sistemacitasmedicas-7f0a2-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const database = getDatabase(app);

export default app;
