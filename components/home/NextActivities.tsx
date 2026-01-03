"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type TimeBlock = {
  task: string;
  start: string;
  end: string;
  day: string;
  isClass?: boolean;
};

// Format time to 12-hour with AM/PM
function formatTime(time: string): string {
  if (!time) return '';
  const match = time.match(/(\d{1,2}):?(\d{2})?/);
  if (!match) return time;

  let hours = parseInt(match[1]);
  const minutes = match[2] || '00';
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${period}`;
}

// Get current day and time
function getCurrentDateTime() {
  const now = new Date();
  const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = dayMap[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

  return { currentDay, currentTime, dayIndex: now.getDay() };
}

// Convert time string to minutes
function timeToMinutes(time: string): number {
  const match = time.match(/(\d{1,2}):?(\d{2})?/);
  if (!match) return 0;
  return parseInt(match[1]) * 60 + parseInt(match[2] || '0');
}

export default function NextActivities() {
  const { user } = useAuth();
  const [upcomingActivities, setUpcomingActivities] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadUpcomingActivities = async () => {
      try {
        const ref = doc(db, "users", user.uid, "schedule", "weekly");
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setUpcomingActivities([]);
          setLoading(false);
          return;
        }

        const schedule = snap.data();
        const { currentDay, currentTime, dayIndex } = getCurrentDateTime();
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const allActivities: (TimeBlock & { dayIndex: number; startMinutes: number })[] = [];

        // Collect all activities from all days
        Object.entries(schedule.days || {}).forEach(([day, blocks]: [string, any]) => {
          const dayIdx = daysOfWeek.indexOf(day);
          if (dayIdx === -1) return;

          (blocks || []).forEach((block: any) => {
            const startMinutes = timeToMinutes(block.start);
            const endMinutes = timeToMinutes(block.end);

            // Only include future activities
            const isFuture = dayIdx > dayIndex || (dayIdx === dayIndex && startMinutes > currentTime);

            if (isFuture) {
              allActivities.push({
                task: block.task,
                start: block.start,
                end: block.end,
                day,
                isClass: block.isClass,
                dayIndex: dayIdx,
                startMinutes,
              });
            }
          });
        });

        // Sort by day, then by time
        allActivities.sort((a, b) => {
          if (a.dayIndex !== b.dayIndex) {
            return a.dayIndex - b.dayIndex;
          }
          return a.startMinutes - b.startMinutes;
        });

        // Take only next 5
        const next5 = allActivities.slice(0, 5).map(({ dayIndex, startMinutes, ...rest }) => rest);
        setUpcomingActivities(next5);

      } catch (error) {
        console.error("Error loading upcoming activities:", error);
        setUpcomingActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadUpcomingActivities();

    // Refresh every minute to keep activities current
    const interval = setInterval(loadUpcomingActivities, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Next Activities</h2>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        {upcomingActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No upcoming activities scheduled.</p>
          </div>
        ) : (
          upcomingActivities.map((activity, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                activity.isClass
                  ? 'border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20'
                  : 'border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  activity.isClass ? 'bg-purple-500/20' : 'bg-blue-500/20'
                }`}>
                  {activity.isClass ? (
                    <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm mb-1 truncate">
                    {activity.task}
                    {activity.isClass && <span className="ml-1.5 text-xs text-purple-300">(Class)</span>}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-medium text-gray-300">{activity.day.slice(0, 3)}</span>
                    <span>•</span>
                    <span>{formatTime(activity.start)} – {formatTime(activity.end)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-track-gray-800::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 10px;
        }
        .scrollbar-thumb-gray-700::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 10px;
        }
        .scrollbar-thumb-gray-700::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
}
