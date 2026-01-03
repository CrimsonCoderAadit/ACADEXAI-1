"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import InitAttendanceForm from "@/components/attendance/InitAttendanceForm";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

type ClassBlock = {
  subject: string;
  startTime: string;
  endTime: string;
};

type Course = {
  id: string;
  name: string;
  schedule: Record<string, ClassBlock[] | number>; // Support both old and new format
  minAttendance: number;
  attendedClasses: number;
  totalClasses: number;
};

// Helper to format time to 12-hour format
function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export default function ClassesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "users", user.uid, "courses"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coursesData: Course[] = [];
      snapshot.forEach((doc) => {
        coursesData.push({ id: doc.id, ...doc.data() } as Course);
      });
      setCourses(coursesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDeleteAllCourses = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete the entire weekly timetable? This will remove all courses and their attendance data. This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      // Get all courses
      const coursesSnapshot = await getDocs(collection(db, "users", user.uid, "courses"));

      // Delete all courses using batch
      const batch = writeBatch(db);
      coursesSnapshot.forEach((courseDoc) => {
        batch.delete(doc(db, "users", user.uid, "courses", courseDoc.id));
      });

      await batch.commit();

      // Local state will be updated automatically via onSnapshot
    } catch (error) {
      console.error("Error deleting courses:", error);
      alert("Failed to delete courses. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold">Classes</h1>
            </div>

            {courses.length > 0 && (
              <button
                onClick={handleDeleteAllCourses}
                disabled={deleting}
                className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 hover:border-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deleting ? "Deleting..." : "Delete Timetable"}
              </button>
            )}
          </div>
          <p className="text-gray-400 text-sm ml-15">Manage your class schedule and timetable</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Course Creation Form */}
          <div className="bg-gray-900 border border-green-500/20 rounded-xl p-6 h-fit shadow-lg shadow-green-900/20 neon-glow-green">
            <InitAttendanceForm />
          </div>

          {/* Right Column: View-Only Timetable */}
          <div className="bg-gray-900 border border-purple-500/20 rounded-xl p-6 shadow-lg shadow-purple-900/20 neon-glow-purple">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white">Weekly Timetable</h2>
            </div>

            {courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">No classes added yet</p>
                <p className="text-xs text-gray-600 mt-1">Add your first course to see the timetable</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Timetable Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {DAYS.map((day) => (
                    <div key={day} className="text-center">
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 mb-2">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">{day}</h3>
                      </div>

                      <div className="space-y-2">
                        {courses.map((course) => {
                          const daySchedule = course.schedule[day];

                          // Handle both old (number) and new (array) formats
                          if (Array.isArray(daySchedule)) {
                            // New format: array of class blocks
                            return daySchedule.map((block, idx) => (
                              <div
                                key={`${course.id}-${idx}`}
                                className="bg-gray-800 border border-gray-700 rounded-lg p-2 hover:border-blue-500/50 transition-colors"
                              >
                                <p className="text-xs font-semibold text-white truncate" title={block.subject}>
                                  {block.subject}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {formatTime(block.startTime)}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {formatTime(block.endTime)}
                                </p>
                              </div>
                            ));
                          } else if (typeof daySchedule === 'number' && daySchedule > 0) {
                            // Old format: number of hours (backward compatibility)
                            return (
                              <div
                                key={course.id}
                                className="bg-gray-800 border border-gray-700 rounded-lg p-2 hover:border-blue-500/50 transition-colors"
                              >
                                <p className="text-xs font-semibold text-white truncate" title={course.name}>
                                  {course.name}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {daySchedule} {daySchedule === 1 ? "hr" : "hrs"}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }).filter(Boolean)}

                        {!courses.some((c) => {
                          const daySchedule = c.schedule[day];
                          return Array.isArray(daySchedule) ? daySchedule.length > 0 : daySchedule > 0;
                        }) && (
                          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-2 h-16 flex items-center justify-center">
                            <p className="text-[10px] text-gray-600">Free</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Course Legend */}
                <div className="mt-6 pt-4 border-t border-gray-800">
                  <p className="text-xs font-semibold text-gray-400 mb-3">All Courses</p>
                  <div className="grid grid-cols-1 gap-2">
                    {courses.map((course) => {
                      // Calculate total hours from schedule
                      let totalWeeklyHours = 0;
                      Object.values(course.schedule).forEach((daySchedule) => {
                        if (Array.isArray(daySchedule)) {
                          daySchedule.forEach((block) => {
                            const [startHour, startMin] = block.startTime.split(':').map(Number);
                            const [endHour, endMin] = block.endTime.split(':').map(Number);
                            totalWeeklyHours += (endHour + endMin / 60) - (startHour + startMin / 60);
                          });
                        } else if (typeof daySchedule === 'number') {
                          totalWeeklyHours += daySchedule;
                        }
                      });

                      return (
                        <div
                          key={course.id}
                          className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">{course.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {totalWeeklyHours.toFixed(1)} hrs/week • Min: {course.minAttendance}%
                            </p>
                          </div>

                          <div className="flex gap-1">
                            {DAYS.map((day) => {
                              const daySchedule = course.schedule[day];
                              const hasClasses = Array.isArray(daySchedule)
                                ? daySchedule.length > 0
                                : (daySchedule || 0) > 0;

                              return (
                                <div
                                  key={day}
                                  className={`w-2 h-8 rounded-full ${
                                    hasClasses ? "bg-blue-500" : "bg-gray-700"
                                  }`}
                                  title={`${day}: ${
                                    Array.isArray(daySchedule)
                                      ? `${daySchedule.length} class${daySchedule.length !== 1 ? 'es' : ''}`
                                      : `${daySchedule || 0} hrs`
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
