
import { ActivityReport, StaffRecord } from '../types';

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbz7Noaa1AlIZEpHW8fnK4FNdSV7sQ0arze7mOEhK7951S4BIAOSGgNdXtur5dMglwh8/exec';
const STORAGE_KEY = 'coursepulse_reports_backup';
const STAFF_STORAGE_KEY = 'coursepulse_staff_backup';

export const dataService = {
  getReports: async (): Promise<ActivityReport[]> => {
    try {
      const response = await fetch(`${WEBAPP_URL}?action=getReports`);
      if (!response.ok) throw new Error('Fetch failed');
      const data = await response.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    } catch (error) {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
  },

  saveReport: async (report: Omit<ActivityReport, 'id' | 'timestamp'>): Promise<ActivityReport> => {
    const newReport = { ...report, id: crypto.randomUUID(), timestamp: Date.now() } as ActivityReport;
    try {
      await fetch(WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newReport, action: 'saveReport' }),
      });
      return newReport;
    } catch (error) {
      return newReport;
    }
  },

  deleteReport: async (id: string): Promise<void> => {
    try {
      await fetch(WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'deleteReport' }),
      });
    } catch (e) {}
  },

  getStaffRecords: async (): Promise<StaffRecord[]> => {
    try {
      const response = await fetch(`${WEBAPP_URL}?action=getStaff`);
      if (!response.ok) throw new Error('Fetch failed');
      const data = await response.json();
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(data));
      return data;
    } catch (error) {
      const stored = localStorage.getItem(STAFF_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
  },

  saveStaffRecord: async (record: StaffRecord | Omit<StaffRecord, 'id' | 'timestamp'>, isUpdate: boolean = false): Promise<StaffRecord> => {
    const newRecord = { 
      ...record, 
      id: (record as StaffRecord).id || crypto.randomUUID(), 
      timestamp: Date.now() 
    } as StaffRecord;
    try {
      await fetch(WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRecord, action: isUpdate ? 'updateStaff' : 'saveStaff' }),
      });
      return newRecord;
    } catch (error) {
      return newRecord;
    }
  },

  deleteStaffRecord: async (id: string): Promise<void> => {
    try {
      await fetch(WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'deleteStaff' }),
      });
    } catch (e) {}
  }
};
