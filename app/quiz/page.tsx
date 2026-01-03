"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/src/lib/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import Link from "next/link";

type Animal = "lion" | "bear" | "wolf" | "dolphin";

/* ---------- QUESTIONS & RESULTS (unchanged) ---------- */

const questions = [
  {
    question: "When are you most alert?",
    options: [
      { text: "Morning", animal: "lion" },
      { text: "Afternoon", animal: "bear" },
      { text: "Night", animal: "wolf" },
      { text: "Irregular", animal: "dolphin" },
    ],
  },
  {
    question: "If you had no alarm, when would you wake up?",
    options: [
      { text: "Before 6 AM", animal: "lion" },
      { text: "6–8 AM", animal: "bear" },
      { text: "After 9 AM", animal: "wolf" },
      { text: "My wake time is irregular", animal: "dolphin" },
    ],
  },
  {
    question: "When do you feel an energy crash?",
    options: [
      { text: "Late afternoon", animal: "lion" },
      { text: "After lunch", animal: "bear" },
      { text: "Early evening", animal: "wolf" },
      { text: "At unpredictable times", animal: "dolphin" },
    ],
  },
  {
    question: "When do you prefer studying?",
    options: [
      { text: "Early morning", animal: "lion" },
      { text: "Midday", animal: "bear" },
      { text: "Late night", animal: "wolf" },
      { text: "Short sessions", animal: "dolphin" },
    ],
  },
  {
    question: "How do mornings feel to you?",
    options: [
      { text: "Energizing", animal: "lion" },
      { text: "Okay", animal: "bear" },
      { text: "Terrible", animal: "wolf" },
      { text: "Stressful", animal: "dolphin" },
    ],
  },
];

const results: Record<Animal, { animal: string; time: string }> = {
  lion: { animal: "🦁 Lion", time: "5 AM – 9 AM" },
  bear: { animal: "🐻 Bear", time: "10 AM – 2 PM" },
  wolf: { animal: "🐺 Wolf", time: "7 PM – 11 PM" },
  dolphin: { animal: "🐬 Dolphin", time: "Flexible short sessions" },
};

export default function QuizPage() {
  const [current, setCurrent] = useState(0);
  const [scores, setScores] = useState<Record<Animal, number>>({
    lion: 0,
    bear: 0,
    wolf: 0,
    dolphin: 0,
  });
  const [result, setResult] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);

  // Check if user has completed quiz before
  useEffect(() => {
    const checkExistingResult = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        setShowQuiz(true);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const data = userDoc.data();

        if (data?.chronotype) {
          // User has completed quiz - show results
          setResult(data.chronotype as Animal);
          setShowQuiz(false);
        } else {
          // No quiz completed - show quiz
          setShowQuiz(true);
        }
      } catch (error) {
        console.error("Error fetching quiz result:", error);
        setShowQuiz(true);
      } finally {
        setLoading(false);
      }
    };

    checkExistingResult();
  }, []);

  const resetQuiz = () => {
    setCurrent(0);
    setScores({ lion: 0, bear: 0, wolf: 0, dolphin: 0 });
    setResult(null);
  };

  const startNewQuiz = () => {
    resetQuiz();
    setShowQuiz(true);
  };

  const handleAnswer = async (animal: Animal) => {
    const updated = { ...scores, [animal]: scores[animal] + 1 };
    setScores(updated);

    if (current < questions.length - 1) {
      setCurrent(current + 1);
      return;
    }

    // Last question answered - calculate result
    const final = Object.keys(updated).reduce((a, b) =>
      updated[a as Animal] > updated[b as Animal] ? a : b
    ) as Animal;

    // Set result and hide quiz to show results screen
    setResult(final);
    setShowQuiz(false);

    const user = auth.currentUser;
    if (!user) return;

    // Save to Firestore
    await setDoc(
      doc(db, "users", user.uid),
      {
        chronotype: final,
        animal: results[final].animal,
        bestStudyTime: results[final].time,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="max-w-2xl w-full">
        {result && !showQuiz ? (
          /* RESULT SCREEN */
          <div className="bg-gray-900 rounded-2xl border border-green-500/20 p-8 sm:p-12 shadow-xl text-center shadow-green-900/20 neon-glow-green">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">Your Chronotype</h1>
            
            {/* Animal Result */}
            <div className="my-8 p-6 bg-gray-800 border border-gray-700 rounded-xl">
              <h2 className="text-5xl mb-3">{results[result].animal}</h2>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">
                  Best study time: <span className="font-semibold text-white">{results[result].time}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-900/60 flex items-center justify-center gap-2 btn-glow"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Go to Home</span>
              </Link>

              <Link
                href="/assistant"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg shadow-purple-900/50 hover:shadow-xl hover:shadow-purple-900/60 flex items-center justify-center gap-2 btn-glow"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>AI Assistant</span>
              </Link>

              <button
                onClick={startNewQuiz}
                className="w-full bg-gray-800 border border-gray-700 text-white py-3 rounded-xl font-medium hover:bg-gray-750 hover:border-gray-600 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Take Quiz Again</span>
              </button>
            </div>
          </div>
        ) : (
          /* QUIZ SCREEN */
          <div className="bg-gray-900 rounded-2xl border border-purple-500/20 shadow-xl overflow-hidden shadow-purple-900/20 neon-glow-purple">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white">Chronotype Quiz</h1>
              </div>
              <p className="text-blue-100">Discover your ideal study time</p>
            </div>

            {/* Progress Bar */}
            <div className="px-8 pt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-400">
                  Question {current + 1} of {questions.length}
                </span>
                <span className="text-sm font-medium text-gray-400">
                  {Math.round(((current + 1) / questions.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
                  style={{ width: `${((current + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                {questions[current].question}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {questions[current].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt.animal as Animal)}
                    className="w-full bg-gray-800 border-2 border-gray-700 text-white py-4 px-6 rounded-xl hover:bg-gray-750 hover:border-blue-500 transition-all duration-200 text-left font-medium hover:scale-[1.02] hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt.text}</span>
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}