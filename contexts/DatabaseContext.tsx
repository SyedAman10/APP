import databaseService, { Patient, Session, TherapeuticGoal } from '@/services/DatabaseService';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface DatabaseContextType {
  isInitialized: boolean;
  currentPatient: Patient | null;
  patients: Patient[];
  sessions: Session[];
  goals: TherapeuticGoal[];
  initializeDatabase: () => Promise<void>;
  setCurrentPatient: (patient: Patient | null) => void;
  createNewPatient: (patientData: Omit<Patient, 'id' | 'createdAt'>) => Promise<Patient>;
  createNewSession: (sessionData: Omit<Session, 'id'>) => Promise<Session>;
  createNewGoal: (goalData: Omit<TherapeuticGoal, 'id' | 'createdAt'>) => Promise<TherapeuticGoal>;
  refreshData: () => Promise<void>;
  // Debug methods
  getDatabaseInfo: () => Promise<any>;
  getAllData: () => Promise<any>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goals, setGoals] = useState<TherapeuticGoal[]>([]);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const initializeDatabase = async () => {
    try {
      console.log('Starting database initialization...');
      await databaseService.initialize();
      setIsInitialized(true);
      setInitializationError(null);
      
      // Load existing patients
      const existingPatients = await databaseService.getAllPatients();
      setPatients(existingPatients);
      
      // If there are patients, set the first one as current
      if (existingPatients.length > 0) {
        setCurrentPatient(existingPatients[0]);
        await loadPatientData(existingPatients[0].id);
      }
      
      console.log('Database context initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database context:', error);
      setInitializationError(error instanceof Error ? error.message : 'Unknown error');
      
      // Don't show alert immediately, let the user see the error state
      // and potentially retry
    }
  };

  const loadPatientData = async (patientId: string) => {
    try {
      const [patientSessions, patientGoals] = await Promise.all([
        databaseService.getPatientSessions(patientId),
        databaseService.getPatientGoals(patientId),
      ]);
      
      setSessions(patientSessions);
      setGoals(patientGoals);
    } catch (error) {
      console.error('Failed to load patient data:', error);
    }
  };

  const createNewPatient = async (patientData: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> => {
    try {
      const newPatient = await databaseService.createPatient(patientData);
      setPatients(prev => [newPatient, ...prev]);
      setCurrentPatient(newPatient);
      
      // Clear sessions and goals for new patient
      setSessions([]);
      setGoals([]);
      
      return newPatient;
    } catch (error) {
      console.error('Failed to create patient:', error);
      throw error;
    }
  };

  const createNewSession = async (sessionData: Omit<Session, 'id'>): Promise<Session> => {
    try {
      const newSession = await databaseService.createSession(sessionData);
      setSessions(prev => [newSession, ...prev]);
      
      // Update current patient's last session date
      if (currentPatient) {
        const updatedPatient = { ...currentPatient, lastSessionAt: sessionData.sessionDate };
        setCurrentPatient(updatedPatient);
        setPatients(prev => prev.map(p => p.id === currentPatient.id ? updatedPatient : p));
      }
      
      return newSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  };

  const createNewGoal = async (goalData: Omit<TherapeuticGoal, 'id' | 'createdAt'>): Promise<TherapeuticGoal> => {
    try {
      const newGoal = await databaseService.createGoal(goalData);
      setGoals(prev => [newGoal, ...prev]);
      return newGoal;
    } catch (error) {
      console.error('Failed to create goal:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    if (currentPatient) {
      await loadPatientData(currentPatient.id);
    }
  };

  // Initialize database when the provider mounts
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const attemptInitialization = async () => {
      try {
        await initializeDatabase();
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Database initialization failed, retrying... (${retryCount}/${maxRetries})`);
          // Wait a bit before retrying
          setTimeout(attemptInitialization, 1000 * retryCount);
        } else {
          console.error('Database initialization failed after all retries');
          Alert.alert(
            'Database Error',
            'Failed to initialize the local database after multiple attempts. Please restart the app.',
            [
              { text: 'Restart App', onPress: () => {} },
              { text: 'OK' }
            ]
          );
        }
      }
    };
    
    attemptInitialization();
    
    // Cleanup on unmount
    return () => {
      try {
        databaseService.closeDatabase();
      } catch (error) {
        console.error('Error closing database:', error);
      }
    };
  }, []);

  // Load patient data when current patient changes
  useEffect(() => {
    if (currentPatient) {
      loadPatientData(currentPatient.id);
    }
  }, [currentPatient]);

  const value: DatabaseContextType = {
    isInitialized,
    currentPatient,
    patients,
    sessions,
    goals,
    initializeDatabase,
    setCurrentPatient,
    createNewPatient,
    createNewSession,
    createNewGoal,
    refreshData,
    getDatabaseInfo: databaseService.getDatabaseInfo.bind(databaseService),
    getAllData: databaseService.getAllData.bind(databaseService),
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
