import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  runTransaction
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
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Partial<T> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean as Partial<T>;
}

/**
 * Generate a 4-character unique uppercase secret code without ambiguous characters or symbols.
 * Case-insensitive, easy to type on phones. Exactly 4 characters.
 */
export async function generateUniqueSecretCode(): Promise<string> {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (let attempt = 0; attempt < 15; attempt++) {
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
    } catch {
      return candidate;
    }
  }
  return '7K9M';
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
    const resolvedName = displayName && displayName.trim() && displayName !== 'Emma'
      ? displayName.trim()
      : email
      ? email.split('@')[0]
      : 'You';

    const newProfile: FemaleUserProfile = {
      uid,
      email: email || '',
      displayName: resolvedName,
      secretCode,
      partnerConnected: false,
      partnerName: '',
      averageCycleLength: 28,
      averagePeriodLength: 5,
      lutealPhaseLength: 14,
      lastPeriodStartDate: '',
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
 * Save / Update Female Profile.
 * Keeps the female_users and pair_codes documents synchronized
 * when the secret code or display name changes.
 */
export async function updateFemaleProfile(
  uid: string,
  updates: Partial<FemaleUserProfile>
): Promise<void> {
  const userRef = doc(db, 'female_users', uid);

  try {
    await runTransaction(db, async (transaction) => {
      // Read the current profile first.
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error('Female profile not found.');
      }

      const currentProfile = userSnap.data() as FemaleUserProfile;

      const oldCode = currentProfile.secretCode;
      const newCode = updates.secretCode?.trim() || oldCode;
      const name = updates.displayName ?? currentProfile.displayName;

      const oldCodeRef = oldCode
        ? doc(db, 'pair_codes', oldCode)
        : null;

      const newCodeRef = newCode
        ? doc(db, 'pair_codes', newCode)
        : null;

      // Read all required documents before writing.
      const oldCodeSnap = oldCodeRef
        ? await transaction.get(oldCodeRef)
        : null;

      const codeChanged = newCode !== oldCode;

      const newCodeSnap =
        newCodeRef && codeChanged
          ? await transaction.get(newCodeRef)
          : null;

      // Never overwrite another user's pairing code.
      if (
        codeChanged &&
        newCodeSnap?.exists() &&
        newCodeSnap.data().femaleUid !== uid
      ) {
        throw new Error(
          'This secret code is already in use. Generate another code.'
        );
      }

      const now = new Date().toISOString();

      // Update the female profile.
      transaction.update(userRef, {
        ...updates,
        ...(updates.secretCode !== undefined
          ? { secretCode: newCode }
          : {}),
        updatedAt: now,
      });

      if (newCodeRef) {
        // Preserve an existing connection if this code already
        // belongs to the same female account.
        const existingNewCode = newCodeSnap?.exists()
          ? newCodeSnap.data()
          : {};

        transaction.set(newCodeRef, {
          code: newCode,
          femaleUid: uid,
          femaleName: name,
          maleConnected:
            existingNewCode.maleConnected === true,
          maleName: existingNewCode.maleName || '',
          createdAt:
            existingNewCode.createdAt || now,
        });
      }

      // Remove the old code only if it belongs to this user.
      if (
        codeChanged &&
        oldCodeRef &&
        oldCodeSnap?.exists() &&
        oldCodeSnap.data().femaleUid === uid
      ) {
        transaction.delete(oldCodeRef);
      }
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `female_users/${uid}`
    );
    throw error;
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
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `female_users/${femaleUid}`);
  }

  if (secretCode) {
    try {
      const codeRef = doc(db, 'pair_codes', secretCode);
      const codeSnap = await getDoc(codeRef);
      if (codeSnap.exists()) {
        await updateDoc(codeRef, {
          maleName: cleanName,
        });
      }
    } catch (err) {
      console.warn('Skipped pair_codes update (code may have changed):', err);
    }
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
    const cleanLog = sanitizeForFirestore(log);
    await setDoc(logRef, cleanLog, { merge: true });
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
    const cleanCycle = sanitizeForFirestore(cycle);
    await setDoc(cycleRef, cleanCycle, { merge: true });
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

const EXACT_LEGACY_SAMPLE_CYCLE_IDS = new Set([
  'cycle-2026-10',
  'cycle-2026-09',
  'cycle-2026-08',
  'cycle-2026-07',
  'cycle-2026-06',
  'cycle-2026-05',
]);

const EXACT_LEGACY_SAMPLE_LOG_IDS = new Set([
  'log-2026-10-24',
  'log-2026-10-23',
  'log-2026-10-22',
  'log-2026-10-21',
  'log-2026-10-20',
  'log-2026-10-19',
  'log-2026-10-18',
  'log-2026-10-17',
  'log-2026-10-16',
  'log-2026-10-15',
  'log-2026-10-14',
  'log-2026-10-13',
  'log-2026-10-12',
  'log-2026-10-11',
]);

/**
 * Remove any demo/sample data that may have been saved to a real user's database.
 * Strictly avoids deleting user-created cycles or logs.
 */
export async function purgeSampleDataFromRealUser(femaleUid: string): Promise<void> {
  if (!femaleUid || femaleUid === 'sample-female-uid') return;

  try {
    const cyclesSnap = await getDocs(collection(db, 'female_users', femaleUid, 'cycles'));
    for (const docSnap of cyclesSnap.docs) {
      const data = docSnap.data();
      const isSample =
        docSnap.id.startsWith('sample-') ||
        EXACT_LEGACY_SAMPLE_CYCLE_IDS.has(docSnap.id) ||
        data.isSampleDemo === true;
      if (isSample) {
        await deleteDoc(docSnap.ref);
      }
    }

    const logsSnap = await getDocs(collection(db, 'female_users', femaleUid, 'daily_logs'));
    for (const docSnap of logsSnap.docs) {
      const data = docSnap.data();
      const isSample =
        docSnap.id.startsWith('sample-') ||
        (EXACT_LEGACY_SAMPLE_LOG_IDS.has(data.id) && data.customNote && data.customNote.includes('quiet dinner tonight')) ||
        data.isSampleDemo === true;
      if (isSample) {
        await deleteDoc(docSnap.ref);
      }
    }
  } catch (err) {
    console.warn('Purge sample data:', err);
  }
}

/**
 * Real users never have sample data seeded. Function maintained as a no-op for backward compatibility.
 */
export async function seedInitialUserDataIfEmpty(
  _femaleUid: string,
  _initialCycles: CycleRecord[],
  _initialLogs: DailyLog[]
): Promise<void> {
  // Deliberately no-op. Real users must start with 0 previous cycles and 0 logs.
}

