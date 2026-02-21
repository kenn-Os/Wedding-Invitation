'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { WEDDING_DATA } from '@/lib/constants';
import {
  Users, UserCheck, UserX, Clock, Plus, Copy, Check, Trash2,
  RefreshCw, ChevronDown, ChevronUp, Eye, EyeOff, Mail, Search, Link2, FileDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dashboard data
  const [invitees, setInvitees] = useState([]);
  const [stats, setStats] = useState({ total: 0, accepted: 0, declined: 0, pending: 0, totalGuests: 0 });
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');

  // Add invitee form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // UI state
  const [copiedId, setCopiedId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all | accepted | declined | pending
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem('weddingDashboardAuth');
    if (auth === 'true') {
      setAuthenticated(true);
    } else {
      router.push('/');
    }
    setLoading(false);
  }, [router]);

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    setError('');
    try {
      const res = await fetch('/api/guests');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInvitees(data.invitees || []);
      setStats(data.stats || { total: 0, accepted: 0, declined: 0, pending: 0, totalGuests: 0 });
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setDataLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) fetchData();
  }, [authenticated, fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleAddInvitee = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setAddError('Name is required.');
      return;
    }
    setAddLoading(true);
    setAddError('');
    try {
      const res = await fetch('/api/invitees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setNewName('');
      setNewEmail('');
      await fetchData();
    } catch (err) {
      setAddError('Failed to add invitee: ' + err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this invitee and their RSVP? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/invitees?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await fetchData();
    } catch (err) {
      setError('Failed to delete: ' + err.message);
    }
  };

  const getInviteLink = (token) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/rsvp?token=${token}`;
  };

  const copyLink = async (token, id) => {
    await navigator.clipboard.writeText(getInviteLink(token));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareViaWhatsApp = (token, name) => {
    const link = getInviteLink(token);
    const text = encodeURIComponent(`Hi ${name}! You are cordially invited to our wedding. Please RSVP here: ${link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaEmail = (token, name) => {
    const link = getInviteLink(token);
    const subject = encodeURIComponent(`Wedding Invitation`);
    const body = encodeURIComponent(`Hi ${name},\n\nYou are cordially invited to our wedding! Please RSVP using the link below:\n\n${link}\n\nWe look forward to celebrating with you!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleExport = () => {
    if (invitees.length === 0) return;

    try {
      const doc = new jsPDF();
      
      // Page styling / Title
      doc.setFontSize(22);
      doc.setTextColor(214, 77, 101); // deeprose
      doc.text(`${WEDDING_DATA.couple.person1} & ${WEDDING_DATA.couple.person2} Wedding`, 105, 15, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(110, 105, 106); // warmgray
      doc.text('Guest List & RSVP Summary', 105, 25, { align: 'center' });

      // Stats Summary
      const totalAttending = invitees.reduce((acc, inv) => acc + (inv.rsvp?.attending ? (1 + (inv.rsvp.guest_count || 0)) : 0), 0);
      doc.setFontSize(11);
      doc.setTextColor(47, 46, 46); // charcoal
      doc.text(`Total Confirmed Guests: ${totalAttending}`, 14, 40);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 196, 40, { align: 'right' });

      // Build Table Data
      const tableColumn = ["Guest Name", "Email", "Status", "RSVP Name", "Guests", "Additional Names"];
      const tableRows = invitees.map(inv => {
        const status = !inv.rsvp ? 'Pending' : inv.rsvp.attending ? 'Accepted' : 'Declined';
        const additionalGuestNames = inv.rsvp?.additional_guests?.map(g => g.name).join(', ') || '-';
        const guestCount = inv.rsvp?.attending ? (inv.rsvp.guest_count || 0) : 0;
        
        return [
          inv.name,
          inv.email || "-",
          status,
          inv.rsvp?.submitter_name || "-",
          guestCount,
          additionalGuestNames
        ];
      });

      // Generate Table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'striped',
        headStyles: { 
          fillColor: [214, 77, 101], // deeprose
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: { 
          fontSize: 9,
          textColor: [47, 46, 46]
        },
        alternateRowStyles: {
          fillColor: [254, 250, 246] // cream
        },
        columnStyles: {
          4: { halign: 'center' }, // Guests count column
          2: { halign: 'center' }  // Status column
        },
        margin: { top: 45 }
      });

      // Save PDF
      doc.save(`${WEDDING_DATA.couple.person1}_${WEDDING_DATA.couple.person2}_Guest_List.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const filteredInvitees = invitees
    .filter((inv) => {
      const term = searchTerm.toLowerCase();
      const nameMatch = inv.name.toLowerCase().includes(term);
      const statusMatch =
        filter === 'all' ||
        (filter === 'pending' && !inv.rsvp) ||
        (filter === 'accepted' && inv.rsvp?.attending === true) ||
        (filter === 'declined' && inv.rsvp?.attending === false);
      return nameMatch && statusMatch;
    });

  const handleSignOut = () => {
    sessionStorage.removeItem('weddingDashboardAuth');
    router.push('/');
  };

  if (loading) return null;
  if (!authenticated) return null;

  return (
    <main className="min-h-screen bg-ivory">
      <Navbar />

      {/* Page Header */}
      <div className="pt-20 bg-deeprose">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="font-script text-4xl text-champagne mb-1">Host Dashboard</p>
              <p className="font-display italic text-blush/80 font-light text-sm">
                {WEDDING_DATA.couple.person1} & {WEDDING_DATA.couple.person2} — Wedding Guest Management
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={invitees.length === 0}
                className="flex items-center gap-2 bg-champagne text-white hover:bg-champagne/90 px-4 py-2 font-sans text-xs tracking-widest uppercase transition-colors shadow-sm disabled:opacity-50"
              >
                <FileDown size={14} />
                Export List
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 border border-white/20 text-white/70 hover:text-white px-4 py-2 font-sans text-xs tracking-widest uppercase transition-colors"
              >
                <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={handleSignOut}
                className="border border-blush/40 text-blush hover:bg-blush/10 px-4 py-2 font-sans text-xs tracking-widest uppercase transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {[
            { label: 'Total Invited', value: stats.total, icon: Users, color: 'text-deeprose' },
            { label: 'Attending', value: stats.accepted, icon: UserCheck, color: 'text-green-600' },
            { label: 'Declined', value: stats.declined, icon: UserX, color: 'text-rose' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-champagne' },
            { label: 'Total Guests', value: stats.totalGuests, icon: Users, color: 'text-deeprose' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card border border-blush/30 p-5 text-center">
              <stat.icon size={18} className={`mx-auto mb-2 ${stat.color}`} />
              <p className={`font-display text-3xl font-light ${stat.color}`}>{stat.value}</p>
              <p className="font-sans text-xs text-warmgray tracking-wide mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── ADD INVITEE ── */}
          <div className="lg:col-span-1">
            <div className="bg-ivory border border-blush/30 p-6 shadow-sm mb-6">
              <h2 className="font-display text-xl text-deeprose font-light mb-6 flex items-center gap-2">
                <Plus size={16} className="text-champagne" />
                Add Invitee
              </h2>
              <form onSubmit={handleAddInvitee} className="space-y-4">
                <div>
                  <label className="block font-sans text-xs tracking-widest uppercase text-warmgray mb-2">
                    Full Name(s) <span className="text-rose">*</span>
                  </label>
                  <textarea
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="John Doe, Jane Smith..."
                    className="wedding-input min-h-[80px] py-3"
                  />
                  <p className="font-sans text-[10px] text-warmgray/60 mt-1">
                    Separate multiple names with commas to generate unique links.
                  </p>
                </div>
                <div>
                  <label className="block font-sans text-xs tracking-widest uppercase text-warmgray mb-2">
                    Email <span className="text-warmgray/60">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="guest@email.com"
                    className="wedding-input"
                  />
                </div>
                {addError && (
                  <p className="font-sans text-xs text-rose">{addError}</p>
                )}
                <button
                  type="submit"
                  disabled={addLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addLoading ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Plus size={12} />
                  )}
                  Generate Invite Link
                </button>
              </form>
            </div>

            {/* Legend */}
            <div className="bg-ivory border border-blush/30 p-6 shadow-sm">
              <h3 className="font-display text-lg text-deeprose font-light mb-4">Status Key</h3>
              <div className="space-y-2">
                {[
                  { color: 'bg-green-100 text-green-700', label: 'Attending' },
                  { color: 'bg-rose/10 text-rose', label: 'Declined' },
                  { color: 'bg-champagne/10 text-champagne', label: 'Pending / No Response' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 font-sans ${s.color}`}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── GUEST LIST ── */}
          <div className="lg:col-span-2">
            <div className="bg-ivory border border-blush/30 shadow-sm">
              {/* Header */}
              <div className="p-6 border-b border-blush/20">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warmgray" />
                    <input
                      type="text"
                      placeholder="Search guests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="wedding-input pl-11"
                    />
                  </div>
                  {/* Filter */}
                  <div className="flex gap-1">
                    {['all', 'accepted', 'declined', 'pending'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-2 font-sans text-xs tracking-wide uppercase transition-colors ${
                          filter === f
                            ? 'bg-champagne text-white'
                            : 'bg-cream text-warmgray hover:text-deeprose border border-blush/30'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 bg-rose/10 border-b border-rose/20">
                  <p className="font-sans text-xs text-rose">{error}</p>
                </div>
              )}

              {/* List */}
              {dataLoading ? (
                <div className="p-10 text-center">
                  <RefreshCw size={24} className="animate-spin text-champagne mx-auto mb-3" />
                  <p className="font-display italic text-warmgray">Loading guests…</p>
                </div>
              ) : filteredInvitees.length === 0 ? (
                <div className="p-10 text-center">
                  <Users size={32} className="text-blush mx-auto mb-3" />
                  <p className="font-display text-xl italic text-warmgray">
                    {invitees.length === 0 ? 'No invitees yet. Add your first guest!' : 'No guests match this filter.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-blush/20">
                  {filteredInvitees.map((inv) => {
                    const status = !inv.rsvp ? 'pending' : inv.rsvp.attending ? 'accepted' : 'declined';
                    const statusStyles = {
                      pending: 'bg-champagne/10 text-champagne',
                      accepted: 'bg-green-100 text-green-700',
                      declined: 'bg-rose/10 text-rose',
                    };
                    const isExpanded = expandedId === inv.id;
                    const totalForInvitee = inv.rsvp?.attending
                      ? 1 + (inv.rsvp.guest_count || 0)
                      : null;

                    return (
                      <div key={inv.id} className="p-4 hover:bg-cream/50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-display text-lg text-deeprose font-light">{inv.name}</p>
                              <span className={`font-sans text-xs px-2 py-0.5 capitalize ${statusStyles[status]}`}>
                                {status}
                              </span>
                              {status === 'accepted' && totalForInvitee && (
                                <span className="font-sans text-xs text-warmgray">
                                  ({totalForInvitee} total)
                                </span>
                              )}
                            </div>
                            {inv.email && (
                              <p className="font-sans text-xs text-warmgray mt-0.5 flex items-center gap-1">
                                <Mail size={10} />
                                {inv.email}
                              </p>
                            )}
                            {inv.rsvp && (
                              <p className="font-sans text-xs text-warmgray mt-0.5">
                                RSVP&apos;d as: <em>{inv.rsvp.submitter_name}</em>
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* WhatsApp Share */}
                            <button
                              onClick={() => shareViaWhatsApp(inv.token, inv.name)}
                              title="Share on WhatsApp"
                              className="p-2 text-warmgray hover:text-[#25D366] transition-colors"
                            >
                              <Image 
                                src="https://cdn-icons-png.flaticon.com/512/124/124034.png" 
                                width={12} 
                                height={12} 
                                className="opacity-60 hover:opacity-100 transition-opacity" 
                                alt="WA" 
                              />
                            </button>

                            {/* Email Share */}
                            <button
                              onClick={() => shareViaEmail(inv.token, inv.name)}
                              title="Share via Email"
                              className="p-2 text-warmgray hover:text-charcoal transition-colors"
                            >
                              <Mail size={14} />
                            </button>

                            {/* Copy Link */}
                            <button
                              onClick={() => copyLink(inv.token, inv.id)}
                              title="Copy invite link"
                              className="p-2 text-warmgray hover:text-champagne transition-colors"
                            >
                              {copiedId === inv.id ? <Check size={14} className="text-green-600" /> : <Link2 size={14} />}
                            </button>

                            {/* Expand */}
                            {(inv.rsvp?.additional_guests?.length > 0 || status !== 'pending') && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                                className="p-2 text-warmgray hover:text-champagne transition-colors"
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(inv.id)}
                              title="Remove invitee"
                              className="p-2 text-warmgray hover:text-rose transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded: invite link + additional guests */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-blush/20 space-y-3">
                            {/* Invite link */}
                            <div>
                              <p className="font-sans text-xs text-warmgray uppercase tracking-widest mb-1">Invite Link</p>
                              <div className="flex items-center gap-2 bg-cream p-2 border border-blush/20">
                                <p className="font-sans text-xs text-warmgray truncate flex-1">
                                  {getInviteLink(inv.token)}
                                </p>
                                <button
                                  onClick={() => copyLink(inv.token, inv.id)}
                                  className="shrink-0 text-champagne hover:opacity-70"
                                >
                                  {copiedId === inv.id ? <Check size={12} /> : <Copy size={12} />}
                                </button>
                              </div>
                            </div>

                            {/* Additional guests */}
                            {inv.rsvp?.additional_guests?.length > 0 && (
                              <div>
                                <p className="font-sans text-xs text-warmgray uppercase tracking-widest mb-2">
                                  Additional Guests ({inv.rsvp.additional_guests.length})
                                </p>
                                <ul className="space-y-1">
                                  {inv.rsvp.additional_guests.map((guest, i) => (
                                    <li key={i} className="font-sans text-xs text-charcoal flex items-center gap-2">
                                      <span className="w-4 h-4 bg-champagne/20 flex items-center justify-center text-champagne text-[10px]">
                                        {i + 1}
                                      </span>
                                      {guest.name}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Pending note */}
                            {status === 'pending' && (
                              <p className="font-sans text-xs text-warmgray italic">
                                This guest has not yet responded. Send them the invite link above.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Quick copy link (always visible at bottom for pending) */}
                        {status === 'pending' && !isExpanded && (
                          <div className="mt-2">
                            <button
                              onClick={() => copyLink(inv.token, inv.id)}
                              className="font-sans text-xs text-champagne hover:underline flex items-center gap-1"
                            >
                              <Copy size={10} />
                              {copiedId === inv.id ? 'Copied!' : 'Copy invite link to send'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer count */}
              {filteredInvitees.length > 0 && (
                <div className="p-4 border-t border-blush/20 text-center">
                  <p className="font-sans text-xs text-warmgray">
                    Showing {filteredInvitees.length} of {invitees.length} invitees
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
