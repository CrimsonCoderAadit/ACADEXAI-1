'use client';

import WeeklySchedule from "@/components/WeeklySchedule";
import { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

function normalizeSchedule(schedule: any) {
  if (!schedule?.days) return schedule;

  const fixedDays: any = {};

  for (const day of Object.keys(schedule.days)) {
    fixedDays[day] = schedule.days[day].map((block: any) => ({
      task: block.task ?? block.title ?? block.name ?? "Untitled task",
      start: block.start ?? "",
      end: block.end ?? "",
      priority: block.priority ?? "medium",
      isClass: block.isClass ?? false, // Preserve isClass property
      completed: block.completed ?? false, // Preserve completed status
    }));

  }

  return {
    ...schedule,
    days: fixedDays,
  };
}


export default function AssistantPage() {
  const { user, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<any | null>(null);
  const [pendingSchedule, setPendingSchedule] = useState<any | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState(false);

  // ✅ ALWAYS call hooks first
  useEffect(() => {
    if (!user) return;

    const loadSchedule = async () => {
      const ref = doc(db, "users", user.uid, "schedule", "weekly");
      const snap = await getDoc(ref);

      let userSchedule;
      if (snap.exists()) {
        userSchedule = normalizeSchedule(snap.data());
      } else {
        userSchedule = {
          weekStart: new Date().toISOString().slice(0, 10),
          timezone: "Asia/Kolkata",
          days: {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
            Sunday: [],
          },
        };

        await setDoc(ref, userSchedule);
      }

      // Set schedule without merging classes initially
      // Classes will be merged only after AI generates the schedule
      setSchedule(userSchedule);
    };

    loadSchedule();
  }, [user]);

  // Merge class schedule with user schedule
  const mergeClassSchedule = async (userSchedule: any) => {
    if (!user) return userSchedule;

    try {
      const coursesRef = collection(db, "users", user.uid, "courses");
      const coursesSnap = await getDocs(coursesRef);

      const classTasks: any = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
      };

      const dayMap: Record<string, string> = {
        Mon: "Monday",
        Tue: "Tuesday",
        Wed: "Wednesday",
        Thu: "Thursday",
        Fri: "Friday",
      };

      coursesSnap.forEach((doc) => {
        const course = doc.data();
        const schedule = course.schedule || {};

        Object.entries(schedule).forEach(([day, daySchedule]) => {
          const fullDay = dayMap[day];
          if (!fullDay) return;

          if (Array.isArray(daySchedule)) {
            // New format: array of class blocks
            daySchedule.forEach((block: any) => {
              classTasks[fullDay].push({
                task: block.subject || course.name,
                start: block.startTime,
                end: block.endTime,
                priority: "high", // Classes are high priority
                isClass: true, // Mark as class
              });
            });
          } else if (typeof daySchedule === 'number' && daySchedule > 0) {
            // Old format: number of hours (backward compat - assign a default time)
            classTasks[fullDay].push({
              task: `${course.name} (${daySchedule}h)`,
              start: "09:00",
              end: `${9 + daySchedule}:00`,
              priority: "high",
              isClass: true,
            });
          }
        });
      });

      // Merge class tasks with user schedule
      const merged = { ...userSchedule };
      Object.keys(merged.days).forEach((day) => {
        merged.days[day] = [
          ...classTasks[day], // Classes first (high priority)
          ...(userSchedule.days[day] || []), // Then user tasks
        ];
      });

      return merged;
    } catch (error) {
      console.error("Error loading class schedule:", error);
      return userSchedule;
    }
  };

  // Delete weekly schedule (removes all tasks including classes from view)
  const handleDeleteSchedule = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your weekly schedule? This will remove all scheduled tasks from view. Classes will reappear when you generate a new schedule. This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeletingSchedule(true);

      // Reset schedule to empty (keeping the structure)
      const emptySchedule = {
        weekStart: new Date().toISOString().slice(0, 10),
        timezone: "Asia/Kolkata",
        days: {
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: [],
          Sunday: [],
        },
      };

      const ref = doc(db, "users", user.uid, "schedule", "weekly");
      await setDoc(ref, emptySchedule);

      // Set empty schedule (classes will be merged when AI generates new schedule)
      setSchedule(emptySchedule);

    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("Failed to delete schedule. Please try again.");
    } finally {
      setDeletingSchedule(false);
    }
  };

  // Toggle task completion
  const handleToggleComplete = async (day: string, blockIndex: number) => {
    if (!user || !schedule) return;

    try {
      const updatedSchedule = { ...schedule };
      const block = updatedSchedule.days[day][blockIndex];

      // Don't allow toggling classes
      if (block.isClass) return;

      // Toggle completion status
      block.completed = !block.completed;

      // Update local state
      setSchedule(updatedSchedule);

      // Save to Firebase (only save user tasks, not merged class data)
      const userSchedule = { ...updatedSchedule };
      // Remove class blocks before saving
      Object.keys(userSchedule.days).forEach((dayKey) => {
        userSchedule.days[dayKey] = userSchedule.days[dayKey].filter((b: any) => !b.isClass);
      });

      const ref = doc(db, "users", user.uid, "schedule", "weekly");
      await setDoc(ref, userSchedule);

    } catch (error) {
      console.error("Error toggling completion:", error);
    }
  };

  // ---------- AUTH GUARDS (AFTER HOOKS) ----------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
          <p className="text-gray-300 text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Sign in required</h1>
          <p className="text-gray-400">
            Please log in to use the AI assistant.
          </p>
        </div>
      </div>
    );
  }

  // ---------- SEND MESSAGE ----------
  const sendMessage = async () => {
    if (!input.trim() ) return;

    if (pendingSchedule) {
      const answer = input.toLowerCase().trim();
      setInput("");

      if (answer === "yes") {
        const normalizedSchedule = normalizeSchedule(pendingSchedule);

        // Merge with classes before setting
        const mergedSchedule = await mergeClassSchedule(normalizedSchedule);
        setSchedule(mergedSchedule);

        await setDoc(
          doc(db, "users", user.uid, "schedule", "weekly"),
          normalizedSchedule,
          { merge: true }
        );

        setPendingSchedule(null);

        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "✅ Schedule updated" },
        ]);
        return;
      }

      if (answer === "no") {
        setPendingSchedule(null);
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "❌ Change cancelled" },
        ]);
        return;
      }

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Please type **yes** or **no**.",
        },
      ]);
      return;
    }

    if (!schedule) return;


    const userText = input;
    setInput('');
    setLoading(true);

    const updatedMessages: Message[] = [
      ...messages,
      { role: 'user', content: userText },
    ];

    setMessages(updatedMessages);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
         },
        body: JSON.stringify({
          message: userText,
          messages: updatedMessages,
          currentSchedule: schedule,
          userId: user.uid,
        }),
      });

      const data = await res.json();

      if (data.type === "chat") {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.reply },
        ]);
      }

      if (data.type === "schedule") {
        const rawSchedule = JSON.parse(data.reply);
        const normalizedSchedule = normalizeSchedule(rawSchedule);

        // Merge with classes before setting
        const mergedSchedule = await mergeClassSchedule(normalizedSchedule);
        setSchedule(mergedSchedule);

        await setDoc(
          doc(db, "users", user.uid, "schedule", "weekly"),
          normalizedSchedule,
          { merge: true }
        );

        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: "✅ Schedule updated" },
        ]);
      }

      if (data.type === "confirmation") {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ This change affects a high-priority task.\nType **yes** to confirm or **no** to cancel.",
          },
        ]);

        setPendingSchedule(data.pendingSchedule);
        return;
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-8">
      
      <div className="max-w-6xl mx-auto space-y-6 flex flex-col">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-2xl border border-gray-800 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white">AI Assistant</h1>
          </div>
          <p className="text-gray-400 text-lg ml-15">
            Chat with AI to plan your schedule and get things done.
          </p>
        </div>

        {/* Chat Container */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
          {/* Messages Area */}
          <div className="h-[500px] overflow-y-auto p-6">
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 8px;
              }
              div::-webkit-scrollbar-track {
                background: #1f2937;
                border-radius: 10px;
              }
              div::-webkit-scrollbar-thumb {
                background: #4b5563;
                border-radius: 10px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: #6b7280;
              }
            `}</style>

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-lg">Start chatting or planning…</p>
                <p className="text-gray-600 text-sm mt-2">Ask me to create schedules, plan your day, or just chat!</p>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  )}
                  
                  <div
                    className={`inline-block max-w-[80%] px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/50'
                        : 'bg-gray-800 border border-gray-700 text-gray-100'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-800 p-4 bg-gray-900/50">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Say hi or change your schedule…"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-900/60 flex items-center gap-2"
              >
                <span>Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Display */}
        {schedule && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 sm:p-8 shadow-xl">
            <WeeklySchedule schedule={schedule} onDelete={handleDeleteSchedule} deleting={deletingSchedule} onToggleComplete={handleToggleComplete} />
          </div>
        )}
      </div>
    </div>
  );
}