import { v4 as uuidv4 } from 'uuid';
import { ScanConfig, startScan, Scan } from './scanService';
import { addDays, addWeeks, addMonths, isPast, parseISO } from 'date-fns';

export interface ScheduleDetails {
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  startDate: string; // ISO string (YYYY-MM-DD)
  startTime: string; // HH:mm
  nextRun: number; // Timestamp
}

export interface ScheduledScan {
  id: string;
  name: string; // A user-friendly name for the scheduled scan
  config: ScanConfig;
  schedule: ScheduleDetails;
  lastRun?: number; // Timestamp of the last time it was triggered
  status: 'active' | 'paused' | 'completed' | 'failed';
  history: string[]; // Array of scan IDs triggered by this schedule
}

const SCHEDULED_SCANS_STORAGE_KEY = 'abspider-scheduled-scans';
let scheduledScansCache: ScheduledScan[] = loadScheduledScansFromStorage();

function loadScheduledScansFromStorage(): ScheduledScan[] {
  try {
    const stored = localStorage.getItem(SCHEDULED_SCANS_STORAGE_KEY);
    return stored ? JSON.parse(stored).map((s: ScheduledScan) => ({
      ...s,
      // Ensure nextRun is a number, not a string from JSON
      schedule: {
        ...s.schedule,
        nextRun: typeof s.schedule.nextRun === 'string' ? new Date(s.schedule.nextRun).getTime() : s.schedule.nextRun,
      },
      lastRun: s.lastRun ? (typeof s.lastRun === 'string' ? new Date(s.lastRun).getTime() : s.lastRun) : undefined,
    })) : [];
  } catch (error) {
    console.error('Failed to load scheduled scans from storage:', error);
    return [];
  }
}

function saveScheduledScansToStorage(scans: ScheduledScan[]) {
  try {
    localStorage.setItem(SCHEDULED_SCANS_STORAGE_KEY, JSON.stringify(scans));
  } catch (error) {
    console.error('Failed to save scheduled scans to localStorage:', error);
    throw new Error('Failed to save scheduled scan data. Local storage might be full or inaccessible.');
  }
}

export const getScheduledScans = (): ScheduledScan[] => {
  return scheduledScansCache;
};

export const addScheduledScan = (name: string, config: ScanConfig, scheduleDetails: Omit<ScheduleDetails, 'nextRun'>): ScheduledScan => {
  const { startDate, startTime, frequency } = scheduleDetails;
  const [hour, minute] = startTime.split(':').map(Number);
  
  let initialNextRunDate = new Date(startDate);
  initialNextRunDate.setHours(hour, minute, 0, 0);

  // If the initialNextRunDate is in the past, calculate the next occurrence based on frequency
  let nextRunTimestamp = initialNextRunDate.getTime();
  while (isPast(nextRunTimestamp)) {
    const tempDate = new Date(nextRunTimestamp);
    if (frequency === 'daily') {
      nextRunTimestamp = addDays(tempDate, 1).getTime();
    } else if (frequency === 'weekly') {
      nextRunTimestamp = addWeeks(tempDate, 1).getTime();
    } else if (frequency === 'monthly') {
      nextRunTimestamp = addMonths(tempDate, 1).getTime();
    } else { // 'once' or unknown frequency in the past
      nextRunTimestamp = Date.now() + 60 * 1000; // Set to 1 minute from now if 'once' is in the past
      break;
    }
  }

  const newScheduledScan: ScheduledScan = {
    id: uuidv4(),
    name,
    config,
    schedule: {
      ...scheduleDetails,
      nextRun: nextRunTimestamp,
    },
    status: 'active',
    history: [],
  };

  scheduledScansCache = [newScheduledScan, ...scheduledScansCache];
  saveScheduledScansToStorage(scheduledScansCache);
  console.log(`[ScheduledScanService] Added new scheduled scan: ${name}, next run: ${new Date(nextRunTimestamp).toLocaleString()}`);
  return newScheduledScan;
};

