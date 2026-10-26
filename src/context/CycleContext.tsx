import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  CycleRecord,
  DailyLog,
  UserSettings,
  UserRole,
} from '../types/cycle';
import {
  INITIAL_USER_SETTINGS,
  INITIAL_CYCLES,
  INITIAL_LOGS,
} from '../data/initialData';
import {
  calculateCycleStatus,
  formatToDateString,
  addDays,
  CycleStatus,
} from '../utils/cycleCalculations';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase/config';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  getOrCreateFemaleProfile,
  updateFemaleProfile,
  connectMaleWithCode,
  updateMalePartnerName,
  saveDailyLogToFirestore,
  saveCycleToFirestore,
  deleteCycleFromFirestore,
  deleteDailyLogFromFirestore,
  seedInitialUserDataIfEmpty,
  unlinkPartner,
  FemaleUserProfile,
} from '../firebase/cycleService';

export type AppTab = 'home' | 'calendar' | 'couple' | 'tracking' | 'insights';

export interface PersistentSession {
  role: UserRole;
  femaleUid: string;
  trackerName: string;
  partnerName: string;
  secretCode: string;
  isSampleDemo: boolean;
}

const STORAGE_PREFIX = 'aura_bloom_v2';

function loadStoredSession(): PersistentSession | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}_session`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export interface CycleContextType {
  firebaseUser: FirebaseUser | null;
  userRole: UserRole | null;
  isAuthenticated: boolean;
  isOnboarding: boolean;
  isSampleDemo: boolean;
  settings: UserSettings;
  cycles: CycleRecord[];
  logs: DailyLog[];
  currentDate: string;
  selectedCalendarDate: string;
  cycleStatus: CycleStatus;
  activeTab: AppTab;
  isLogModalOpen: boolean;
  logModalDate: string;
  setActiveTab: (tab: AppTab) => void;
  setSelectedCalendarDate: (date: string) => void;
  openLogModal: (date?: string) => void;
  closeLogModal: () => void;
  loginAsFemaleWithGoogle: () => Promise<void>;
  loginAsMaleWithCode: (code: string, maleName: string) => Promise<{ success: boolean; error?: string }>;
  startSampleDemo: () => void;
  startPreviewAsRole: (role: UserRole) => void;
  signOut: () => Promise<void>;
  finishOnboarding: () => void;
  updateFemaleProfileInDb: (profile: Partial<FemaleUserProfile>) => Promise<void>;
  updateMaleNameInDb: (name: string) => Promise<void>;
  unlinkPartnerFromDb: () => Promise<void>;
  addOrUpdateCycle: (cycle: CycleRecord) => void;
  deleteCycle: (id: string) => void;
  quickTogglePeriodForDate: (dateStr: string) => void;
  saveDailyLog: (log: DailyLog) => void;
  deleteDailyLog: (dateStr: string) => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
}

const CycleContext = createContext<CycleContextType | undefined>(undefined);

export const CycleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDate] = useState<string>(() => formatToDateString(new Date()));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => formatToDateString(new Date()));
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [logModalDate, setLogModalDate] = useState<string>(() => formatToDateString(new Date()));

  // Load persistent session if already logged in
  const savedSession = useMemo(() => loadStoredSession(), []);

  // Auth & Pairing State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    if (savedSession?.role) return savedSession.role;
    return (localStorage.getItem(`${STORAGE_PREFIX}_role`) as UserRole) || null;
  });
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);
  const [isSampleDemo, setIsSampleDemo] = useState<boolean>(() => {
    if (savedSession) return savedSession.isSampleDemo;
    return localStorage.getItem(`${STORAGE_PREFIX}_demo`) === 'true';
  });

  // Settings State - Rehydrate from saved session if present
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}_settings`);
      const baseSettings = saved ? JSON.parse(saved) : INITIAL_USER_SETTINGS;
      if (savedSession) {
        return {
          ...baseSettings,
          activeRole: savedSession.role,
          femaleUid: savedSession.femaleUid || baseSettings.femaleUid,
          trackerName: savedSession.trackerName || baseSettings.trackerName,
          partnerName: savedSession.partnerName || baseSettings.partnerName,
          secretCode: savedSession.secretCode || baseSettings.secretCode,
          partnerConnected: Boolean(savedSession.femaleUid),
        };
      }
      return baseSettings;
    } catch {
      return INITIAL_USER_SETTINGS;
    }
  });

  // Cycles & Logs State
  const [cycles, setCycles] = useState<CycleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}_cycles`);
      return saved ? JSON.parse(saved) : INITIAL_CYCLES;
    } catch {
      return INITIAL_CYCLES;
    }
  });

  const [logs, setLogs] = useState<DailyLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}_logs`);
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  // Persistent storage backup
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}_settings`, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}_cycles`, JSON.stringify(cycles));
    } catch {}
  }, [cycles]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}_logs`, JSON.stringify(logs));
    } catch {}
  }, [logs]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user && userRole === 'female') {
        try {
          const { profile, isNew } = await getOrCreateFemaleProfile(
            user.uid,
            user.email || '',
            user.displayName || 'Emma'
          );

          setSettings((prev) => ({
            ...prev,
            trackerName: profile.displayName,
            partnerName: profile.partnerName || prev.partnerName,
            averageCycleLength: profile.averageCycleLength,
            averagePeriodLength: profile.averagePeriodLength,
            secretCode: profile.secretCode,
            partnerConnected: profile.partnerConnected,
            femaleUid: profile.uid,
            activeRole: 'female',
          }));

          if (isNew || !profile.onboardingCompleted) {
            setIsOnboarding(true);
          }
        } catch (e) {
          console.error('Error fetching female profile:', e);
        }
      }
    });

    return () => unsubscribe();
  }, [userRole]);

  // Listen to Firestore real-time updates for Female Profile & Partner Connection
  useEffect(() => {
    const targetUid = settings.femaleUid;
    if (!targetUid || targetUid === 'sample-female-uid' || isSampleDemo) return;

    const userDocRef = doc(db, 'female_users', targetUid);
    const unsubDoc = onSnapshot(
      userDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as FemaleUserProfile;
          setSettings((prev) => ({
            ...prev,
            trackerName: data.displayName,
            partnerName: data.partnerName,
            partnerConnected: data.partnerConnected,
            secretCode: data.secretCode,
            averageCycleLength: data.averageCycleLength,
            averagePeriodLength: data.averagePeriodLength,
          }));
        }
      },
      (err) => {
        console.warn('Real-time profile listener:', err);
      }
    );

    // Subcollection: Daily Logs
    const logsColRef = collection(db, 'female_users', targetUid, 'daily_logs');
    const unsubLogs = onSnapshot(
      logsColRef,
      (snap) => {
        const loadedLogs: DailyLog[] = [];
        snap.forEach((d) => loadedLogs.push(d.data() as DailyLog));
        if (loadedLogs.length > 0) {
          setLogs(loadedLogs);
        }
      },
      (err) => {
        console.warn('Real-time logs listener:', err);
      }
    );

    // Subcollection: Cycles
    const cyclesColRef = collection(db, 'female_users', targetUid, 'cycles');
    const unsubCycles = onSnapshot(
      cyclesColRef,
      (snap) => {
        const loadedCycles: CycleRecord[] = [];
        snap.forEach((d) => loadedCycles.push(d.data() as CycleRecord));
        if (loadedCycles.length > 0) {
          setCycles(loadedCycles.sort((a, b) => b.startDate.localeCompare(a.startDate)));
        }
      },
      (err) => {
        console.warn('Real-time cycles listener:', err);
      }
    );

    return () => {
      unsubDoc();
      unsubLogs();
      unsubCycles();
    };
  }, [settings.femaleUid, isSampleDemo]);

  // Derived cycle status with statistical data analytics & on-device intelligence
  const cycleStatus = useMemo(() => {
    return calculateCycleStatus(
      currentDate,
      cycles,
      {
        averageCycleLength: settings.averageCycleLength,
        averagePeriodLength: settings.averagePeriodLength,
        lutealPhaseLength: settings.lutealPhaseLength,
        calibrationMode: settings.calibrationMode,
        customCycleLengthOverride: settings.customCycleLengthOverride,
        customPeriodDurationOverride: settings.customPeriodDurationOverride,
        customLutealLengthOverride: settings.customLutealLengthOverride,
      },
      logs
    );
  }, [currentDate, cycles, settings, logs]);

  // AUTH ACTIONS
  const loginAsFemaleWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      setUserRole('female');
      localStorage.setItem(`${STORAGE_PREFIX}_role`, 'female');
      localStorage.removeItem(`${STORAGE_PREFIX}_demo`);
      setIsSampleDemo(false);

      const { profile, isNew } = await getOrCreateFemaleProfile(
        res.user.uid,
        res.user.email || '',
        res.user.displayName || 'Emma'
      );

      // Save persistent session
      const session: PersistentSession = {
        role: 'female',
        femaleUid: profile.uid,
        trackerName: profile.displayName,
        partnerName: profile.partnerName || '',
        secretCode: profile.secretCode,
        isSampleDemo: false,
      };
      localStorage.setItem(`${STORAGE_PREFIX}_session`, JSON.stringify(session));

      setSettings((prev) => ({
        ...prev,
        trackerName: profile.displayName,
        partnerName: profile.partnerName || prev.partnerName,
        averageCycleLength: profile.averageCycleLength,
        averagePeriodLength: profile.averagePeriodLength,
        secretCode: profile.secretCode,
        partnerConnected: profile.partnerConnected,
        femaleUid: profile.uid,
        activeRole: 'female',
      }));

      if (isNew || !profile.onboardingCompleted) {
        setIsOnboarding(true);
        await seedInitialUserDataIfEmpty(res.user.uid, INITIAL_CYCLES, INITIAL_LOGS);
      }
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  };

  const loginAsMaleWithCode = async (
    code: string,
    maleName: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanCode = code.trim().toUpperCase();

    // Testing demo bypass codes requested by user: XXXX for Females & XYXY for Males
    if (cleanCode === 'XXXX') {
      startPreviewAsRole('female');
      return { success: true };
    }
    if (cleanCode === 'XYXY') {
      startPreviewAsRole('male');
      return { success: true };
    }

    try {
      const result = await connectMaleWithCode(code, maleName);
      if (result.success && result.femaleProfile) {
        const profile = result.femaleProfile;
        const resolvedMaleName = maleName.trim() || profile.partnerName || 'Alex';
        setUserRole('male');
        localStorage.setItem(`${STORAGE_PREFIX}_role`, 'male');
        localStorage.removeItem(`${STORAGE_PREFIX}_demo`);
        setIsSampleDemo(false);

        // Save persistent session for male so refresh keeps companion logged in
        const session: PersistentSession = {
          role: 'male',
          femaleUid: profile.uid,
          trackerName: profile.displayName,
          partnerName: resolvedMaleName,
          secretCode: profile.secretCode,
          isSampleDemo: false,
        };
        localStorage.setItem(`${STORAGE_PREFIX}_session`, JSON.stringify(session));

        setSettings((prev) => ({
          ...prev,
          trackerName: profile.displayName,
          partnerName: resolvedMaleName,
          averageCycleLength: profile.averageCycleLength,
          averagePeriodLength: profile.averagePeriodLength,
          secretCode: profile.secretCode,
          partnerConnected: true,
          femaleUid: profile.uid,
          activeRole: 'male',
        }));

        return { success: true };
      }
      return { success: false, error: result.error || 'Invalid secret code.' };
    } catch (e) {
      return { success: false, error: 'Could not connect with code. Please check internet connection.' };
    }
  };

  const startPreviewAsRole = (role: 'female' | 'male') => {
    setUserRole(role);
    setIsSampleDemo(true);
    localStorage.setItem(`${STORAGE_PREFIX}_role`, role);
    localStorage.setItem(`${STORAGE_PREFIX}_demo`, 'true');

    const session: PersistentSession = {
      role,
      femaleUid: 'sample-female-uid',
      trackerName: 'Emma',
      partnerName: 'Alex',
      secretCode: '9x#K',
      isSampleDemo: true,
    };
    localStorage.setItem(`${STORAGE_PREFIX}_session`, JSON.stringify(session));

    setSettings({
      ...INITIAL_USER_SETTINGS,
      activeRole: role,
    });
    setCycles(INITIAL_CYCLES);
    setLogs(INITIAL_LOGS);
    setIsOnboarding(false);
  };

  const startSampleDemo = () => {
    startPreviewAsRole('female');
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {}
    setUserRole(null);
    setIsSampleDemo(false);
    setIsOnboarding(false);
    localStorage.removeItem(`${STORAGE_PREFIX}_session`);
    localStorage.removeItem(`${STORAGE_PREFIX}_role`);
    localStorage.removeItem(`${STORAGE_PREFIX}_demo`);
    setActiveTab('home');
  };

  const finishOnboarding = () => {
    setIsOnboarding(false);
  };

  const updateFemaleProfileInDb = async (updates: Partial<FemaleUserProfile>) => {
    // Male role is strictly forbidden from changing female profile
    if (userRole === 'male') {
      console.warn('Male companion cannot update female cycle profile.');
      return;
    }

    if (settings.femaleUid && !isSampleDemo) {
      await updateFemaleProfile(settings.femaleUid, updates);
    }
    setSettings((prev) => ({
      ...prev,
      trackerName: updates.displayName || prev.trackerName,
      partnerName: updates.partnerName || prev.partnerName,
      averageCycleLength: updates.averageCycleLength || prev.averageCycleLength,
      averagePeriodLength: updates.averagePeriodLength || prev.averagePeriodLength,
      secretCode: updates.secretCode || prev.secretCode,
    }));
  };

  const updateMaleNameInDb = async (newName: string) => {
    const cleanName = newName.trim();
    if (!cleanName) return;

    if (settings.femaleUid && !isSampleDemo) {
      await updateMalePartnerName(settings.femaleUid, settings.secretCode, cleanName);
    }

    setSettings((prev) => ({
      ...prev,
      partnerName: cleanName,
    }));

    // Update session storage
    try {
      const currentSession = loadStoredSession();
      if (currentSession) {
        currentSession.partnerName = cleanName;
        localStorage.setItem(`${STORAGE_PREFIX}_session`, JSON.stringify(currentSession));
      }
    } catch {}
  };

  const unlinkPartnerFromDb = async () => {
    if (settings.femaleUid && !isSampleDemo) {
      await unlinkPartner(settings.femaleUid, settings.secretCode);
    }
    setSettings((prev) => ({
      ...prev,
      partnerConnected: false,
      partnerName: '',
    }));

    // If male partner initiated unlink, disconnect and return to login
    if (userRole === 'male') {
      await signOut();
    }
  };

  // CYCLE & LOG ACTIONS (STRICTLY READ-ONLY FOR MALE)
  const openLogModal = (date?: string) => {
    if (userRole === 'male') {
      // Male cannot open symptom logging modal
      return;
    }
    setLogModalDate(date || currentDate);
    setIsLogModalOpen(true);
  };

  const closeLogModal = () => {
    setIsLogModalOpen(false);
  };

  const saveDailyLog = (log: DailyLog) => {
    // Strictly read-only for male companion
    if (userRole === 'male') {
      console.warn('Action blocked: Male companion account is strictly read-only.');
      return;
    }

    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.date === log.date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = log;
        return copy;
      }
      return [log, ...prev];
    });

    if (settings.femaleUid && !isSampleDemo) {
      saveDailyLogToFirestore(settings.femaleUid, log).catch(console.error);
    }
  };

  const deleteDailyLog = (dateStr: string) => {
    if (userRole === 'male') return;

    setLogs((prev) => prev.filter((l) => l.date !== dateStr));
    if (settings.femaleUid && !isSampleDemo) {
      deleteDailyLogFromFirestore(settings.femaleUid, dateStr).catch(console.error);
    }
  };

  const addOrUpdateCycle = (cycle: CycleRecord) => {
    // Strictly read-only for male companion
    if (userRole === 'male') {
      console.warn('Action blocked: Male companion account cannot modify period cycle records.');
      return;
    }

    setCycles((prev) => {
      const exists = prev.some((c) => c.id === cycle.id);
      const nextList = exists
        ? prev.map((c) => (c.id === cycle.id ? cycle : c))
        : [...prev, cycle];
      return nextList.sort((a, b) => b.startDate.localeCompare(a.startDate));
    });

    if (settings.femaleUid && !isSampleDemo) {
      saveCycleToFirestore(settings.femaleUid, cycle).catch(console.error);
    }
  };

  const deleteCycle = (id: string) => {
    if (userRole === 'male') return;

    setCycles((prev) => prev.filter((c) => c.id !== id));
    if (settings.femaleUid && !isSampleDemo) {
      deleteCycleFromFirestore(settings.femaleUid, id).catch(console.error);
    }
  };

  const quickTogglePeriodForDate = (dateStr: string) => {
    // Strictly read-only for male companion
    if (userRole === 'male') {
      console.warn('Action blocked: Male companion account cannot record periods.');
      return;
    }

    const existing = cycles.find((c) => dateStr >= c.startDate && dateStr <= c.endDate);
    if (existing) {
      if (existing.startDate === dateStr && existing.endDate === dateStr) {
        deleteCycle(existing.id);
      } else if (existing.startDate === dateStr) {
        addOrUpdateCycle({
          ...existing,
          startDate: addDays(dateStr, 1),
          periodDurationDays: Math.max(1, existing.periodDurationDays - 1),
        });
      } else if (existing.endDate === dateStr) {
        addOrUpdateCycle({
          ...existing,
          endDate: addDays(dateStr, -1),
          periodDurationDays: Math.max(1, existing.periodDurationDays - 1),
        });
      } else {
        deleteCycle(existing.id);
      }
    } else {
      const newCycle: CycleRecord = {
        id: `cycle-${dateStr}-${Date.now()}`,
        startDate: dateStr,
        endDate: addDays(dateStr, settings.averagePeriodLength - 1),
        cycleLengthDays: settings.averageCycleLength,
        periodDurationDays: settings.averagePeriodLength,
        isConfirmed: true,
      };
      addOrUpdateCycle(newCycle);
    }
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    if (userRole === 'male') {
      // Male cannot change cycle length, period duration, or calibration overrides
      const safeMaleUpdates: Partial<UserSettings> = {};
      if (newSettings.partnerName) safeMaleUpdates.partnerName = newSettings.partnerName;
      setSettings((prev) => ({ ...prev, ...safeMaleUpdates }));
      return;
    }
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <CycleContext.Provider
      value={{
        userRole,
        firebaseUser,
        isAuthenticated: Boolean(userRole),
        isOnboarding,
        isSampleDemo,
        settings,
        cycles,
        logs,
        currentDate,
        selectedCalendarDate,
        cycleStatus,
        activeTab,
        isLogModalOpen,
        logModalDate,
        setActiveTab,
        setSelectedCalendarDate,
        openLogModal,
        closeLogModal,
        loginAsFemaleWithGoogle,
        loginAsMaleWithCode,
        startSampleDemo,
        startPreviewAsRole,
        signOut,
        finishOnboarding,
        updateFemaleProfileInDb,
        updateMaleNameInDb,
        unlinkPartnerFromDb,
        addOrUpdateCycle,
        deleteCycle,
        quickTogglePeriodForDate,
        saveDailyLog,
        deleteDailyLog,
        updateSettings,
      }}
    >
      {children}
    </CycleContext.Provider>
  );
};

export const useCycle = () => {
  const context = useContext(CycleContext);
  if (!context) {
    throw new Error('useCycle must be used within a CycleProvider');
  }
  return context;
};
