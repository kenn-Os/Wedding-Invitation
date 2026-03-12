"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { WEDDING_DATA } from "@/lib/constants";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Plus,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Mail,
  Search,
  Link2,
  FileDown,
  Lock,
  X,
  QrCode,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { QRCodeCanvas } from "qrcode.react";

export default function DashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dashboard data
  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    accepted: 0,
    declined: 0,
    pending: 0,
    totalGuests: 0,
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState("");

  // Add guest form
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // UI state
  const [copiedId, setCopiedId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all | accepted | declined | pending
  const [refreshing, setRefreshing] = useState(false);
  const [qrGuest, setQrGuest] = useState(null);

  useEffect(() => {
    const auth = sessionStorage.getItem("weddingDashboardAuth");
    if (auth === "true") {
      setAuthenticated(true);
    } else {
      router.push("/");
    }
    setLoading(false);
  }, [router]);

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    setError("");
    try {
      const res = await fetch("/api/guests");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGuests(data.guests || []);
      setStats(
        data.stats || {
          total: 0,
          accepted: 0,
          declined: 0,
          pending: 0,
          totalGuests: 0,
        },
      );
    } catch (err) {
      setError("Failed to load data: " + err.message);
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

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setAddError("Name is required.");
      return;
    }
    setAddLoading(true);
    setAddError("");
    try {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: guestName.trim(),
          email: guestEmail.trim(),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setGuestName("");
      setGuestEmail("");
      await fetchData();
    } catch (err) {
      setAddError("Failed to add guest: " + err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this guest and their RSVP? This cannot be undone."))
      return;
    try {
      const res = await fetch(`/api/guests?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await fetchData();
    } catch (err) {
      setError("Failed to delete: " + err.message);
    }
  };

  const getInviteLink = (token) => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/rsvp?token=${token}`;
  };

  const copyLink = async (token, id) => {
    await navigator.clipboard.writeText(getInviteLink(token));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareViaWhatsApp = (token, name) => {
    const link = getInviteLink(token);
    const text = encodeURIComponent(
      `Hi ${name}! You are cordially invited to our wedding. Please RSVP here: ${link}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareViaEmail = (token, name) => {
    const link = getInviteLink(token);
    const subject = encodeURIComponent(`Wedding Invitation`);
    const body = encodeURIComponent(
      `Hi ${name},\n\nYou are cordially invited to our wedding! Please RSVP using the link below:\n\n${link}\n\nWe look forward to celebrating with you!`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const downloadQRCode = (guestName) => {
    const qrCanvas = document.getElementById("qr-code-canvas");
    if (!qrCanvas) return;

    // Create a new temporary canvas for the final design
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set dimensions (QR size + padding for text)
    const padding = 40;
    const headerHeight = 60;
    const footerHeight = 40;
    canvas.width = qrCanvas.width + padding * 2;
    canvas.height = qrCanvas.height + headerHeight + footerHeight + padding;

    // 1. Draw Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Guest Name (Header)
    ctx.fillStyle = "#d64d65"; // deeprose
    ctx.font = "bold 24px 'Playfair Display', serif";
    ctx.textAlign = "center";
    ctx.fillText(guestName, canvas.width / 2, padding + 20);

    // 3. Draw QR Code (Middle)
    ctx.drawImage(qrCanvas, padding, headerHeight + padding / 2);

    // 4. Draw RSVP Text (Footer)
    ctx.fillStyle = "#6e696a"; // warmgray
    ctx.font = "italic 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "Scan the code to RSVP",
      canvas.width / 2,
      canvas.height - padding / 2
    );

    // 5. Download
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${guestName.replace(/\s+/g, "_")}_QR_Code.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const downloadPDF = (guestName) => {
    const qrCanvas = document.getElementById("qr-code-canvas");
    if (!qrCanvas) return;

    // A6 size card (105 x 148 mm)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a6",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Draw Background (White)
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // 2. Draw Header (Guest Name)
    doc.setTextColor(214, 77, 101); // deeprose
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(guestName, pageWidth / 2, 25, { align: "center" });

    // 3. Draw QR Code (Centered)
    const qrImage = qrCanvas.toDataURL("image/png");
    const qrSize = 60;
    doc.addImage(qrImage, "PNG", (pageWidth - qrSize) / 2, 40, qrSize, qrSize);

    // 4. Draw Footer (RSVP Text)
    doc.setTextColor(110, 105, 106); // warmgray
    doc.setFontSize(14);
    doc.setFont("helvetica", "italic");
    doc.text("Scan the code to RSVP", pageWidth / 2, 115, { align: "center" });

    // 5. Couple names at the bottom
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${WEDDING_DATA.couple.person1} & ${WEDDING_DATA.couple.person2}`,
      pageWidth / 2,
      135,
      { align: "center" },
    );

    // Save PDF
    doc.save(`${guestName.replace(/\s+/g, "_")}_QR_Invitation.pdf`);
  };

  const handleExport = () => {
    if (guests.length === 0) return;

    try {
      const doc = new jsPDF();

      // Page styling / Title
      doc.setFontSize(22);
      doc.setTextColor(214, 77, 101); // deeprose
      doc.text(
        `${WEDDING_DATA.couple.person1} & ${WEDDING_DATA.couple.person2} Wedding`,
        105,
        15,
        { align: "center" },
      );

      doc.setFontSize(16);
      doc.setTextColor(110, 105, 106); // warmgray
      doc.text("Guest List & RSVP Summary", 105, 25, { align: "center" });

      // Stats Summary
      const totalAttending = guests.reduce(
        (acc, g) =>
          acc + (g.rsvp?.attending ? 1 + (g.rsvp.guest_count || 0) : 0),
        0,
      );
      doc.setFontSize(11);
      doc.setTextColor(47, 46, 46); // charcoal
      doc.text(`Total Confirmed Guests: ${totalAttending}`, 14, 40);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 196, 40, {
        align: "right",
      });

      // Build Table Data
      const tableColumn = [
        "Guest Name",
        "Email",
        "Status",
        "RSVP Name",
        "Guests",
        "Additional Names",
      ];
      const tableRows = guests.map((g) => {
        const status = !g.rsvp
          ? "Pending"
          : g.rsvp.attending
            ? "Accepted"
            : "Declined";
        const additionalGuestNames =
          g.rsvp?.additional_guests?.map((ag) => ag.name).join(", ") || "-";
        const guestCount = g.rsvp?.attending ? g.rsvp.guest_count || 0 : 0;

        return [
          g.name,
          g.email || "-",
          status,
          g.rsvp?.submitter_name || "-",
          guestCount,
          additionalGuestNames,
        ];
      });

      // Generate Table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: "striped",
        headStyles: {
          fillColor: [214, 77, 101], // deeprose
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [47, 46, 46],
        },
        alternateRowStyles: {
          fillColor: [254, 250, 246], // cream
        },
        columnStyles: {
          4: { halign: "center" }, // Guests count column
          2: { halign: "center" }, // Status column
        },
        margin: { top: 45 },
      });

      // Save PDF
      doc.save(
        `${WEDDING_DATA.couple.person1}_${WEDDING_DATA.couple.person2}_Guest_List.pdf`,
      );
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleClearList = async () => {
    const warning =
      "⚠️ WARNING: Do you wish to clear the guest list? \n\nThis will permanently delete ALL guests, RSVPs, and data to start afresh. This cannot be undone.";

    if (!window.confirm(warning)) return;

    // Second confirmation for such a destructive action
    if (!window.confirm("Are you absolutely sure? This is your final warning."))
      return;

    setDataLoading(true);
    try {
      const res = await fetch("/api/guests", { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Clear local state and refetch
      setGuests([]);
      await fetchData();
      alert("Guest list has been cleared and you are ready to start afresh.");
    } catch (err) {
      setError("Failed to clear list: " + err.message);
    } finally {
      setDataLoading(false);
    }
  };

  const filteredGuests = guests.filter((g) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = g.name.toLowerCase().includes(term);
    const statusMatch =
      filter === "all" ||
      (filter === "pending" && !g.rsvp) ||
      (filter === "accepted" && g.rsvp?.attending === true) ||
      (filter === "declined" && g.rsvp?.attending === false);
    return nameMatch && statusMatch;
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setPasswordError("Password must be at least 4 characters.");
      return;
    }
    setPasswordLoading(true);
    setPasswordError("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      alert("Password updated successfully!");
      setShowPasswordModal(false);
      setNewPassword("");
    } catch (err) {
      setPasswordError("Failed to update password: " + err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem("weddingDashboardAuth");
    router.push("/");
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
              <p className="font-script text-4xl text-champagne mb-1">
                Host Dashboard
              </p>
              <p className="font-display italic text-blush/80 font-light text-sm">
                {WEDDING_DATA.couple.person1} & {WEDDING_DATA.couple.person2} —
                Wedding Guest Management
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 border border-white/20 text-white/70 hover:text-white px-4 py-2 font-sans text-xs tracking-widest uppercase transition-colors"
              >
                <Lock size={12} />
                Change Password
              </button>
              <button
                onClick={handleClearList}
                disabled={guests.length === 0 || dataLoading}
                className="flex items-center gap-2 border border-rose/30 text-rose hover:bg-rose/10 px-4 py-2 font-sans text-xs tracking-widest uppercase transition-colors disabled:opacity-30"
              >
                <Trash2 size={14} />
                Clear List
              </button>
              <button
                onClick={handleExport}
                disabled={guests.length === 0}
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
                <RefreshCw
                  size={12}
                  className={refreshing ? "animate-spin" : ""}
                />
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

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
            onClick={() => setShowPasswordModal(false)}
          />
          <div className="relative bg-white w-full max-w-md p-10 border border-blush/40 shadow-2xl">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-warmgray hover:text-deeprose"
            >
              <X size={18} />
            </button>
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl text-deeprose font-light mb-2">
                Change Password
              </h2>
              <p className="text-sm text-warmgray">
                Enter a new password for the dashboard.
              </p>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="wedding-input w-full p-3 border border-blush/20"
                autoFocus
              />
              {passwordError && (
                <p className="text-rose text-xs text-center">{passwordError}</p>
              )}
              <button
                type="submit"
                disabled={passwordLoading}
                className="btn-primary w-full py-3 bg-deeprose text-white disabled:opacity-50"
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrGuest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
            onClick={() => setQrGuest(null)}
          />
          <div className="relative bg-white w-full max-w-sm p-10 border border-blush/40 shadow-2xl text-center">
            <button
              onClick={() => setQrGuest(null)}
              className="absolute top-4 right-4 text-warmgray hover:text-deeprose"
            >
              <X size={18} />
            </button>
            <div className="mb-6">
              <h2 className="font-display text-2xl text-deeprose font-light mb-2">
                QR Code
              </h2>
              <p className="text-sm text-warmgray">{qrGuest.name}</p>
            </div>
            <div className="flex flex-col items-center bg-white p-4 border border-blush/10 rounded-lg mb-8 shadow-inner">
              <QRCodeCanvas
                id="qr-code-canvas"
                value={getInviteLink(qrGuest.token)}
                size={200}
                level={"H"}
                includeMargin={true}
              />
              <p className="font-sans text-xs text-warmgray mt-2 italic">
                Scan the code to RSVP
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => downloadQRCode(qrGuest.name)}
                className="btn-primary flex items-center justify-center gap-2 py-3"
              >
                <FileDown size={14} />
                PNG Image
              </button>
              <button
                onClick={() => downloadPDF(qrGuest.name)}
                className="flex items-center justify-center gap-2 border border-deeprose text-deeprose hover:bg-deeprose/5 transition-colors font-sans text-[10px] tracking-widest uppercase"
              >
                <FileDown size={14} />
                PDF Document
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        {/* ── STATS ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {[
            {
              label: "Total Invited",
              value: stats.total,
              icon: Users,
              color: "text-deeprose",
            },
            {
              label: "Attending",
              value: stats.accepted,
              icon: UserCheck,
              color: "text-green-600",
            },
            {
              label: "Declined",
              value: stats.declined,
              icon: UserX,
              color: "text-rose",
            },
            {
              label: "Pending",
              value: stats.pending,
              icon: Clock,
              color: "text-champagne",
            },
            {
              label: "Total Guests",
              value: stats.totalGuests,
              icon: Users,
              color: "text-deeprose",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card border border-blush/30 p-5 text-center"
            >
              <stat.icon size={18} className={`mx-auto mb-2 ${stat.color}`} />
              <p className={`font-display text-3xl font-light ${stat.color}`}>
                {stat.value}
              </p>
              <p className="font-sans text-xs text-warmgray tracking-wide mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── ADD GUEST ── */}
          <div className="lg:col-span-1">
            <div className="bg-ivory border border-blush/30 p-6 shadow-sm mb-6">
              <h2 className="font-display text-xl text-deeprose font-light mb-6 flex items-center gap-2">
                <Plus size={16} className="text-champagne" />
                Add Guest
              </h2>
              <form onSubmit={handleAddGuest} className="space-y-4">
                <div>
                  <label className="block font-sans text-xs tracking-widest uppercase text-warmgray mb-2">
                    Guest Name(s) <span className="text-rose">*</span>
                  </label>
                  <textarea
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="John Doe, Jane Smith..."
                    className="wedding-input min-h-[80px] py-3"
                  />
                  <p className="font-sans text-[10px] text-warmgray/60 mt-1">
                    Separate multiple names with commas to generate unique
                    links.
                  </p>
                </div>
                <div>
                  <label className="block font-sans text-xs tracking-widest uppercase text-warmgray mb-2">
                    Email <span className="text-warmgray/60">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
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
              <h3 className="font-display text-lg text-deeprose font-light mb-4">
                Status Key
              </h3>
              <div className="space-y-2">
                {[
                  { color: "bg-green-100 text-green-700", label: "Attending" },
                  { color: "bg-rose/10 text-rose", label: "Declined" },
                  {
                    color: "bg-champagne/10 text-champagne",
                    label: "Pending / No Response",
                  },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 font-sans ${s.color}`}
                    >
                      {s.label}
                    </span>
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
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-warmgray"
                    />
                    <input
                      type="text"
                      placeholder="Search guests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="wedding-input !pl-11"
                    />
                  </div>
                  {/* Filter */}
                  <div className="flex gap-1">
                    {["all", "accepted", "declined", "pending"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-2 font-sans text-xs tracking-wide uppercase transition-colors ${
                          filter === f
                            ? "bg-champagne text-white"
                            : "bg-cream text-warmgray hover:text-deeprose border border-blush/30"
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
                  <RefreshCw
                    size={24}
                    className="animate-spin text-champagne mx-auto mb-3"
                  />
                  <p className="font-display italic text-warmgray">
                    Loading guests…
                  </p>
                </div>
              ) : filteredGuests.length === 0 ? (
                <div className="p-10 text-center">
                  <Users size={32} className="text-blush mx-auto mb-3" />
                  <p className="font-display text-xl italic text-warmgray">
                    {guests.length === 0
                      ? "No guests yet. Add your first guest!"
                      : "No guests match this filter."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-blush/20">
                  {filteredGuests.map((g) => {
                    const status = !g.rsvp
                      ? "pending"
                      : g.rsvp.attending
                        ? "accepted"
                        : "declined";
                    const statusStyles = {
                      pending: "bg-champagne/10 text-champagne",
                      accepted: "bg-green-100 text-green-700",
                      declined: "bg-rose/10 text-rose",
                    };
                    const isExpanded = expandedId === g.id;
                    const totalForGuest = g.rsvp?.attending
                      ? 1 + (g.rsvp.guest_count || 0)
                      : null;

                    return (
                      <div
                        key={g.id}
                        className="p-4 hover:bg-cream/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-display text-lg text-deeprose font-light">
                                {g.name}
                              </p>
                              <span
                                className={`font-sans text-xs px-2 py-0.5 capitalize ${statusStyles[status]}`}
                              >
                                {status}
                              </span>
                              {status === "accepted" && totalForGuest && (
                                <span className="font-sans text-xs text-warmgray">
                                  ({totalForGuest} total)
                                </span>
                              )}
                            </div>
                            {g.email && (
                              <p className="font-sans text-xs text-warmgray mt-0.5 flex items-center gap-1">
                                <Mail size={10} />
                                {g.email}
                              </p>
                            )}
                            {g.rsvp && (
                              <p className="font-sans text-xs text-warmgray mt-0.5">
                                RSVP&apos;d as: <em>{g.rsvp.submitter_name}</em>
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* WhatsApp Share */}
                            <button
                              onClick={() => shareViaWhatsApp(g.token, g.name)}
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
                              onClick={() => shareViaEmail(g.token, g.name)}
                              title="Share via Email"
                              className="p-2 text-warmgray hover:text-charcoal transition-colors"
                            >
                              <Mail size={14} />
                            </button>

                            {/* Copy Link */}
                            <button
                              onClick={() => copyLink(g.token, g.id)}
                              title="Copy invite link"
                              className="p-2 text-warmgray hover:text-champagne transition-colors"
                            >
                              {copiedId === g.id ? (
                                <Check size={14} className="text-green-600" />
                              ) : (
                                <Link2 size={14} />
                              )}
                            </button>

                            {/* QR Code */}
                            <button
                              onClick={() => setQrGuest(g)}
                              title="View QR Code"
                              className="p-2 text-warmgray hover:text-deeprose transition-colors"
                            >
                              <QrCode size={14} />
                            </button>

                            {/* Expand */}
                            {(g.rsvp?.additional_guests?.length > 0 ||
                              status !== "pending") && (
                              <button
                                onClick={() =>
                                  setExpandedId(isExpanded ? null : g.id)
                                }
                                className="p-2 text-warmgray hover:text-champagne transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp size={14} />
                                ) : (
                                  <ChevronDown size={14} />
                                )}
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(g.id)}
                              title="Remove guest"
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
                              <p className="font-sans text-xs text-warmgray uppercase tracking-widest mb-1">
                                Invite Link
                              </p>
                              <div className="flex items-center gap-2 bg-cream p-2 border border-blush/20">
                                <p className="font-sans text-xs text-warmgray truncate flex-1">
                                  {getInviteLink(g.token)}
                                </p>
                                <button
                                  onClick={() => copyLink(g.token, g.id)}
                                  className="shrink-0 text-champagne hover:opacity-70"
                                >
                                  {copiedId === g.id ? (
                                    <Check size={12} />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Additional guests */}
                            {g.rsvp?.additional_guests?.length > 0 && (
                              <div>
                                <p className="font-sans text-xs text-warmgray uppercase tracking-widest mb-2">
                                  Additional Guests (
                                  {g.rsvp.additional_guests.length})
                                </p>
                                <ul className="space-y-1">
                                  {g.rsvp.additional_guests.map((ag, i) => (
                                    <li
                                      key={i}
                                      className="font-sans text-xs text-charcoal flex items-center gap-2"
                                    >
                                      <span className="w-4 h-4 bg-champagne/20 flex items-center justify-center text-champagne text-[10px]">
                                        {i + 1}
                                      </span>
                                      {ag.name}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Pending note */}
                            {status === "pending" && (
                              <p className="font-sans text-xs text-warmgray italic">
                                This guest has not yet responded. Send them the
                                invite link above.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Quick copy link (always visible at bottom for pending) */}
                        {status === "pending" && !isExpanded && (
                          <div className="mt-2">
                            <button
                              onClick={() => copyLink(g.token, g.id)}
                              className="font-sans text-xs text-champagne hover:underline flex items-center gap-1"
                            >
                              <Copy size={10} />
                              {copiedId === g.id
                                ? "Copied!"
                                : "Copy invite link to send"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer count */}
              {filteredGuests.length > 0 && (
                <div className="p-4 border-t border-blush/20 text-center">
                  <p className="font-sans text-xs text-warmgray">
                    Showing {filteredGuests.length} of {guests.length} guests
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
