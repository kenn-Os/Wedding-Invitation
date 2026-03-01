'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Eye, EyeOff, Lock } from 'lucide-react';
import { WEDDING_DATA } from '@/lib/constants';

const DASHBOARD_PASSWORD = 'mildymylove';

export default function Navbar({ variant = 'transparent' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = pathname === '/';

  const navBg = isHome
    ? scrolled
      ? 'bg-ivory/95 backdrop-blur-md shadow-sm border-b border-blush/20'
      : 'bg-transparent'
    : 'bg-ivory/95 backdrop-blur-md shadow-sm border-b border-blush/20';

  const textColor = isHome && !scrolled ? 'text-white' : 'text-deeprose';
  const logoColor = isHome && !scrolled ? 'text-white' : 'text-deeprose';
  const borderColor = isHome && !scrolled ? 'border-white/40' : 'border-blush/40';

  const handleDashboardClick = () => {
    // Check if already authenticated
    if (sessionStorage.getItem('weddingDashboardAuth') === 'true') {
      router.push('/dashboard');
    } else {
      setShowPasswordModal(true);
    }
    setIsOpen(false);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === DASHBOARD_PASSWORD) {
      sessionStorage.setItem('weddingDashboardAuth', 'true');
      setShowPasswordModal(false);
      setPassword('');
      setError('');
      router.push('/dashboard');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Our Story', href: '/#story' },
    { label: 'Details', href: '/#details' },
    // { label: 'Gallery', href: '/#gallery' },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}>
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo / Names */}
            <Link href="/" className={`font-script text-2xl md:text-3xl tracking-wide ${logoColor} transition-colors duration-300`}>
              {WEDDING_DATA.couple.initials}
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-sans text-xs tracking-widest uppercase font-medium hover:opacity-70 transition-opacity duration-200 ${textColor}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Dashboard Button + Hamburger */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleDashboardClick}
                className={`hidden md:flex items-center gap-2 border px-4 py-2 font-sans text-xs tracking-widest uppercase font-medium hover:opacity-70 transition-all duration-200 ${textColor} ${borderColor}`}
              >
                <Lock size={12} />
                Dashboard
              </button>

              {/* Hamburger */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`${textColor} md:hidden p-1 focus:outline-none`}
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          } bg-ivory/98 backdrop-blur-md border-b border-blush/20`}
        >
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="font-sans text-xs tracking-widest uppercase font-medium text-deeprose hover:text-champagne transition-colors duration-200 py-2 border-b border-blush/20"
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleDashboardClick}
              className="flex items-center gap-2 font-sans text-xs tracking-widest uppercase font-medium text-deeprose hover:text-champagne transition-colors duration-200 py-2"
            >
              <Lock size={12} />
              Host Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
            onClick={() => { setShowPasswordModal(false); setError(''); setPassword(''); }}
          />
          <div className="relative bg-ivory w-full max-w-md p-10 border border-blush/40 shadow-2xl animate-fade-up">
            {/* Close */}
            <button
              onClick={() => { setShowPasswordModal(false); setError(''); setPassword(''); }}
              className="absolute top-4 right-4 text-warmgray hover:text-deeprose transition-colors"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-8">
              <p className="font-script text-4xl text-champagne mb-2">Host Access</p>
              <p className="font-display text-lg text-deeprose font-light italic">Enter your dashboard password</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Password"
                  className="wedding-input pr-12"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warmgray hover:text-deeprose transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && (
                <p className="text-rose text-xs font-sans tracking-wide text-center">{error}</p>
              )}

              <button type="submit" className="btn-primary w-full mt-2">
                Enter Dashboard
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
