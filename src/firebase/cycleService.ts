import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { CycleRecord, DailyLog } from '../types/cycle';

export interface FemaleUserProfile {
  uid: string;
  email: string;
  displayName: string;
  secretCode: string;
  partnerConnected: boolean;
  partnerName: string;
  partnerConnectedAt?: string;
  averageCycleLength: number;
  averagePeriodLength: number;
  lutealPhaseLength: number;
  lastPeriodStartDate: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PairCodeDoc {
  code: string;
  femaleUid: string;
  femaleName: string;
  maleConnected: boolean;
  maleName: string;
  createdAt: string;
}

/**
 * Generate a 4-character unique secret code with alphanumeric (case-sensitive) and symbols.
 * No 'BLOOM' prefix. Exactly 4 characters.
 */
export async function generateUniqueSecretCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789#@!&*?+$';
  for (let attempt = 0; attempt < 12; attempt++) {
    let candidate = '';
    for (let i = 0; i < 4; i++) {
      candidate += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const codeRef = doc(db, 'pair_codes', candidate);
    try {
      const snap = await getDoc(codeRef);
      if (!snap.exists()) {
        return candidate;
      }
    } catch (e) {
      return candidate;
    }
  }
  // Fallback 4 chars
  return '7#Kq';
}

/**
 * Fetch or initialize a female profile after Google Sign-In
 */
export async function getOrCreateFemaleProfile(
  uid: string,
  email: string,
  displayName: string
): Promise<{ profile: FemaleUserProfile; isNew: boolean }> {
  const userRef = doc(db, 'female_users', uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return { profile: snap.data() as FemaleUserProfile, isNew: false };
    }

    const secretCode = await generateUniqueSecretCode();
    const newProfile: FemaleUserProfile = {
      uid,
      email: email || '',
      displayName: displayName || 'Emma',
      secretCode,
      partnerConnected: false,
      partnerName: '',
      averageCycleLength: 28,
      averagePeriodLength: 5,
      lutealPhaseLength: 14,
      lastPeriodStartDate: '2026-10-11',
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save profile and pair code
    await setDoc(userRef, newProfile);
    await setDoc(doc(db, 'pair_codes', secretCode), {
      code: secretCode,
      femaleUid: uid,
      femaleName: newProfile.displayName,
      maleConnected: false,
      maleName: '',
      createdAt: new Date().toISOString(),
    });

    return { profile: newProfile, isNew: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `female_users/${uid}`);
    throw error;
  }
}

/**
 * Save / Update Female Profile
 */
export async function updateFemaleProfile(
  uid: string,
  updates: Partial<FemaleUserProfile>
): Promise<void> {
  const userRef = doc(db, 'female_users', uid);
  try {
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    // Also update pair_codes if name or code changed
    if (updates.displayName && updates.secretCode) {
      await updateDoc(doc(db, 'pair_codes', updates.secretCode), {
        femaleName: updates.displayName,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `female_users/${uid}`);
  }
}

/**
 * Connect a Male partner with a Secret Code
 */
export async function connectMaleWithCode(
  secretCode: string,
  maleName: string
): Promise<{ success: boolean; femaleProfile?: FemaleUserProfile; error?: string }> {
  const cleanCode = secretCode.trim();
  const codeRef = doc(db, 'pair_codes', cleanCode);

  try {
    const codeSnap = await getDoc(codeRef);
    if (!codeSnap.exists()) {
      return { success: false, error: 'Secret code not found. Please double check the code.' };
    }

    const codeData = codeSnap.data() as PairCodeDoc;
    const femaleUserRef = doc(db, 'female_users', codeData.femaleUid);
    const femaleSnap = await getDoc(femaleUserRef);

    if (!femaleSnap.exists()) {
      return { success: false, error: 'Associated female account could not be found.' };
    }

    const femaleProfile = femaleSnap.data() as FemaleUserProfile;

    // Check if code was already used by another male
    // If maleName is updating existing or new connection, update both
    const partnerName = maleName.trim() || 'Alex';

    await updateDoc(codeRef, {
      maleConnected: true,
      maleName: partnerName,
    });

    await updateDoc(femaleUserRef, {
      partnerConnected: true,
      partnerName,
      partnerConnectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    femaleProfile.partnerConnected = true;
    femaleProfile.partnerName = partnerName;

    return { success: true, femaleProfile };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `pair_codes/${cleanCode}`);
    return { success: false, error: 'Failed to connect. Please try again.' };
  }
}

/**
 * Male partner updates his name in database
 */
export async function updateMalePartnerName(
  femaleUid: string,
  secretCode: string,
  newName: string
): Promise<void> {
  const cleanName = newName.trim();
  try {
    await updateDoc(doc(db, 'female_users', femaleUid), {
      partnerName: cleanName,
      updatedAt: new Date().toISOString(),
    });

    if (secretCode) {
      await updateDoc(doc(db, 'pair_codes', secretCode), {
        maleName: cleanName,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `female_users/${femaleUid}`);
  }
}

/**
 * Save daily log in Firestore
 */
export async function saveDailyLogToFirestore(
  femaleUid: string,
  log: DailyLog
): Promise<void> {
  const logRef = doc(db, 'female_users', femaleUid, 'daily_logs', log.date);
  try {
    await setDoc(logRef, log, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `female_users/${femaleUid}/daily_logs/${log.date}`);
  }
}

/**
 * Save cycle record to Firestore
 */
export async function saveCycleToFirestore(
  femaleUid: string,
  cycle: CycleRecord
): Promise<void> {
  const cycleRef = doc(db, 'female_users', femaleUid, 'cycles', cycle.id);
  try {
    await setDoc(cycleRef, cycle, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `female_users/${femaleUid}/cycles/${cycle.id}`);
  }
}

export async function deleteCycleFromFirestore(
  femaleUid: string,
  cycleId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'female_users', femaleUid, 'cycles', cycleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `female_users/${femaleUid}/cycles/${cycleId}`);
  }
}

export async function deleteDailyLogFromFirestore(
  femaleUid: string,
  dateStr: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'female_users', femaleUid, 'daily_logs', dateStr));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `female_users/${femaleUid}/daily_logs/${dateStr}`);
  }
}

export async function unlinkPartner(femaleUid: string, secretCode: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'female_users', femaleUid), {
      partnerConnected: false,
      partnerName: '',
      updatedAt: new Date().toISOString(),
    });

    if (secretCode) {
      await updateDoc(doc(db, 'pair_codes', secretCode), {
        maleConnected: false,
        maleName: '',
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `female_users/${femaleUid}`);
  }
}

export async function seedInitialUserDataIfEmpty(
  femaleUid: string,
  initialCycles: CycleRecord[],
  initialLogs: DailyLog[]
): Promise<void> {
  try {
    const cyclesSnap = await getDocs(collection(db, 'female_users', femaleUid, 'cycles'));
    if (cyclesSnap.empty) {
      for (const c of initialCycles) {
        await setDoc(doc(db, 'female_users', femaleUid, 'cycles', c.id), c);
      }
    }

    const logsSnap = await getDocs(collection(db, 'female_users', femaleUid, 'daily_logs'));
    if (logsSnap.empty) {
      for (const l of initialLogs) {
        await setDoc(doc(db, 'female_users', femaleUid, 'daily_logs', l.date), l);
      }
    }
  } catch (error) {
    console.warn('Initial seeding fallback:', error);
  }
}

