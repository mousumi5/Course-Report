
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CourseType, ActivityReport, StaffRecord, EligibilityStatus } from './types';
import { dataService } from './services/dataService';
import CourseWidget from './components/CourseWidget';
import ReportCard from './components/ReportCard';

type View = 'dashboard' | 'reports' | 'form' | 'eligible';

const RANK_WEIGHTS: Record<string, number> = { 'AC': 1, 'INSP': 2, 'SI': 3, 'ASI': 4, 'HC': 5, 'CT': 6 };
const ELIGIBILITY_TABS: EligibilityStatus[] = ['BASIC ELIGIBLE', 'SCR ELIGIBLE', 'DGR ELIGIBLE', 'REFRESHER DUE'];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [reports, setReports] = useState<ActivityReport[]>([]);
  const [staffRecords, setStaffRecords] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<CourseType | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEligibleTab, setActiveEligibleTab] = useState<EligibilityStatus>('BASIC ELIGIBLE');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  const initialStaffState: StaffRecord = {
    id: '', sNo: '', cisfNo: '', rank: '', name: '', dob: '', doa: '', qualification: '',
    basicFrom: '', basicTo: '', basicRefFrom: '', basicRefTo: '',
    scrFrom: '', scrTo: '', dgrFrom: '', dgrTo: '',
    astiName: '', regNo: '', ebcasId: '', aadharNo: '', aepNo: '', idCardNo: '', 
    mobileNo: '', emailId: '', status: 'BASIC ELIGIBLE', timestamp: 0
  };

  const [staffFormData, setStaffFormData] = useState<StaffRecord>(initialStaffState);
  const [reportFormData, setReportFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    dateTo: '', timeFrom: '09:00', timeTo: '17:00', topics: '',
    instructor: '', location: '', remarks: '', totalMale: 0, totalFemale: 0
  });
  const [isLongDuration, setIsLongDuration] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsData, staffData] = await Promise.all([
        dataService.getReports(),
        dataService.getStaffRecords()
      ]);
      setReports(Array.isArray(reportsData) ? reportsData : []);
      setStaffRecords(Array.isArray(staffData) ? staffData : []);
    } catch (e) { console.error("Fetch error", e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getAutoStatus = (s: StaffRecord): EligibilityStatus => {
    const today = new Date();
    const TWO_YEARS_MS = 730 * 24 * 60 * 60 * 1000;

    const checkRefresher = (dateStr?: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      return (today.getTime() - d.getTime()) > TWO_YEARS_MS;
    };

    if (checkRefresher(s.basicTo) || checkRefresher(s.basicRefTo) || checkRefresher(s.scrTo) || checkRefresher(s.dgrTo)) {
      return 'REFRESHER DUE';
    }

    if (!s.basicTo) return 'BASIC ELIGIBLE';
    if (s.basicTo && !s.scrTo) return 'SCR ELIGIBLE';
    if (s.scrTo) return 'DGR ELIGIBLE';

    return 'BASIC ELIGIBLE';
  };

  const categorizedStaff = useMemo(() => {
    const tabs: Record<EligibilityStatus, StaffRecord[]> = {
      'BASIC ELIGIBLE': [], 'SCR ELIGIBLE': [], 'DGR ELIGIBLE': [], 'REFRESHER DUE': []
    };
    
    staffRecords.forEach(s => {
      const status = getAutoStatus(s);
      if (tabs[status]) tabs[status].push(s);
    });

    const q = (searchQuery || '').toLowerCase();
    Object.keys(tabs).forEach(k => {
      const key = k as EligibilityStatus;
      tabs[key] = tabs[key]
        .filter(s => 
          (s.name || '').toLowerCase().includes(q) || 
          (s.cisfNo || '').toLowerCase().includes(q)
        )
        .sort((a, b) => {
          const rankA = (a.rank || '').toUpperCase();
          const rankB = (b.rank || '').toUpperCase();
          return (RANK_WEIGHTS[rankA] || 99) - (RANK_WEIGHTS[rankB] || 99);
        });
    });
    return tabs;
  }, [staffRecords, searchQuery]);

  const handleCisfLookup = (val: string) => {
    const cleanVal = (val || '').toUpperCase();
    setStaffFormData(prev => ({ ...prev, cisfNo: cleanVal }));
    const existing = staffRecords.find(s => (s.cisfNo || '').toUpperCase() === cleanVal);
    if (existing) {
      setStaffFormData(existing);
      setIsUpdateMode(true);
    } else {
      setStaffFormData({ ...initialStaffState, cisfNo: cleanVal });
      setIsUpdateMode(false);
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      await dataService.saveStaffRecord(staffFormData, isUpdateMode);
      setShowEntryForm(false);
      setStaffFormData(initialStaffState);
      setIsUpdateMode(false);
      await fetchData();
    } catch (err) { alert("Sync Error"); } finally { setIsSaving(false); }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !selectedCourse) return;
    setIsSaving(true);
    try {
      const mCount = Number(reportFormData.totalMale) || 0;
      const fCount = Number(reportFormData.totalFemale) || 0;
      await dataService.saveReport({
        courseId: selectedCourse,
        date: reportFormData.date,
        dateTo: isLongDuration ? reportFormData.dateTo : undefined,
        timeFrom: reportFormData.timeFrom,
        timeTo: reportFormData.timeTo,
        topics: reportFormData.topics,
        instructor: reportFormData.instructor,
        location: reportFormData.location,
        remarks: reportFormData.remarks,
        totalMale: mCount,
        totalFemale: fCount,
        grandTotal: mCount + fCount,
        gos: 0, sosMale: 0, sosFemale: 0, orsMale: 0, orsFemale: 0
      });
      setSelectedCourse(null);
      setCurrentView('dashboard');
      setReportFormData({
        date: new Date().toISOString().split('T')[0],
        dateTo: '', timeFrom: '09:00', timeTo: '17:00', topics: '',
        instructor: '', location: '', remarks: '', totalMale: 0, totalFemale: 0
      });
      await fetchData();
    } catch (err) { alert("Sync Error"); } finally { setIsSaving(false); }
  };

  const handleExportCSV = () => {
    const currentList = categorizedStaff[activeEligibleTab];
    if (currentList.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "S.No", "CISF No", "Rank", "Name", "DOB", "DOA", "Qualification",
      "Basic From", "Basic To", "Basic Ref From", "Basic Ref To",
      "SCR From", "SCR To", "DGR From", "DGR To",
      "ASTI Name", "Reg No", "EBCAS ID", "Aadhar No", "AEP No", "ID Card No", "Mobile No", "Email ID", "Status"
    ];

    const csvRows = currentList.map(s => [
      `"${s.sNo || ''}"`,
      `"${s.cisfNo || ''}"`,
      `"${s.rank || ''}"`,
      `"${s.name || ''}"`,
      `"${s.dob || ''}"`,
      `"${s.doa || ''}"`,
      `"${s.qualification || ''}"`,
      `"${s.basicFrom || ''}"`,
      `"${s.basicTo || ''}"`,
      `"${s.basicRefFrom || ''}"`,
      `"${s.basicRefTo || ''}"`,
      `"${s.scrFrom || ''}"`,
      `"${s.scrTo || ''}"`,
      `"${s.dgrFrom || ''}"`,
      `"${s.dgrTo || ''}"`,
      `"${s.astiName || ''}"`,
      `"${s.regNo || ''}"`,
      `"${s.ebcasId || ''}"`,
      `"${s.aadharNo || ''}"`,
      `"${s.aepNo || ''}"`,
      `"${s.idCardNo || ''}"`,
      `"${s.mobileNo || ''}"`,
      `"${s.emailId || ''}"`,
      `"${activeEligibleTab}"`
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateString = new Date().toISOString().split('T')[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `Personnel_Registry_${activeEligibleTab.replace(/ /g, '_')}_${dateString}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDateLabel = (d?: string) => {
    if (!d) return 'N/A';
    const date = new Date(d);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN');
  };

  const renderDashboard = () => (
    <div className="flex flex-col min-h-screen animate-fadeIn">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 md:p-10 rounded-b-[2rem] md:rounded-[2.5rem] shadow-xl text-white mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-black mb-1 uppercase tracking-tighter">Personnel Pulse</h1>
            <p className="text-indigo-100 text-[10px] md:text-xs uppercase font-bold opacity-80 tracking-widest">Training Monitoring & Registry System</p>
          </div>
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            <div className="bg-white/10 backdrop-blur-md p-3 md:p-4 rounded-2xl md:rounded-3xl text-center border border-white/10">
              <p className="text-[7px] md:text-[9px] uppercase font-black text-indigo-200 mb-1">Total Force</p>
              <p className="text-sm md:text-2xl font-black">{staffRecords.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 md:p-4 rounded-2xl md:rounded-3xl text-center border border-white/10">
              <p className="text-[7px] md:text-[9px] uppercase font-black text-indigo-200 mb-1">Refresher</p>
              <p className="text-sm md:text-2xl font-black text-amber-300">{categorizedStaff['REFRESHER DUE'].length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 md:p-4 rounded-2xl md:rounded-3xl text-center border border-white/10">
              <p className="text-[7px] md:text-[9px] uppercase font-black text-indigo-200 mb-1">Activity Logs</p>
              <p className="text-sm md:text-2xl font-black">{reports.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-2 md:px-0 flex-1">
        <h2 className="text-lg md:text-2xl font-black text-slate-800 uppercase mb-6 tracking-tight px-2 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
          Daily Activity Grid
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4 mb-[140px]"> 
          {(Object.values(CourseType) as CourseType[]).map(course => (
            <CourseWidget key={course} course={course} onClick={(c) => { setSelectedCourse(c); setCurrentView('form'); }} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderPersonnelView = () => (
    <div className="space-y-6 animate-fadeIn pb-[140px]">
      <div className="sticky top-0 bg-slate-50/95 backdrop-blur-xl z-20 py-4 md:py-6 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter">Personnel Registry</h2>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <input type="text" placeholder="SEARCH..." className="w-full bg-white border border-slate-200 rounded-2xl px-10 py-3 text-xs font-bold uppercase shadow-sm focus:ring-2 focus:ring-indigo-500/20" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <svg className="w-4 h-4 text-slate-400 absolute left-4 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            
            <button 
              onClick={handleExportCSV} 
              className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl shadow-sm hover:bg-emerald-100 transition-all transform active:scale-95 flex items-center gap-2"
              title="Download CSV"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span className="hidden md:block text-[10px] font-black uppercase">CSV</span>
            </button>

            <button onClick={() => { setShowEntryForm(!showEntryForm); setStaffFormData(initialStaffState); setIsUpdateMode(false); }} className={`p-3 rounded-2xl shadow-lg shadow-indigo-100 ${showEntryForm ? 'bg-rose-500' : 'bg-indigo-600'} text-white transition-all transform active:scale-95`}>
              {showEntryForm ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
            </button>
          </div>
        </div>
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar scroll-smooth">
          {ELIGIBILITY_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveEligibleTab(tab)} className={`whitespace-nowrap px-5 py-3.5 rounded-2xl text-[10px] md:text-xs font-black uppercase transition-all shadow-sm ${activeEligibleTab === tab ? 'bg-indigo-600 text-white shadow-indigo-200 scale-105' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}>
              {tab} ({categorizedStaff[tab].length})
            </button>
          ))}
        </div>
      </div>

      {showEntryForm && (
        <form onSubmit={handleStaffSubmit} className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-indigo-50 shadow-2xl space-y-8 animate-fadeIn border-t-8 border-t-indigo-600 max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-black text-indigo-600 uppercase tracking-widest">{isUpdateMode ? 'Update' : 'New'} Force Profile</h3>
            {isUpdateMode && <span className="bg-emerald-50 text-emerald-600 text-[10px] px-4 py-2 rounded-full font-black border border-emerald-100 tracking-wider">CISF VALIDATED</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-2">Identity Info</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1"><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">S.No</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold" value={staffFormData.sNo} onChange={e => setStaffFormData({...staffFormData, sNo: e.target.value})} /></div>
                <div className="col-span-1"><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">CISF No</label><input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase" value={staffFormData.cisfNo} onChange={e => handleCisfLookup(e.target.value)} /></div>
                <div className="col-span-1"><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Rank</label><input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase" value={staffFormData.rank} onChange={e => setStaffFormData({...staffFormData, rank: e.target.value.toUpperCase()})} /></div>
                <div className="col-span-1"><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Name</label><input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase" value={staffFormData.name} onChange={e => setStaffFormData({...staffFormData, name: e.target.value.toUpperCase()})} /></div>
                <div className="col-span-1"><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">DOB</label><input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold" value={staffFormData.dob} onChange={e => setStaffFormData({...staffFormData, dob: e.target.value})} /></div>
                <div className="col-span-1"><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">DOA</label><input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold" value={staffFormData.doa} onChange={e => setStaffFormData({...staffFormData, doa: e.target.value})} /></div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-2">Credentials</p>
              <div className="space-y-3">
                <div className="col-span-2"><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Education/Qualification</label><input required type="text" placeholder="10th, Graduate, etc." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase" value={staffFormData.qualification} onChange={e => setStaffFormData({...staffFormData, qualification: e.target.value.toUpperCase()})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-1"><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Reg No</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase" value={staffFormData.regNo} onChange={e => setStaffFormData({...staffFormData, regNo: e.target.value.toUpperCase()})} /></div>
                  <div className="col-span-1"><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">EBCAS ID</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase" value={staffFormData.ebcasId} onChange={e => setStaffFormData({...staffFormData, ebcasId: e.target.value.toUpperCase()})} /></div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-2">Contact Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1"><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Mobile</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold" value={staffFormData.mobileNo} onChange={e => setStaffFormData({...staffFormData, mobileNo: e.target.value})} /></div>
                <div className="col-span-1"><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Aadhar No</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold" value={staffFormData.aadharNo} onChange={e => setStaffFormData({...staffFormData, aadharNo: e.target.value})} /></div>
                <div className="col-span-2"><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Email Address</label><input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold" value={staffFormData.emailId} onChange={e => setStaffFormData({...staffFormData, emailId: e.target.value})} /></div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/40 p-6 md:p-8 rounded-[2rem] border border-indigo-100 mt-8">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-100 pb-3 mb-6">Course History Dates</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Basic Course", from: "basicFrom", to: "basicTo" },
                { label: "Basic Refresher", from: "basicRefFrom", to: "basicRefTo" },
                { label: "Screener Course", from: "scrFrom", to: "scrTo" },
                { label: "DGR Course", from: "dgrFrom", to: "dgrTo" }
              ].map(course => (
                <div key={course.label} className="space-y-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase bg-white px-2 py-1 rounded border border-slate-200 block w-fit">{course.label}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-[10px] font-bold" value={(staffFormData as any)[course.from]} onChange={e => setStaffFormData({...staffFormData, [course.from]: e.target.value})} />
                    <input type="date" className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-[10px] font-bold" value={(staffFormData as any)[course.to]} onChange={e => setStaffFormData({...staffFormData, [course.to]: e.target.value})} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center pt-6">
            <button type="submit" disabled={isSaving} className={`w-full md:w-80 py-5 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all text-white ${isUpdateMode ? 'bg-amber-500 shadow-amber-100' : 'bg-indigo-600 shadow-indigo-100'}`}>
              {isSaving ? 'Processing...' : isUpdateMode ? 'Update Database' : 'Register Force Member'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorizedStaff[activeEligibleTab].map(s => (
          <div key={s.id} onClick={() => setSelectedStaff(s)} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center cursor-pointer hover:shadow-xl transition-all hover:border-indigo-200 transform hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center font-black text-indigo-600 text-[12px] uppercase border border-indigo-100/50">{s.rank || '??'}</div>
              <div>
                <h4 className="font-black text-slate-800 text-[13px] uppercase tracking-tight">{s.name || 'No Name'}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">CISF: {s.cisfNo || 'N/A'}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-2xl group">
              <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        ))}
        {categorizedStaff[activeEligibleTab].length === 0 && <div className="col-span-full text-center py-24 text-slate-300 font-black text-xs uppercase tracking-[0.2em] opacity-50">Zero records found in this category</div>}
      </div>

      {selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] p-4 md:p-10 flex items-center justify-center animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setSelectedStaff(null)} className="absolute right-8 top-8 text-slate-400 bg-slate-50 p-3 rounded-full hover:bg-slate-100 transition-all hover:rotate-90">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="flex items-center gap-6 mb-10">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-2xl shadow-indigo-200">{selectedStaff.rank}</div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">{selectedStaff.name}</h2>
                <p className="text-sm font-bold text-indigo-500 uppercase tracking-widest tracking-[0.3em]">CISF No: {selectedStaff.cisfNo}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <section>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Force Details</p>
                <div className="space-y-4">
                  {[
                    { l: "Qualification", v: selectedStaff.qualification },
                    { l: "Date of Birth", v: formatDateLabel(selectedStaff.dob) },
                    { l: "Date of Appointment", v: formatDateLabel(selectedStaff.doa) },
                    { l: "Registration No", v: selectedStaff.regNo },
                    { l: "EBCAS ID", v: selectedStaff.ebcasId }
                  ].map(item => (
                    <div key={item.l}>
                      <p className="text-[9px] font-black text-slate-400 uppercase">{item.l}</p>
                      <p className="text-sm font-bold text-slate-800 uppercase">{item.v || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="space-y-8">
                <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Training Status</p>
                  <div className="space-y-4">
                    {[
                      { l: "Basic Course", v: `${formatDateLabel(selectedStaff.basicFrom)} — ${formatDateLabel(selectedStaff.basicTo)}` },
                      { l: "Refresher", v: `${formatDateLabel(selectedStaff.basicRefFrom)} — ${formatDateLabel(selectedStaff.basicRefTo)}` },
                      { l: "Screener", v: `${formatDateLabel(selectedStaff.scrFrom)} — ${formatDateLabel(selectedStaff.scrTo)}` },
                      { l: "DGR", v: `${formatDateLabel(selectedStaff.dgrFrom)} — ${formatDateLabel(selectedStaff.dgrTo)}` }
                    ].map(item => (
                      <div key={item.l} className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase">{item.l}</span>
                        <span className="text-[11px] font-bold text-slate-800">{item.v}</span>
                      </div>
                    ))}
                  </div>
                </section>
                
                <section>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Contact Info</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></div>
                      <div><p className="text-[9px] font-black text-slate-400 uppercase">Mobile</p><p className="text-sm font-bold text-slate-800 uppercase">{selectedStaff.mobileNo || 'N/A'}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                      <div><p className="text-[9px] font-black text-slate-400 uppercase">Email</p><p className="text-sm font-bold text-slate-800 lowercase">{selectedStaff.emailId || 'N/A'}</p></div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-12 pt-8 border-t border-slate-100">
              <button onClick={() => { setStaffFormData(selectedStaff); setIsUpdateMode(true); setShowEntryForm(true); setSelectedStaff(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex-1 bg-indigo-600 text-white py-5 rounded-3xl font-black text-xs uppercase shadow-xl shadow-indigo-100 active:scale-95 transition-all">Modify Profile</button>
              <button onClick={() => { if(confirm('Erase this record permanently?')) dataService.deleteStaffRecord(selectedStaff.id).then(() => { fetchData(); setSelectedStaff(null); }); }} className="flex-1 bg-rose-50 text-rose-600 py-5 rounded-3xl font-black text-xs uppercase active:scale-95 transition-all">Erase Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-full md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto min-h-screen flex flex-col px-4 bg-slate-50 overflow-x-hidden pb-12 transition-all duration-500">
      <main className="flex-1 pt-4">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'reports' && (
          <div className="space-y-6 animate-fadeIn pb-[140px] pt-4">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter px-2">Activity History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map(r => <ReportCard key={r.id} report={r} onDelete={async (id) => { if(confirm('Delete?')) { await dataService.deleteReport(id); fetchData(); }}} />)}
              {reports.length === 0 && <div className="col-span-full text-center py-32 text-slate-300 font-black text-xs uppercase tracking-widest opacity-50">No logs found</div>}
            </div>
          </div>
        )}
        {currentView === 'eligible' && renderPersonnelView()}
        
        {currentView === 'form' && selectedCourse && (
          <div className="space-y-6 animate-fadeIn pb-[140px] pt-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-6 py-6 border-b border-slate-200">
              <button onClick={() => { setSelectedCourse(null); setCurrentView('dashboard'); }} className="p-3 bg-white rounded-2xl shadow-sm hover:bg-slate-50 transition-all border border-slate-100">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">{selectedCourse}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Session Log</p>
              </div>
            </div>
            <form onSubmit={handleReportSubmit} className="space-y-6">
              <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl border border-indigo-50 space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Training Parameters</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-indigo-600 uppercase">Long Course</span>
                    <button type="button" onClick={() => setIsLongDuration(!isLongDuration)} className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isLongDuration ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                      <span aria-hidden="true" className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isLongDuration ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Start Date</label>
                    <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold shadow-inner" value={reportFormData.date} onChange={e => setReportFormData({...reportFormData, date: e.target.value})} />
                  </div>
                  {isLongDuration && (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">End Date</label>
                      <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold shadow-inner" value={reportFormData.dateTo} onChange={e => setReportFormData({...reportFormData, dateTo: e.target.value})} />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Start Time</label><input required type="time" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold shadow-inner" value={reportFormData.timeFrom} onChange={e => setReportFormData({...reportFormData, timeFrom: e.target.value})} /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">End Time</label><input required type="time" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold shadow-inner" value={reportFormData.timeTo} onChange={e => setReportFormData({...reportFormData, timeTo: e.target.value})} /></div>
                </div>

                <textarea required placeholder="KEY TOPICS COVERED..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold uppercase min-h-[120px] shadow-inner focus:ring-2 focus:ring-indigo-500/20" value={reportFormData.topics} onChange={e => setReportFormData({...reportFormData, topics: e.target.value.toUpperCase()})} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input required type="text" placeholder="VENUE / LOCATION" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold uppercase shadow-inner" value={reportFormData.location} onChange={e => setReportFormData({...reportFormData, location: e.target.value.toUpperCase()})} />
                  <input required type="text" placeholder="CHIEF INSTRUCTOR" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold uppercase shadow-inner" value={reportFormData.instructor} onChange={e => setReportFormData({...reportFormData, instructor: e.target.value.toUpperCase()})} />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Male Trainees</label>
                    <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold shadow-inner" value={reportFormData.totalMale} onChange={e => setReportFormData({...reportFormData, totalMale: parseInt(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Female Trainees</label>
                    <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold shadow-inner" value={reportFormData.totalFemale} onChange={e => setReportFormData({...reportFormData, totalFemale: parseInt(e.target.value) || 0})} />
                  </div>
                </div>

                <input type="text" placeholder="SESSION REMARKS" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold uppercase shadow-inner" value={reportFormData.remarks} onChange={e => setReportFormData({...reportFormData, remarks: e.target.value.toUpperCase()})} />
              </div>
              <button type="submit" disabled={isSaving} className="w-full bg-indigo-600 text-white font-black py-6 rounded-[2rem] uppercase tracking-widest text-sm shadow-2xl shadow-indigo-100 active:scale-95 transition-all">
                {isSaving ? "TRANSMITTING DATA..." : "FINALIZE LOG ENTRY"}
              </button>
            </form>
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-fit max-w-md md:max-w-2xl bg-white/80 backdrop-blur-2xl border border-slate-200/50 flex justify-around md:gap-16 items-center px-8 py-5 rounded-[2.5rem] z-50 shadow-[0_20px_50px_-15px_rgba(79,70,229,0.2)]">
        {[
          { v: 'dashboard', l: 'Pulse', i: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { v: 'reports', l: 'Logs', i: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
          { v: 'eligible', l: 'Registry', i: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
        ].map(n => (
          <button key={n.v} onClick={() => { setCurrentView(n.v as View); setSearchQuery(''); setShowEntryForm(false); }} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${currentView === n.v ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600 opacity-60'}`}>
            <div className={`p-2 rounded-xl transition-colors ${currentView === n.v ? 'bg-indigo-50' : 'bg-transparent'}`}>
              <svg className="w-6 h-6" fill={currentView === n.v ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={n.i} /></svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{n.l}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
