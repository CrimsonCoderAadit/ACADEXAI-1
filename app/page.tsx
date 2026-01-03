'use client'

import { useAuth } from '@/context/AuthContext'
import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/src/lib/firebase'
import NextActivities from '@/components/home/NextActivities'

export default function Home() {
  const { user, loading, quizCompleted } = useAuth()
  const [quizResult, setQuizResult] = useState<string | null>(null)
  const [quizLoading, setQuizLoading] = useState(true)

  // Fetch quiz result if exists
  useEffect(() => {
    async function fetchQuizResult() {
      if (!user) {
        setQuizLoading(false)
        return
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const data = userDoc.data()
        if (data?.chronotype) {
          setQuizResult(data.chronotype)
        }
      } catch (error) {
        console.error('Error fetching quiz result:', error)
      } finally {
        setQuizLoading(false)
      }
    }

    fetchQuizResult()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Get announcement message based on quiz status
  const getAnnouncementMessage = () => {
    if (quizLoading) {
      return {
        icon: '⏳',
        title: 'Loading...',
        text: 'Loading your profile...',
        showImage: false
      }
    }

    if (quizResult) {
      const chronotypeData: Record<string, { icon: string; title: string; text: string; emoji: string }> = {
        'Lion': {
          icon: '🦁',
          emoji: '🦁',
          title: 'Lion',
          text: 'Peak focus in the morning hours'
        },
        'Bear': {
          icon: '🐻',
          emoji: '🐻',
          title: 'Bear',
          text: 'Balanced energy throughout the day'
        },
        'Wolf': {
          icon: '🐺',
          emoji: '🐺',
          title: 'Wolf',
          text: 'Peak creativity in the evening hours'
        },
        'Dolphin': {
          icon: '🐬',
          emoji: '🐬',
          title: 'Dolphin',
          text: 'Light sleeper with creative bursts'
        },
      }

      const data = chronotypeData[quizResult] || {
        icon: '✨',
        emoji: '✨',
        title: quizResult,
        text: 'Your productivity profile'
      }

      return { ...data, showImage: true }
    }

    return {
      icon: '📊',
      emoji: '📊',
      title: 'No Profile Yet',
      text: 'Take the productivity quiz to discover your chronotype',
      hint: 'Navigate to the Quiz tab to get started',
      showImage: false
    }
  }

  const announcement = getAnnouncementMessage()

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-hidden relative">
      {/* Red Light Corner Accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

      {/* Red Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/20 to-transparent animate-scan"></div>
      </div>

      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(239, 68, 68, 0.15) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'gridPulse 4s ease-in-out infinite'
        }}></div>
      </div>

      <div className="container mx-auto px-6 py-12 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-red-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]">
            ACADEX - AI
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Your intelligent academic companion powered by AI
          </p>
        </div>

        {/* Main Content - Three Column Layout */}
        <div className="flex flex-col lg:flex-row items-start justify-center gap-8 max-w-7xl mx-auto">

          {/* LEFT: Next Activities Panel */}
          <div className="w-80 flex-shrink-0 order-2 lg:order-1">
            <div className="relative group">
              {/* Neon border glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 rounded-xl opacity-50 group-hover:opacity-75 blur transition duration-300"></div>

              {/* Card content */}
              <div className="relative bg-gray-900/90 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 shadow-2xl min-h-[384px]">
                <NextActivities />
              </div>
            </div>
          </div>

          {/* CENTER: Cyberpunk Neon Core - Hero Visual */}
          <div className="relative w-96 h-96 flex-shrink-0 order-1 lg:order-2">
            {/* Outer Rotating Ring - Red accent */}
            <div className="absolute inset-0 rounded-full border-4 border-red-500/30 animate-spin-slow">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-400 rounded-full shadow-neon-red"></div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-emerald-400 rounded-full shadow-neon-green"></div>
            </div>

            {/* Middle Rotating Ring - Counter Direction */}
            <div className="absolute inset-8 rounded-full border-4 border-cyan-500/30 animate-spin-reverse">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-neon-cyan"></div>
              <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-400 rounded-full shadow-neon-red"></div>
              <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-400 rounded-full shadow-neon-green"></div>
            </div>

            {/* Inner Core - Pulsing Orb with Red accent */}
            <div className="absolute inset-16 rounded-full bg-gradient-to-br from-red-500/20 via-emerald-500/20 to-cyan-500/20 backdrop-blur-sm border-2 border-red-400/40 animate-pulse-glow-red">
              {/* Neural Network Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <line x1="50" y1="20" x2="50" y2="80" stroke="url(#gradient1)" strokeWidth="0.5" opacity="0.6" />
                <line x1="20" y1="50" x2="80" y2="50" stroke="url(#gradient2)" strokeWidth="0.5" opacity="0.6" />
                <line x1="30" y1="30" x2="70" y2="70" stroke="url(#gradient3)" strokeWidth="0.5" opacity="0.6" />
                <line x1="70" y1="30" x2="30" y2="70" stroke="url(#gradient4)" strokeWidth="0.5" opacity="0.6" />

                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
                    <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                    <stop offset="50%" stopColor="#ef4444" stopOpacity="1" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="gradient4" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
                    <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center Node */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 via-emerald-400 to-cyan-400 shadow-neon-core animate-pulse-slow"></div>
              </div>
            </div>

            {/* Floating Particles - Multi-color Theme */}
            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-red-400 rounded-full animate-float-1 shadow-neon-red"></div>
            <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-float-2 shadow-neon-cyan"></div>
            <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-emerald-400 rounded-full animate-float-3 shadow-neon-green"></div>
            <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-red-300 rounded-full animate-float-4 shadow-neon-red"></div>
          </div>

          {/* RIGHT: Announcement Panel - Portrait Side Panel */}
          <div className="w-80 flex-shrink-0 order-3">
            <div className="relative group">
              {/* Neon border glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-purple-500 to-cyan-500 rounded-xl opacity-50 group-hover:opacity-75 blur transition duration-300 animate-pulse-slow"></div>

              {/* Card content */}
              <div className="relative bg-gray-900/90 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 shadow-2xl min-h-[384px] flex flex-col">
                <div className="flex flex-col items-center text-center gap-5">
                  {/* Animal Image/Icon with glow */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-red-500/20 to-cyan-500/30 rounded-full blur-xl opacity-60 animate-pulse-slow"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center border-2 border-purple-500/40 shadow-lg shadow-purple-900/50">
                      <span className="text-6xl animate-pulse-slow" style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.4))' }}>
                        {announcement.emoji || announcement.icon}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-purple-400 uppercase tracking-wider mb-1">
                        Productivity Profile
                      </h3>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {announcement.title || 'Status Update'}
                      </h2>
                    </div>

                    <p className="text-gray-300 leading-relaxed text-sm">
                      {announcement.text}
                    </p>

                    {announcement.hint && (
                      <div className="pt-2 border-t border-gray-700/50">
                        <p className="text-xs text-gray-500 italic">{announcement.hint}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-500 text-sm">
            Powered by AI to make your academic journey smoother
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes gridPulse {
          0%, 100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.2;
          }
        }

        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes pulse-glow-red {
          0%, 100% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.3),
                        0 0 40px rgba(16, 185, 129, 0.2),
                        inset 0 0 20px rgba(239, 68, 68, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.5),
                        0 0 60px rgba(16, 185, 129, 0.3),
                        inset 0 0 30px rgba(239, 68, 68, 0.2);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -30px); }
        }

        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-25px, 20px); }
        }

        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, 15px); }
        }

        @keyframes float-4 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, -25px); }
        }

        .animate-scan {
          animation: scan 8s linear infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 15s linear infinite;
        }

        .animate-pulse-glow-red {
          animation: pulse-glow-red 4s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-float-1 {
          animation: float-1 8s ease-in-out infinite;
        }

        .animate-float-2 {
          animation: float-2 10s ease-in-out infinite;
        }

        .animate-float-3 {
          animation: float-3 9s ease-in-out infinite;
        }

        .animate-float-4 {
          animation: float-4 11s ease-in-out infinite;
        }

        .shadow-neon-blue {
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.8),
                      0 0 20px rgba(59, 130, 246, 0.4);
        }

        .shadow-neon-green {
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.8),
                      0 0 20px rgba(16, 185, 129, 0.4),
                      0 0 30px rgba(16, 185, 129, 0.2);
        }

        .shadow-neon-cyan {
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.8),
                      0 0 20px rgba(6, 182, 212, 0.4);
        }

        .shadow-neon-red {
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.8),
                      0 0 20px rgba(239, 68, 68, 0.4),
                      0 0 30px rgba(239, 68, 68, 0.2);
        }

        .shadow-neon-core {
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.4),
                      0 0 40px rgba(16, 185, 129, 0.4),
                      0 0 60px rgba(6, 182, 212, 0.2);
        }
      `}</style>
    </main>
  );
}
