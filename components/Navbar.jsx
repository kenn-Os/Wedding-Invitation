"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Eye, EyeOff, Lock } from "lucide-react";
import { WEDDING_DATA } from "@/lib/constants";

const DASHBOARD_PASSWORD = "mildymylove";

export default function Navbar({ variant = "transparent" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = pathname === "/";

  const navBg = isHome
    ? scrolled
      ? "bg-ivory/95 backdrop-blur-md shadow-sm border-b border-blush/20"
      : "bg-transparent"
    : "bg-ivory/95 backdrop-blur-md shadow-sm border-b border-blush/20";

  const textColor = isHome && !scrolled ? "text-white" : "text-deeprose";
  const logoColor = isHome && !scrolled ? "text-white" : "text-deeprose";

  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalClick = () => setIsOpen(false);

    // We add the listener in a timeout to ensure the click that opens the menu
    // doesn't immediately close it due to bubbling.
    const timer = setTimeout(() => {
      window.addEventListener("click", handleGlobalClick);
    }, 0);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleGlobalClick);
    };
  }, [isOpen]);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Our Story", href: "/#story" },
    { label: "Details", href: "/#details" },
    // { label: 'Gallery', href: '/#gallery' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo / Names */}
            <Link
              href="/"
              className={`font-script text-2xl md:text-3xl tracking-wide ${logoColor} transition-colors duration-300`}
            >
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

            {/* Hamburger */}
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
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
            isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
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
          </div>
        </div>
      </nav>
    </>
  );
}
