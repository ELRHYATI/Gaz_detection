import { ref, set, get, onValue, off, push } from 'firebase/database';
import { database } from '../config/firebase';
import type { GasReading, Threshold, ServoMotorState } from '../types';

// Gas readings operations
export const saveGasReading = async (reading: Omit<GasReading, 'id'>) => {
  try {
    const readingsRef = ref(database, 'gasReadings');
    const newReadingRef = push(readingsRef);
    await set(newReadingRef, {
      ...reading,
      id: newReadingRef.key
    });
    return newReadingRef.key;
  } catch (error) {
    console.error('Error saving gas reading:', error);
    throw error;
  }
};

export const subscribeToLatestReading = (callback: (reading: GasReading | null) => void) => {
  const latestReadingRef = ref(database, 'latestReading');
  onValue(latestReadingRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
  
  return () => off(latestReadingRef);
};

export const getHistoricalReadings = async (limit: number = 100): Promise<GasReading[]> => {
  try {
    const readingsRef = ref(database, 'gasReadings');
    const snapshot = await get(readingsRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const values = Object.values(data) as GasReading[];
      return values
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    }
    return [];
  } catch (error) {
    console.error('Error fetching historical readings:', error);
    throw error;
  }
};

// Threshold operations
export const saveThreshold = async (threshold: Omit<Threshold, 'id'>) => {
  try {
    const thresholdRef = ref(database, 'thresholds/current');
    await set(thresholdRef, {
      ...threshold,
      id: 'current'
    });
  } catch (error) {
    console.error('Error saving threshold:', error);
    throw error;
  }
};

export const getThreshold = async (): Promise<Threshold | null> => {
  try {
    const thresholdRef = ref(database, 'thresholds/current');
    const snapshot = await get(thresholdRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as Threshold;
    }
    return null;
  } catch (error) {
    console.error('Error fetching threshold:', error);
    throw error;
  }
};

export const subscribeToThreshold = (callback: (threshold: Threshold | null) => void) => {
  const thresholdRef = ref(database, 'thresholds/current');
  onValue(thresholdRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
  
  return () => off(thresholdRef);
};

// Servo motor operations
export const updateServoMotorState = async (state: Omit<ServoMotorState, 'id'>) => {
  try {
    const servoRef = ref(database, 'servoMotor/current');
    await set(servoRef, {
      ...state,
      id: 'current'
    });
  } catch (error) {
    console.error('Error updating servo motor state:', error);
    throw error;
  }
};

export const getServoMotorState = async (): Promise<ServoMotorState | null> => {
  try {
    const servoRef = ref(database, 'servoMotor/current');
    const snapshot = await get(servoRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as ServoMotorState;
    }
    return null;
  } catch (error) {
    console.error('Error fetching servo motor state:', error);
    throw error;
  }
};

export const subscribeToServoMotorState = (callback: (state: ServoMotorState | null) => void) => {
  const servoRef = ref(database, 'servoMotor/current');
  onValue(servoRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
  
  return () => off(servoRef);
};