"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, X } from "lucide-react";
import Link from "next/link";
import { WEDDING_DATA } from "@/lib/constants";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // We'll verify against the API to handle the dynamic password
      const res = await fetch("/api/settings/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem("weddingDashboardAuth", "true");
        router.push("/dashboard");
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-ivory flex items-center justify-center p-6">
      <Link
        href="/"
        className="absolute top-10 left-10 font-script text-2xl text-deeprose"
      >
        {WEDDING_DATA.couple.initials}
      </Link>

      <div className="relative bg-white w-full max-w-md p-10 border border-blush/40 shadow-2xl animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4 border border-blush/20">
            <Lock className="text-champagne" size={24} />
          </div>
          <p className="font-script text-4xl text-champagne mb-2">
            Host Access
          </p>
          <p className="font-display text-lg text-deeprose font-light italic">
            Enter your dashboard password
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Password"
              className="wedding-input pr-12 w-full p-3 border border-blush/20 focus:outline-none focus:border-champagne"
              autoFocus
              disabled={loading}
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
            <p className="text-rose text-xs font-sans tracking-wide text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full mt-2 py-3 bg-deeprose text-white hover:bg-deeprose/90 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Enter Dashboard"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-xs text-warmgray hover:underline uppercase tracking-widest"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
