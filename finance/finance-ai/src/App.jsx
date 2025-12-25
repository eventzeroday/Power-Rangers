import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    PieChart, Wallet, TrendingUp, ...
} from "lucide-react";

import { initializeApp } from "firebase/app";
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    signInWithCustomToken
} from "firebase/auth";

import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc,
    Timestamp
} from "firebase/firestore";

import { firebaseConfig, GOOGLE_API_KEY } from "./firebaseConfig";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const apiKey = GOOGLE_API_KEY;
