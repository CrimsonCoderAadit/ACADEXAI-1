"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/src/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

type ChronotypeData = {
  animal: string;
  time: string;
};

const CHRONOTYPE_MAP: Record<string, ChronotypeData> = {
  lion: { animal: "🦁 Early Bird", time: "5 AM – 9 AM" },
  bear: { animal: "🐻 Midday Peak", time: "10 AM – 2 PM" },
  wolf: { animal: "🐺 Night Owl", time: "7 PM – 11 PM" },
  dolphin: { animal: "🐬 Flexible Learner", time: "Short sessions throughout the day" },
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AcademicSnapshot() {
  const { user } = useAuth();
  const [chronotype, setChronotype] = useState<ChronotypeData | null>(null);
  const [attendanceData, setAttendanceData] = useState<{
    percentage: number;
    isLow: boolean;
  } | null>(null);
  const [nextClass, setNextClass] = useState<{
    name: string;
    day: string;
    time: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // 1. Fetch chronotype
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        if (userData?.chronotype) {
          setChronotype(CHRONOTYPE_MAP[userData.chronotype as string] || null);
        }

        // 2. Fetch attendance data
        const coursesSnapshot = await getDocs(
          collection(db, "users", user.uid, "courses")
        );

        if (!coursesSnapshot.empty) {
          let totalAttended = 0;
          let totalClasses = 0;

          coursesSnapshot.forEach((doc) => {
            const data = doc.data();
            totalAttended += data.attendedClasses || 0;
            totalClasses += data.totalClasses || 0;
          });

          if (totalClasses > 0) {
            const percentage = (totalAttended / totalClasses) * 100;
            setAttendanceData({
              percentage,
              isLow: percentage <= 78 && percentage >= 75,
            });
          }
        }

        // 3. Find next upcoming class
        const now = new Date();
        const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1]; // Map Sunday=0 to index 6
        const currentHour = now.getHours();

        let closestClass: { name: string; day: string; time: string } | null = null;
        let minTimeDiff = Infinity;

        coursesSnapshot.forEach((doc) => {
          const courseData = doc.data();
          const schedule = courseData.schedule || {};

          Object.entries(schedule).forEach(([day, classCount]) => {
            if ((classCount as number) > 0) {
              const dayIndex = DAYS.indexOf(day);
              const currentDayIndex = DAYS.indexOf(currentDay);

              // Simple heuristic: find next day with classes
              let dayDiff = dayIndex - currentDayIndex;
              if (dayDiff < 0) dayDiff += 7; // Wrap to next week

              if (dayDiff < minTimeDiff) {
                minTimeDiff = dayDiff;
                closestClass = {
                  name: courseData.name,
                  day: day,
                  time: dayDiff === 0 ? "Today" : day,
                };
              }
            }
          });
        });

        setNextClass(closestClass);
      } catch (error) {
        console.error("Error fetching academic snapshot data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl shadow-xl p-8 neon-glow-cyan">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 border border-cyan-500/30 rounded-2xl shadow-2xl p-8 neon-glow-cyan">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
          <svg
            className="w-6 h-6 text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white">Today's Academic Snapshot</h2>
      </div>

      <div className="space-y-6">
        {/* Chronotype Insight */}
        {chronotype ? (
          <div className="bg-gray-800/50 border border-cyan-500/20 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{chronotype.animal.split(" ")[0]}</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-cyan-300 mb-1">
                  Your Learning Style
                </h3>
                <p className="text-white text-xl font-medium mb-2">
                  {chronotype.animal.split(" ").slice(1).join(" ")}
                </p>
                <p className="text-cyan-400 text-sm">
                  Peak Productivity: <span className="font-semibold">{chronotype.time}</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <p className="text-gray-400 text-sm">
              Complete the Brain Quiz to discover your optimal learning hours
            </p>
          </div>
        )}

        {/* Attendance Overview */}
        {attendanceData ? (
          <div className="bg-gray-800/50 border border-cyan-500/20 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-cyan-300 mb-3">
              Overall Attendance
            </h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-white">
                {attendanceData.percentage.toFixed(1)}%
              </span>
            </div>
            {attendanceData.isLow && (
              <div className="mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <svg
                  className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-amber-400 text-sm">
                  You're close to the 75% threshold. Avoid bunking classes.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              Overall Attendance
            </h3>
            <p className="text-gray-500 text-sm">
              No attendance data available. Add courses to track your attendance.
            </p>
          </div>
        )}

        {/* Next Class Info */}
        {nextClass ? (
          <div className="bg-gray-800/50 border border-cyan-500/20 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-cyan-300 mb-3">Next Class</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-xl font-medium">{nextClass.name}</p>
                <p className="text-cyan-400 text-sm mt-1">{nextClass.time}</p>
              </div>
              <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Next Class</h3>
            <p className="text-gray-500 text-sm">
              No upcoming classes scheduled. Enjoy your free time!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