export const updateScheduledScan = (id: string, updates: Partial<ScheduledScan>): ScheduledScan | undefined => {
  const index = scheduledScansCache.findIndex(s => s.id === id);
  if (index === -1) return undefined;

  const updatedScan = { ...scheduledScansCache[index], ...updates };
  
  // Recalculate nextRun if schedule details are updated or status changes to active
  if (updates.schedule || (updates.status === 'active' && scheduledScansCache[index].status === 'paused')) {
    const { startDate, startTime, frequency } = updatedScan.schedule;
    const [hour, minute] = startTime.split(':').map(Number);
    
    let newNextRunDate = new Date(startDate);
    newNextRunDate.setHours(hour, minute, 0, 0);

    let nextRunTimestamp = newNextRunDate.getTime();
    while (isPast(nextRunTimestamp)) {
      const tempDate = new Date(nextRunTimestamp);
      if (frequency === 'daily') {
        nextRunTimestamp = addDays(tempDate, 1).getTime();
      } else if (frequency === 'weekly') {
        nextRunTimestamp = addWeeks(tempDate, 1).getTime();
      } else if (frequency === 'monthly') {
        nextRunTimestamp = addMonths(tempDate, 1).getTime();
      } else { // 'once' or unknown frequency in the past
        nextRunTimestamp = Date.now() + 60 * 1000; // Set to 1 minute from now if 'once' is in the past
        break;
      }
    }
    updatedScan.schedule.nextRun = nextRunTimestamp;
  }

  scheduledScansCache[index] = updatedScan;
  saveScheduledScansToStorage(scheduledScansCache);
  console.log(`[ScheduledScanService] Updated scheduled scan: ${updatedScan.name}, next run: ${new Date(updatedScan.schedule.nextRun).toLocaleString()}`);
  return updatedScan;
};

export const deleteScheduledScan = (id: string): boolean => {
  const initialLength = scheduledScansCache.length;
  scheduledScansCache = scheduledScansCache.filter(s => s.id !== id);
  saveScheduledScansToStorage(scheduledScansCache);
  console.log(`[ScheduledScanService] Deleted scheduled scan: ${id}`);
  return scheduledScansCache.length < initialLength;
};

export const checkAndRunScheduledScans = async (): Promise<void> => {
  const now = Date.now();
  const scansToRun: ScheduledScan[] = [];

  scheduledScansCache = scheduledScansCache.map(s => {
    if (s.status === 'active' && s.schedule.nextRun <= now) {
      scansToRun.push(s);
      
      // Calculate next run time
      let nextRunTimestamp = s.schedule.nextRun;
      const currentRunDate = new Date(nextRunTimestamp);

      if (s.schedule.frequency === 'daily') {
        nextRunTimestamp = addDays(currentRunDate, 1).getTime();
      } else if (s.schedule.frequency === 'weekly') {
        nextRunTimestamp = addWeeks(currentRunDate, 1).getTime();
      } else if (s.schedule.frequency === 'monthly') {
        nextRunTimestamp = addMonths(currentRunDate, 1).getTime();
      } else { // 'once'
        s.status = 'completed'; // Mark as completed after running once
      }

      return {
        ...s,
        lastRun: now,
        schedule: { ...s.schedule, nextRun: nextRunTimestamp },
        status: s.schedule.frequency === 'once' ? 'completed' : s.status,
      };
    }
    return s;
  });

  if (scansToRun.length > 0) {
    console.log(`[ScheduledScanService] Triggering ${scansToRun.length} scheduled scans.`);
    saveScheduledScansToStorage(scheduledScansCache); // Save updated nextRun/status before starting scans
    
    for (const scheduledScan of scansToRun) {
      try {
        const scanId = await startScan(scheduledScan.config);
        console.log(`[ScheduledScanService] Triggered scan ${scanId} for scheduled scan ${scheduledScan.name}`);
        updateScheduledScan(scheduledScan.id, { history: [...scheduledScan.history, scanId] });
      } catch (error) {
        console.error(`[ScheduledScanService] Failed to trigger scan for ${scheduledScan.name}:`, error);
        updateScheduledScan(scheduledScan.id, { status: 'failed' }); // Mark scheduled scan as failed if trigger fails
      }
    }
  }
};

// Initialize the checker
let scheduledScanInterval: NodeJS.Timeout | null = null;
export const startScheduledScanChecker = (intervalMs: number = 60 * 1000) => { // Check every minute
  if (scheduledScanInterval) {
    clearInterval(scheduledScanInterval);
  }
  scheduledScanInterval = setInterval(checkAndRunScheduledScans, intervalMs);
  console.log(`[ScheduledScanService] Started scheduled scan checker every ${intervalMs / 1000} seconds.`);
};

export const stopScheduledScanChecker = () => {
  if (scheduledScanInterval) {
    clearInterval(scheduledScanInterval);
    scheduledScanInterval = null;
    console.log('[ScheduledScanService] Stopped scheduled scan checker.');
  }
};

// Start the checker when the service is loaded
startScheduledScanChecker();