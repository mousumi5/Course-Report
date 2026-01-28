
import React from 'react';
import { ActivityReport } from '../types';
import { COURSES_META } from '../constants';

interface ReportCardProps {
  report: ActivityReport;
  onDelete: (id: string) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onDelete }) => {
  const meta = COURSES_META[report.courseId] || { icon: '📝', color: 'bg-slate-100 text-slate-700' };

  const formatDate = (d: string) => {
    if (!d) return 'N/A';
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (t: string) => {
    if (!t) return 'N/A';
    let timeStr = String(t);
    if (timeStr.includes('T')) {
      const parts = timeStr.split('T')[1];
      timeStr = parts ? parts.substring(0, 5) : timeStr;
    }
    return `${timeStr} hrs.`;
  };

  const calculateWorkDays = (start: string, end?: string) => {
    const s = new Date(start);
    const e = new Date(end || start);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
    let count = 0;
    let cur = new Date(s);
    while (cur <= e) {
      if (cur.getDay() !== 0) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count || 1;
  };

  const calculateHoursPerDay = (from: string, to: string) => {
    const parseTime = (str: string) => {
      let s = str;
      if (s.includes('T')) s = s.split('T')[1].substring(0, 5);
      const parts = s.split(':').map(Number);
      return parts[0] + (parts[1] / 60);
    };
    const diff = parseTime(to) - parseTime(from);
    return diff > 0 ? diff : 0;
  };

  const isLong = report.dateTo && report.dateTo !== report.date;
  const workDays = calculateWorkDays(report.date, report.dateTo);
  const dailyHours = calculateHoursPerDay(report.timeFrom, report.timeTo);
  const totalHours = (workDays * dailyHours).toFixed(1);

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 flex items-center justify-center rounded-[1.25rem] text-2xl shadow-inner ${meta.color} group-hover:scale-110 transition-transform duration-300`}>
            {meta.icon}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm md:text-base uppercase tracking-tight">{report.courseId}</h3>
            <div className="text-[10px] text-slate-500 font-bold uppercase mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              <span className="bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                {formatDate(report.date)}{isLong ? ` — ${formatDate(report.dateTo!)}` : ''}
              </span>
              <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-xl border border-indigo-100">
                {formatTime(report.timeFrom)} — {formatTime(report.timeTo)}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(report.id); }}
          className="text-slate-200 hover:text-rose-500 p-2.5 transition-all rounded-full hover:bg-rose-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-indigo-600/5 p-4 rounded-3xl border border-indigo-100/50 flex flex-col justify-center">
          <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Metrics</p>
          <p className="text-xs font-black text-slate-800 uppercase leading-tight">
            {workDays} Days • {totalHours} Total Hrs.
          </p>
        </div>
        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center justify-around">
          <div className="text-center">
            <p className="text-[7px] font-black text-slate-400 uppercase">M</p>
            <p className="text-sm font-black text-indigo-600 leading-none">{report.totalMale || 0}</p>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="text-center">
            <p className="text-[7px] font-black text-slate-400 uppercase">F</p>
            <p className="text-sm font-black text-pink-500 leading-none">{report.totalFemale || 0}</p>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="text-center">
            <p className="text-[7px] font-black text-slate-400 uppercase">Total</p>
            <p className="text-sm font-black text-slate-800 leading-none">{report.grandTotal || 0}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl">
          <div className="flex items-center gap-2 flex-1 border-r border-slate-100">
             <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
             <p className="text-[10px] font-black text-slate-700 truncate uppercase">{report.location || 'Staff Hall'}</p>
          </div>
          <div className="flex items-center gap-2 flex-1">
             <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             <p className="text-[10px] font-black text-slate-700 truncate uppercase">{report.instructor || 'Staff'}</p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-3xl border-l-8 border-l-indigo-600 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Subject Matter & Observation</p>
          <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase">
            <span className="text-slate-900">"{report.topics}"</span>
            {report.remarks && <span className="block mt-2 pt-2 border-t border-slate-200 text-indigo-500 font-black italic tracking-tight">— {report.remarks}</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
