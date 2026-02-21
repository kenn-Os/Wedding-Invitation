'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Heart, Plus, Minus, Check, AlertCircle, Loader2, UserPlus } from 'lucide-react';

export default function RSVPPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState('loading'); // loading | invalid | form | success | already_submitted
  const [invitee, setInvitee] = useState(null);
  const [attending, setAttending] = useState(null); // true | false
  const [submitterName, setSubmitterName] = useState('');
  const [guestCount, setGuestCount] = useState(0);
  const [additionalGuests, setAdditionalGuests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const verifyToken = useCallback(async () => {
    if (!token) {
      setStep('invalid');
      return;
    }
    try {
      const res = await fetch(`/api/verify-token?token=${token}`);
      const data = await res.json();
      if (data.valid) {
        setInvitee(data.invitee);
        if (data.already_submitted) {
          setStep('already_submitted');
        } else {
          setSubmitterName(data.invitee.name || '');
          setStep('form');
        }
      } else {
        setStep('invalid');
      }
    } catch {
      setStep('invalid');
    }
  }, [token]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const handleGuestCountChange = (count) => {
    const newCount = Math.max(0, Math.min(10, count));
    setGuestCount(newCount);
    const updated = [...additionalGuests];
    while (updated.length < newCount) updated.push('');
    updated.length = newCount;
    setAdditionalGuests(updated);
  };

  const handleGuestNameChange = (index, value) => {
    const updated = [...additionalGuests];
    updated[index] = value;
    setAdditionalGuests(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submitterName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (attending && additionalGuests.some((g) => !g.trim())) {
      setError('Please enter the full name of each additional guest.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          submitter_name: submitterName.trim(),
          attending,
          guest_count: attending ? guestCount : 0,
          additional_guests: attending ? additionalGuests.filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('success');
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── LOADING ──
  if (step === 'loading') {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-champagne mx-auto mb-4" />
          <p className="font-display text-lg italic text-deeprose font-light">Verifying your invitation…</p>
        </div>
      </main>
    );
  }

  // ── INVALID TOKEN ──
  if (step === 'invalid') {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <AlertCircle size={40} className="text-rose mx-auto mb-6" />
          <h1 className="font-display text-3xl text-deeprose font-light mb-4">Invalid Invitation</h1>
          <p className="font-sans text-sm text-warmgray leading-relaxed">
            This invitation link is invalid or has expired. Please use the link sent to you directly, or contact the couple.
          </p>
        </div>
      </main>
    );
  }

  // ── ALREADY SUBMITTED ──
  if (step === 'already_submitted') {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 flex items-center justify-center bg-champagne/20 border border-champagne/40 mx-auto mb-6">
            <Check size={28} className="text-champagne" />
          </div>
          <p className="font-script text-5xl text-champagne mb-4">Thank You!</p>
          <h2 className="font-display text-2xl text-deeprose font-light italic mb-4">
            You&apos;ve already RSVP&apos;d
          </h2>
          <p className="font-sans text-sm text-warmgray">
            We&apos;ve already received your RSVP. We look forward to celebrating with you!
          </p>
        </div>
      </main>
    );
  }

  // ── SUCCESS ──
  if (step === 'success') {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-6">
        <Navbar />
        <div className="text-center max-w-lg mt-20">
          <div className="w-20 h-20 flex items-center justify-center bg-champagne/20 border border-champagne/40 mx-auto mb-8">
            <Heart size={32} className="text-champagne fill-champagne/50" />
          </div>
          <p className="font-script text-6xl text-champagne mb-4">
            {attending ? 'We\'ll See You There!' : 'We Understand'}
          </p>
          <div className="ornament my-6">
            <span className="font-sans text-xs tracking-widest text-warmgray uppercase">RSVP Received</span>
          </div>
          <p className="font-display text-xl text-deeprose font-light italic mb-4">
            {attending
              ? `Thank you, ${submitterName}! Your RSVP has been received. We're so excited to celebrate with you${guestCount > 0 ? ` and your guests` : ''}.`
              : `Thank you for letting us know, ${submitterName}. You'll be missed, and we'll be thinking of you.`}
          </p>
          <div className="gold-divider my-8" />
          <p className="font-sans text-sm text-warmgray">
            Details about the wedding venue and time will be shared soon. Keep an eye on your inbox!
          </p>
        </div>
      </main>
    );
  }

  // ── RSVP FORM ──
  return (
    <main className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative pt-20">
        <div
          className="h-52 md:h-64 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&q=80')`,
          }}
        >
          <div className="hero-overlay absolute inset-0" />
          <div className="relative h-full flex flex-col items-center justify-center text-white text-center px-6">
            <p className="font-script text-5xl md:text-6xl mb-2">You&apos;re Invited</p>
            <p className="font-display italic font-light text-white/80 text-sm">Please respond at your earliest convenience</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-xl mx-auto px-6 py-12 md:py-16">
        <div className="bg-ivory border border-blush/30 p-8 md:p-12 shadow-sm">

          {/* Greeting */}
          <div className="text-center mb-10">
            <p className="font-sans text-xs tracking-widest uppercase text-champagne mb-2">Dear Guest</p>
            <h1 className="font-display text-3xl md:text-4xl text-deeprose font-light">
              {invitee?.name ? (
                <>Kindly RSVP, <em>{invitee.name}</em></>
              ) : (
                'Kindly RSVP'
              )}
            </h1>
            <div className="gold-divider mt-6" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Your Name */}
            <div>
              <label className="block font-sans text-xs tracking-widest uppercase text-warmgray mb-2">
                Your Full Name <span className="text-rose">*</span>
              </label>
              <input
                type="text"
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                placeholder="Enter your full name"
                className="wedding-input"
                required
              />
            </div>

            {/* Attending? */}
            <div>
              <label className="block font-sans text-xs tracking-widest uppercase text-warmgray mb-4">
                Will you be attending? <span className="text-rose">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: true, label: 'Joyfully Accepts', emoji: '🥂' },
                  { value: false, label: 'Regretfully Declines', emoji: '💌' },
                ].map((option) => (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => setAttending(option.value)}
                    className={`py-4 px-3 border text-center transition-all duration-200 font-sans text-xs tracking-wide ${
                      attending === option.value
                        ? 'bg-champagne border-champagne text-white'
                        : 'bg-white border-blush/50 text-warmgray hover:border-champagne'
                    }`}
                  >
                    <div className="text-lg mb-1">{option.emoji}</div>
                    <div>{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Guest count — only if attending */}
            {attending === true && (
              <div className="animate-fade-up">
                <label className="block font-sans text-xs tracking-widest uppercase text-warmgray mb-4">
                  Additional Guests Accompanying You
                </label>
                <p className="font-sans text-xs text-warmgray/80 mb-4">
                  How many additional people will be joining you? (Not counting yourself)
                </p>

                {/* Counter */}
                <div className="flex items-center gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => handleGuestCountChange(guestCount - 1)}
                    className="w-10 h-10 flex items-center justify-center border border-blush/50 text-warmgray hover:border-champagne hover:text-champagne transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-display text-3xl text-deeprose w-10 text-center">{guestCount}</span>
                  <button
                    type="button"
                    onClick={() => handleGuestCountChange(guestCount + 1)}
                    className="w-10 h-10 flex items-center justify-center border border-blush/50 text-warmgray hover:border-champagne hover:text-champagne transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="font-sans text-xs text-warmgray">
                    {guestCount === 0 ? 'Just me' : `+${guestCount} guest${guestCount > 1 ? 's' : ''}`}
                  </span>
                </div>

                {/* Guest names */}
                {guestCount > 0 && (
                  <div className="space-y-3">
                    <p className="font-sans text-xs tracking-widest uppercase text-warmgray mb-3 flex items-center gap-2">
                      <UserPlus size={12} />
                      Guest Names
                    </p>
                    {additionalGuests.map((name, i) => (
                      <div key={i}>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => handleGuestNameChange(i, e.target.value)}
                          placeholder={`Guest ${i + 1} full name`}
                          className="wedding-input"
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-rose/10 border border-rose/30 px-4 py-3">
                <AlertCircle size={14} className="text-rose shrink-0" />
                <p className="font-sans text-xs text-rose">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={attending === null || submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Submitting…
                </>
              ) : (
                'Confirm RSVP'
              )}
            </button>
          </form>
        </div>

        {/* Note */}
        <p className="text-center font-display italic text-sm text-warmgray mt-8">
          &ldquo;Your presence is the greatest gift of all.&rdquo;
        </p>
      </div>
    </main>
  );
}
