"use client";

import { useRouter } from "next/navigation";

export default function HelpPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-10 pb-28">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Help & Guide
          </h1>
          <p className="text-gray-400 mt-2">
            Learn how to use ACADEXAI effectively
          </p>
        </div>

        {/* What is ACADEXAI */}
        <section className="bg-gray-900 border border-blue-500/20 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-3">What is ACADEXAI?</h2>
          <p className="text-gray-300 leading-relaxed">
            ACADEXAI is an intelligent academic companion that helps you manage
            classes, attendance, schedules, and decision-making using AI.
            Everything is designed to be automated, accurate, and stress-free.
          </p>
        </section>

        {/* Classes */}
        <section className="bg-gray-900 border border-green-500/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">📚 Classes</h2>
          <ul className="text-gray-300 space-y-2 list-disc ml-5">
            <li>Add your courses with exact days and timings</li>
            <li>Classes are treated as <b>immutable blocks</b></li>
            <li>You can delete the entire timetable if you make a mistake</li>
            <li>Class timings are used across attendance and AI scheduling</li>
          </ul>
        </section>

        {/* Attendance */}
        <section className="bg-gray-900 border border-purple-500/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">📊 Attendance</h2>
          <ul className="text-gray-300 space-y-2 list-disc ml-5">
            <li>Mark attendance only for <b>today’s classes</b></li>
            <li>Attendance is tracked per date automatically</li>
            <li>Used by the Bunk AI to calculate safe skips</li>
            <li>No manual percentage calculations needed</li>
          </ul>
        </section>

        {/* Quiz */}
        <section className="bg-gray-900 border border-yellow-500/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">🧠 Chronotype Quiz</h2>
          <ul className="text-gray-300 space-y-2 list-disc ml-5">
            <li>Determines your chronotype (Lion, Bear, Wolf, Dolphin)</li>
            <li>Used by the AI to schedule tasks at optimal times</li>
            <li>Quiz results are saved automatically</li>
            <li>You can view results anytime from the Quiz page</li>
          </ul>
        </section>

        {/* AI Assistant */}
        <section className="bg-gray-900 border border-cyan-500/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">🤖 AI Assistant</h2>
          <ul className="text-gray-300 space-y-2 list-disc ml-5">
            <li>Chat naturally: greetings, questions, advice</li>
            <li>Ask it to add tasks to your weekly schedule</li>
            <li>It respects class timings and priorities</li>
            <li>High-priority tasks cannot be overridden silently</li>
          </ul>
        </section>

        {/* Bunk AI */}
        <section className="bg-gray-900 border border-red-500/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">🚫 Bunk AI</h2>
          <ul className="text-gray-300 space-y-2 list-disc ml-5">
            <li>Ask: <i>“Can I bunk the next Maths class?”</i></li>
            <li>Calculates attendance using real data</li>
            <li>Uses the 75% rule strictly</li>
            <li>Never guesses — math is done server-side</li>
          </ul>
        </section>

        {/* Tips */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">💡 Tips</h2>
          <ul className="text-gray-300 space-y-2 list-disc ml-5">
            <li>Set your timetable accurately for best AI results</li>
            <li>Use the AI for planning, not just chatting</li>
            <li>Delete and rebuild schedules freely while testing</li>
          </ul>
        </section>

        {/* Back Home Button */}
        <div className="pt-6 flex justify-center">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold shadow-lg transition-all"
          >
            ⬅ Go back Home
          </button>
        </div>

      </div>
    </div>
  );
}
