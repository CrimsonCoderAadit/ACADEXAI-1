'use client'
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';


export default function Navigation() {
  const { user, loading, loginWithGoogle, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/classes', label: 'Classes', icon: '📚' },
    { href: '/attendance', label: 'Attendance', icon: '📊' },
    { href: '/quiz', label: 'Quiz', icon: '🧠' },
    { href: '/assistant', label: 'AI Assistant', icon: '🤖' },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/welcome');
  };

  return (
    <nav className="bg-gray-900/95 border-b border-emerald-500/20 text-white sticky top-0 z-50 backdrop-blur-md neon-border-green">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center gap-8">
          {/* Brand with Neon Green Accent */}
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent hover:from-emerald-300 hover:to-blue-300 transition-all neon-text-green">
            ACADEX
          </Link>

          {/* Navigation Links */}
          <div className="flex gap-1 flex-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg neon-glow-green'
                      : 'text-gray-300 hover:text-emerald-300 hover:bg-gray-800 border border-transparent hover:border-emerald-500/30'
                  }`}
                >
                  <span className="text-sm">{link.icon}</span>
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Auth Button - ALWAYS VISIBLE */}
          {!loading && (
            user ? (
              <div className="flex items-center gap-4">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border-2 border-emerald-500/50 neon-glow-green"
                  />
                )}
                <button
                  onClick={handleLogout}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium transition-all duration-200 shadow-lg shadow-red-900/50 hover:shadow-red-500/50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium transition-all duration-200 neon-glow-green"
              >
                Login
              </button>
            )
          )}
        </div>
      </div>

      <style jsx>{`
        .neon-border-green {
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
        }

        .neon-text-green {
          filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.5));
        }

        .neon-glow-green {
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.4),
                      0 0 20px rgba(16, 185, 129, 0.2),
                      0 0 30px rgba(16, 185, 129, 0.1);
        }

        .neon-glow-green:hover {
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.6),
                      0 0 30px rgba(16, 185, 129, 0.3),
                      0 0 45px rgba(16, 185, 129, 0.15);
        }
      `}</style>
    </nav>
  );
}
