
import React from 'react';
import { CourseType } from '../types';
import { COURSES_META } from '../constants';

interface CourseWidgetProps {
  course: CourseType;
  onClick: (course: CourseType) => void;
}

const CourseWidget: React.FC<CourseWidgetProps> = ({ course, onClick }) => {
  const meta = COURSES_META[course];

  return (
    <button
      onClick={() => onClick(course)}
      className="flex flex-col items-center justify-center p-4 md:p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300 active:scale-90 text-center group relative overflow-hidden"
    >
      <div className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-2xl md:rounded-[1.5rem] text-2xl md:text-3xl mb-3 ${meta.color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
        {meta.icon}
      </div>
      <span className="text-[10px] md:text-xs font-black text-slate-800 line-clamp-2 leading-tight uppercase tracking-tight">
        {course}
      </span>
      <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-500/5 rounded-bl-full transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500"></div>
    </button>
  );
};

export default CourseWidget;
