"use client";

import { updateDoc, increment, doc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";

type Course = {
  id: string;
  name: string;
  schedule?: Record<string, number>;
  attendanceLog?: Record<string, boolean>;
  attendedClasses?: number;
  totalClasses?: number;
  minAttendance?: number;
};

const getTodayKey = () => {
  const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return map[new Date().getDay()];
};

const getTodayDateKey = () => new Date().toISOString().split("T")[0];

type Props = {
  courses: Course[];
  userId: string;
  onUpdate: () => void;
};

export default function InteractiveTimetable({ courses, userId, onUpdate }: Props) {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const today = getTodayKey();
  const todayDateKey = getTodayDateKey();

  const toggleAttendance = async (course: Course, day: string) => {
    if (!course.schedule || !course.schedule[day]) return;
    if (day !== today) return; // Only allow marking for today

    const hours = course.schedule[day];
    const alreadyMarked = course.attendanceLog?.[todayDateKey] === true;

    try {
      const ref = doc(db, "users", userId, "courses", course.id);

      if (alreadyMarked) {
        // UNMARK
        await updateDoc(ref, {
          attendedClasses: increment(-hours),
          totalClasses: increment(-hours),
          [`attendanceLog.${todayDateKey}`]: false,
        });
      } else {
        // MARK
        await updateDoc(ref, {
          attendedClasses: increment(hours),
          totalClasses: increment(hours),
          [`attendanceLog.${todayDateKey}`]: true,
        });
      }

      onUpdate(); // Refresh parent data
    } catch (err) {
      console.error(err);
      alert("Failed to toggle attendance");
    }
  };

  return (
    <div className="bg-gray-800 border border-blue-500/20 rounded-xl p-6 shadow-lg shadow-blue-900/20 neon-glow-blue">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-white">Interactive Timetable</h2>
      </div>

      <p className="text-gray-400 text-sm mb-4">
        Click on today's classes to mark attendance
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-700 text-sm">
          <thead>
            <tr className="bg-gray-700/50">
              {DAYS.map((day) => (
                <th
                  key={day}
                  className={`border border-gray-700 px-4 py-3 text-center font-semibold ${
                    day === today ? "bg-indigo-600 text-white" : "text-gray-300"
                  }`}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr>
              {DAYS.map((day) => (
                <td
                  key={day}
                  className={`border border-gray-700 px-3 py-3 align-top ${
                    day === today ? "bg-indigo-900/20" : "bg-gray-800/50"
                  }`}
                >
                  <div className="space-y-2">
                    {courses
                      .filter((course) => course.schedule && course.schedule[day] > 0)
                      .map((course) => {
                        const isMarked = course.attendanceLog?.[todayDateKey];

                        return (
                          <div
                            key={course.id}
                            onClick={() => toggleAttendance(course, day)}
                            className={`rounded-lg px-3 py-2 transition-all ${
                              day !== today
                                ? "bg-gray-700/50 opacity-60 cursor-not-allowed"
                                : isMarked
                                ? "bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-lg shadow-emerald-900/50"
                                : "bg-gray-700 hover:bg-gray-600 cursor-pointer hover:shadow-lg"
                            }`}
                          >
                            <div className="font-medium text-white text-sm">{course.name}</div>
                            <div className="text-xs text-gray-300 mt-0.5">
                              {course.schedule?.[day]} hrs
                            </div>
                            {day === today && isMarked && (
                              <div className="flex items-center gap-1 mt-1">
                                <svg className="w-3 h-3 text-emerald-200" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs text-emerald-200">Attended</span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                    {courses.filter((course) => course.schedule && course.schedule[day] > 0).length === 0 && (
                      <div className="text-center py-4">
                        <span className="text-gray-600 text-sm">No classes</span>
                      </div>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
