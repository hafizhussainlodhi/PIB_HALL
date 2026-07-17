import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  Building2,
  Wallet,
  Sun,
  Moon,
  LogOut,
  Search,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Lock,
  Mail,
  CalendarDays,
  Phone,
  User,
  Loader2,
  Menu,
  BarChart3,
  MessageCircle,
  FileDown,
  BellRing,
  PartyPopper
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import html2pdf from 'html2pdf.js';

const API_BASE = 'https://pib-hall-backend.vercel.app/api';
import './index.css'
// ============================================================================
// Utility helpers
// ============================================================================
const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const isToday = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const statusColors = {
  'Fully Paid': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  'Partially Paid': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  'Unpaid': 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
};

const EVENT_TYPES = ['Barat', 'Valima', 'Mehendi', 'Nikah', 'Birthday', 'Other'];

const EVENT_SHIFTS = ['Day', 'Night'];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Days remaining until a given date (negative if it's in the past)
const daysUntil = (dateStr) => {
  const eventDay = new Date(dateStr);
  eventDay.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((eventDay - today) / (1000 * 60 * 60 * 24));
};

// Converts a local Pakistani-style phone number (e.g. 0300-1234567) into
// the international format WhatsApp's click-to-chat links expect (923001234567)
const formatPhoneForWhatsApp = (phone) => {
  let digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '92' + digits.slice(1);
  else if (!digits.startsWith('92')) digits = '92' + digits;
  return digits;
};

const buildReceiptMessage = (booking) => {
  return [
    `PIB Wedding Hall - Booking Confirmation`,
    ``,
    `Customer: ${booking.customerName}`,
    `Event: ${booking.eventType || ''}`,
    `Hall Position: ${booking.hallPosition}`,
    `Event Date: ${formatDate(booking.eventDate)}`,
    `Event Shift: ${booking.eventShift || ''}`,
    `Total Amount: ${formatCurrency(booking.totalAmount)}`,
    `Advance Paid: ${formatCurrency(booking.advancePaid)}`,
    `Balance Due: ${formatCurrency(booking.balanceDue)}`,
    ``,
    `Thank you for booking with us!`
  ].join('\n');
};

const waLink = (phone, message) =>
  `https://wa.me/${formatPhoneForWhatsApp(phone)}?text=${encodeURIComponent(message)}`;

// Builds a hidden, print-styled invoice and hands it to html2pdf for download
const downloadReceiptPDF = (booking) => {
  const container = document.createElement('div');
  container.style.padding = '32px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.color = '#1f2937';
  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;border-bottom:2px solid #f43f5e;padding-bottom:16px;margin-bottom:20px;">
      <img src="/logo.png" style="width:56px;height:56px;object-fit:contain;" />
      <div>
        <h1 style="margin:0;font-size:20px;">PIB Wedding Hall</h1>
        <p style="margin:0;font-size:12px;color:#6b7280;">Booking Receipt</p>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#6b7280;">Customer Name</td><td style="padding:6px 0;font-weight:bold;text-align:right;">${booking.customerName}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Phone</td><td style="padding:6px 0;font-weight:bold;text-align:right;">${booking.customerPhone}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Event Type</td><td style="padding:6px 0;font-weight:bold;text-align:right;">${booking.eventType || '-'}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Hall Position</td><td style="padding:6px 0;font-weight:bold;text-align:right;">Position ${booking.hallPosition}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Event Date</td><td style="padding:6px 0;font-weight:bold;text-align:right;">${formatDate(booking.eventDate)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Event Shift</td><td style="padding:6px 0;font-weight:bold;text-align:right;">${booking.eventShift || '-'}</td></tr>
      <tr><td colspan="2" style="border-top:1px solid #e5e7eb;padding-top:10px;"></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Total Amount</td><td style="padding:6px 0;font-weight:bold;text-align:right;">${formatCurrency(booking.totalAmount)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Advance Paid</td><td style="padding:6px 0;font-weight:bold;text-align:right;">${formatCurrency(booking.advancePaid)}</td></tr>
      <tr><td style="padding:6px 0;color:#f43f5e;">Balance Due</td><td style="padding:6px 0;font-weight:bold;text-align:right;color:#f43f5e;">${formatCurrency(booking.balanceDue)}</td></tr>
    </table>
    <p style="margin-top:24px;font-size:11px;color:#9ca3af;">Generated on ${formatDate(new Date())} • PIB Hall Management</p>
  `;

  html2pdf()
    .set({
      margin: 0,
      filename: `Receipt-${booking.customerName.replace(/\s+/g, '_')}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    })
    .from(container)
    .save();
};

// ============================================================================
// Login Component
// ============================================================================
function LoginScreen({ onLogin, darkMode, setDarkMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message || 'Invalid credentials.');
      }
    } catch (err) {
      setError('Could not reach the server. Is the backend running on port 5000?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 transition-colors duration-300">
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-6 right-6 p-2.5 rounded-full bg-white/70 dark:bg-gray-800/70 shadow-md hover:scale-105 transition-transform"
      >
        {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-gray-600" />}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-gray-900 shadow-lg shadow-rose-500/20 border border-gray-100 dark:border-gray-800 mb-4 p-2">
            <img src="/logo.png" alt="PIB Wedding Hall logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">PIB Wedding Hall</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Management System</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-rose-900/5 dark:shadow-black/40 border border-gray-100 dark:border-gray-800 p-6 sm:p-8"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-5 flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm px-4 py-3 rounded-xl">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hall.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          PIB Hall Management &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Stat Card
// ============================================================================
function StatCard({ title, value, icon, accent }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
    </div>
  );
}

// ============================================================================
// Position Availability Card
// ============================================================================
function PositionAvailabilityCard({ position, isBooked, onBookNow }) {
  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border shadow-sm transition-all ${
        isBooked
          ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
          : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Hall Position</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">Position {position}</p>
        </div>
        {isBooked ? (
          <XCircle className="text-rose-500" size={26} />
        ) : (
          <CheckCircle2 className="text-emerald-500" size={26} />
        )}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            isBooked
              ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
              : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
          }`}
        >
          {isBooked ? 'Booked Today' : 'Available Today'}
        </span>
        {!isBooked && (
          <button
            onClick={() => onBookNow(position)}
            className="text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-full transition-colors"
          >
            Book Now
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// New Booking Modal
// ============================================================================
function NewBookingModal({ isOpen, onClose, onCreated, defaultPosition }) {
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    eventDate: '',
    hallPosition: defaultPosition || 'A',
    eventType: 'Barat',
    eventShift: 'Day',
    totalAmount: '',
    advancePaid: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedBooking, setSavedBooking] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setForm({
        customerName: '',
        customerPhone: '',
        eventDate: '',
        hallPosition: defaultPosition || 'A',
        eventType: 'Barat',
        eventShift: 'Day',
        totalAmount: '',
        advancePaid: ''
      });
      setError('');
      setSavedBooking(null);
    }
  }, [isOpen, defaultPosition]);

  const remainingBalance = useMemo(() => {
    const total = Number(form.totalAmount) || 0;
    const advance = Number(form.advancePaid) || 0;
    return total - advance;
  }, [form.totalAmount, form.advancePaid]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.customerName || !form.customerPhone || !form.eventDate) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          totalAmount: Number(form.totalAmount) || 0,
          advancePaid: Number(form.advancePaid) || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        onCreated();
        setSavedBooking(data.data);
      } else {
        setError(data.message || 'Failed to create booking.');
      }
    } catch (err) {
      setError('Could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    setSavedBooking(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            {savedBooking ? 'Booking Confirmed' : 'New Booking'}
          </h3>
          <button
            onClick={savedBooking ? handleDone : onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {savedBooking ? (
          <div className="px-4 sm:px-6 py-6 space-y-5">
            <div className="flex flex-col items-center text-center gap-2 py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <PartyPopper className="text-emerald-600 dark:text-emerald-400" size={26} />
              </div>
              <p className="font-semibold text-gray-800 dark:text-white">
                Booking saved for {savedBooking.customerName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Position {savedBooking.hallPosition} • {formatDate(savedBooking.eventDate)} • {savedBooking.eventShift}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Total Amount</span>
                <span className="font-semibold text-gray-800 dark:text-white">{formatCurrency(savedBooking.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Balance Due</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(savedBooking.balanceDue)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={waLink(savedBooking.customerPhone, buildReceiptMessage(savedBooking))}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
              >
                <MessageCircle size={17} />
                Send WhatsApp Receipt
              </a>
              <button
                onClick={() => downloadReceiptPDF(savedBooking)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold transition-colors"
              >
                <FileDown size={17} />
                Download PDF Receipt
              </button>
            </div>

            <button
              onClick={handleDone}
              className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 sm:py-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm px-4 py-3 rounded-xl">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Customer Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                placeholder="e.g. Sarah & James"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={form.customerPhone}
                onChange={(e) => handleChange('customerPhone', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                placeholder="e.g. 0300-1234567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Event Date</label>
              <div className="relative">
                <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => handleChange('eventDate', e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Hall Position</label>
              <select
                value={form.hallPosition}
                onChange={(e) => handleChange('hallPosition', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                <option value="A">Position A</option>
                <option value="B">Position B</option>
                <option value="C">Position C</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Event Type</label>
              <select
                value={form.eventType}
                onChange={(e) => handleChange('eventType', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Day / Night</label>
              <div className="relative">
                {form.eventShift === 'Night' ? (
                  <Moon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                ) : (
                  <Sun className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                )}
                <select
                  value={form.eventShift}
                  onChange={(e) => handleChange('eventShift', e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  {EVENT_SHIFTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Total Deal Amount</label>
              <input
                type="number"
                min="0"
                value={form.totalAmount}
                onChange={(e) => handleChange('totalAmount', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Advance Paid</label>
              <input
                type="number"
                min="0"
                value={form.advancePaid}
                onChange={(e) => handleChange('advancePaid', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                placeholder="0"
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-500/10 dark:to-amber-500/10 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Remaining Balance</span>
            <span className={`text-lg font-bold ${remainingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {formatCurrency(remainingBalance)}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            {submitting ? 'Saving...' : 'Confirm Booking'}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Bookings Table (used for Position A/B/C tabs)
// ============================================================================
function BookingsTable({ bookings, position }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const positionFiltered = bookings.filter((b) => b.hallPosition === position);
    if (!search.trim()) return positionFiltered;
    const q = search.toLowerCase();
    return positionFiltered.filter(
      (b) => b.customerName.toLowerCase().includes(q) || b.customerPhone.toLowerCase().includes(q)
    );
  }, [bookings, position, search]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-semibold text-gray-800 dark:text-white">Position {position} — Booking Records</h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or phone..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
              <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Client</th>
              <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Phone</th>
              <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Event Type</th>
              <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Event Date</th>
              <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Shift</th>
              <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Total</th>
              <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Advance</th>
              <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Balance</th>
              <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-8 text-center text-gray-400 dark:text-gray-600">
                  No bookings found for Position {position}.
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b._id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium text-gray-800 dark:text-white">{b.customerName}</td>
                  <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-gray-500 dark:text-gray-400">{b.customerPhone}</td>
                  <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-gray-500 dark:text-gray-400">{b.eventType || '—'}</td>
                  <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-gray-500 dark:text-gray-400">{formatDate(b.eventDate)}</td>
                  <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      {b.eventShift === 'Night' ? <Moon size={13} /> : <Sun size={13} />}
                      {b.eventShift || '—'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-gray-700 dark:text-gray-300">{formatCurrency(b.totalAmount)}</td>
                  <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-gray-700 dark:text-gray-300">{formatCurrency(b.advancePaid)}</td>
                  <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-gray-700 dark:text-gray-300">{formatCurrency(b.balanceDue)}</td>
                  <td className="px-3 sm:px-5 py-2.5 sm:py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[b.paymentStatus] || ''}`}>
                      {b.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Expense Tracker Tab
// ============================================================================
function ExpenseTracker({ expenses, onCreated }) {
  const [form, setForm] = useState({ expenseType: 'Electricity', date: '', amount: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.amount || !form.date) {
      setError('Please provide a date and amount.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) })
      });
      const data = await res.json();
      if (data.success) {
        setForm({ expenseType: 'Electricity', date: '', amount: '', notes: '' });
        onCreated();
      } else {
        setError(data.message || 'Failed to add expense.');
      }
    } catch (err) {
      setError('Could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 sm:p-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Log New Expense</h3>

          {error && (
            <div className="mb-4 flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm px-4 py-3 rounded-xl">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Expense Type</label>
              <select
                value={form.expenseType}
                onChange={(e) => handleChange('expenseType', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                <option>Electricity</option>
                <option>Water</option>
                <option>Maintenance</option>
                <option>Salaries</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Amount</label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                placeholder="Optional notes..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              {submitting ? 'Saving...' : 'Add Expense'}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-800 dark:text-white">Expense History</h3>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-gray-900">
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
                  <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Type</th>
                  <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Date</th>
                  <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Amount</th>
                  <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-400 dark:text-gray-600">
                      No expenses logged yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp._id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium text-gray-800 dark:text-white">{exp.expenseType}</td>
                      <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-gray-500 dark:text-gray-400">{formatDate(exp.date)}</td>
                      <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-gray-700 dark:text-gray-300">{formatCurrency(exp.amount)}</td>
                      <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">{exp.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Dashboard Overview Tab
// ============================================================================
function DashboardOverview({ stats, bookings, onBookNow }) {
  const bookedToday = stats?.bookedToday || { A: false, B: false, C: false };

  const dueSoon = useMemo(() => {
    return bookings
      .filter((b) => b.balanceDue > 0)
      .map((b) => ({ ...b, _daysLeft: daysUntil(b.eventDate) }))
      .filter((b) => b._daysLeft >= 0 && b._daysLeft <= 7)
      .sort((a, b) => a._daysLeft - b._daysLeft);
  }, [bookings]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Income"
          value={formatCurrency(stats?.monthlyRevenue)}
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          accent="bg-emerald-100 dark:bg-emerald-500/20"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(stats?.totalMonthlyExpenses)}
          icon={<TrendingDown size={18} className="text-rose-600" />}
          accent="bg-rose-100 dark:bg-rose-500/20"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(stats?.totalOutstandingBalance)}
          icon={<AlertCircle size={18} className="text-amber-600" />}
          accent="bg-amber-100 dark:bg-amber-500/20"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(stats?.netProfit)}
          icon={<DollarSign size={18} className="text-indigo-600" />}
          accent="bg-indigo-100 dark:bg-indigo-500/20"
        />
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Today's Availability Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <PositionAvailabilityCard position="A" isBooked={bookedToday.A} onBookNow={onBookNow} />
          <PositionAvailabilityCard position="B" isBooked={bookedToday.B} onBookNow={onBookNow} />
          <PositionAvailabilityCard position="C" isBooked={bookedToday.C} onBookNow={onBookNow} />
        </div>
      </div>

      {dueSoon.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-amber-200 dark:border-amber-500/20 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-amber-100 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/10 flex items-center gap-2">
            <BellRing size={17} className="text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Pending Balances — Event Coming Soon</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {dueSoon.map((b) => (
              <div key={b._id} className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 dark:text-white truncate">{b.customerName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Position {b.hallPosition} • {formatDate(b.eventDate)} •{' '}
                    {b._daysLeft === 0 ? 'Today' : `${b._daysLeft} day${b._daysLeft === 1 ? '' : 's'} left`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                    {formatCurrency(b.balanceDue)}
                  </span>
                  <a
                    href={`tel:${b.customerPhone}`}
                    className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Call customer"
                  >
                    <Phone size={15} className="text-gray-600 dark:text-gray-300" />
                  </a>
                  <a
                    href={waLink(b.customerPhone, `Hi ${b.customerName}, a friendly reminder that ${formatCurrency(b.balanceDue)} is still due for your event on ${formatDate(b.eventDate)} at PIB Wedding Hall.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                    title="WhatsApp reminder"
                  >
                    <MessageCircle size={15} className="text-emerald-600 dark:text-emerald-400" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-800 dark:text-white">Recent Bookings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
                <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Client</th>
                <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Position</th>
                <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Event Date</th>
                <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Balance</th>
                <th className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 6).map((b) => (
                <tr key={b._id} className="border-b border-gray-50 dark:border-gray-800/60">
                  <td className="px-3 sm:px-5 py-2.5 sm:py-3 font-medium text-gray-800 dark:text-white">{b.customerName}</td>
                  <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-gray-500 dark:text-gray-400">Position {b.hallPosition}</td>
                  <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-gray-500 dark:text-gray-400">{formatDate(b.eventDate)}</td>
                  <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-gray-700 dark:text-gray-300">{formatCurrency(b.balanceDue)}</td>
                  <td className="px-3 sm:px-5 py-2.5 sm:py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[b.paymentStatus] || ''}`}>
                      {b.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400 dark:text-gray-600">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Reports & Analytics Tab
// ============================================================================
function ReportsView() {
  const now = new Date();
  const [period, setPeriod] = useState('monthly');
  const [day, setDay] = useState(now.toISOString().slice(0, 10));
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [chartData, setChartData] = useState([]);
  const [chartYear, setChartYear] = useState(now.getFullYear());
  const [chartLoading, setChartLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (period === 'daily') params.set('day', day);
      if (period === 'monthly') { params.set('month', month); params.set('year', year); }
      if (period === 'yearly') params.set('year', year);

      const res = await fetch(`${API_BASE}/analytics/summary?${params.toString()}`);
      const data = await res.json();
      if (data.success) setSummary(data.data);
    } catch (err) {
      console.error('Failed to fetch analytics summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [period, day, month, year]);

  const fetchYearlyChart = useCallback(async () => {
    setChartLoading(true);
    try {
      const res = await fetch(`${API_BASE}/analytics/yearly-chart?year=${chartYear}`);
      const data = await res.json();
      if (data.success) setChartData(data.data.monthly);
    } catch (err) {
      console.error('Failed to fetch yearly chart data:', err);
    } finally {
      setChartLoading(false);
    }
  }, [chartYear]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchYearlyChart(); }, [fetchYearlyChart]);

  const yearOptions = useMemo(() => {
    const y = now.getFullYear();
    return [y - 2, y - 1, y, y + 1];
  }, []);

  return (
    <div className="space-y-6">
      {/* Period selector + summary */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="font-semibold text-gray-800 dark:text-white">Profit / Loss Report</h3>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
            {['daily', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold capitalize transition-colors ${
                  period === p
                    ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          {period === 'daily' && (
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          )}
          {period === 'monthly' && (
            <>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </>
          )}
          {period === 'yearly' && (
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>

        {summaryLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-rose-500" size={26} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Revenue"
              value={formatCurrency(summary?.revenue)}
              icon={<TrendingUp size={18} className="text-emerald-600" />}
              accent="bg-emerald-100 dark:bg-emerald-500/20"
            />
            <StatCard
              title="Expenses"
              value={formatCurrency(summary?.expenses)}
              icon={<TrendingDown size={18} className="text-rose-600" />}
              accent="bg-rose-100 dark:bg-rose-500/20"
            />
            <StatCard
              title={summary?.profit >= 0 ? 'Net Profit' : 'Net Loss'}
              value={formatCurrency(summary?.profit)}
              icon={<DollarSign size={18} className={summary?.profit >= 0 ? 'text-indigo-600' : 'text-rose-600'} />}
              accent={summary?.profit >= 0 ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'bg-rose-100 dark:bg-rose-500/20'}
            />
          </div>
        )}
      </div>

      {/* Yearly chart */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="font-semibold text-gray-800 dark:text-white">Yearly Analytics — Revenue vs Expenses</h3>
          <select
            value={chartYear}
            onChange={(e) => setChartYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {chartLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-rose-500" size={26} />
          </div>
        ) : (
          <>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-gray-800" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full h-56 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-gray-800" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              Tip: PIB Hall bookings usually peak in wedding season (Oct–Mar) — watch this chart to plan staffing and expenses ahead of time.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main App
// ============================================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState('A');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, expensesRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/bookings`).then((r) => r.json()),
        fetch(`${API_BASE}/expenses`).then((r) => r.json()),
        fetch(`${API_BASE}/dashboard-stats`).then((r) => r.json())
      ]);
      if (bookingsRes.success) setBookings(bookingsRes.data);
      if (expensesRes.success) setExpenses(expensesRes.data);
      if (statsRes.success) setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchAll();
  }, [user, fetchAll]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const openBookingModal = (position) => {
    setModalPosition(position || 'A');
    setModalOpen(true);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'A', label: 'Position A', icon: Building2 },
    { id: 'B', label: 'Position B', icon: Building2 },
    { id: 'C', label: 'Position C', icon: Building2 },
    { id: 'expenses', label: 'Expense Tracker', icon: Wallet },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 }
  ];

  if (!user) {
    return <LoginScreen onLogin={setUser} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="flex">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`w-64 min-h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col fixed z-50 transform transition-transform duration-300 md:translate-x-0 md:z-30 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="px-6 py-6 flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-sm p-1">
                <img src="/logo.png" alt="PIB Wedding Hall logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-white text-sm leading-tight">PIB Hall</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Management</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors md:hidden"
            >
              <X size={18} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/30'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="px-3 py-5 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setUser(null)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={17} />
              Log Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 w-full md:ml-64">
          {/* Top header */}
          <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between gap-3 sticky top-0 z-30">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors md:hidden shrink-0"
              >
                <Menu size={18} className="text-gray-600 dark:text-gray-300" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white truncate">
                  {navItems.find((n) => n.id === activeTab)?.label}
                </h1>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => openBookingModal('A')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-sm font-semibold shadow-md shadow-rose-500/30 hover:opacity-90 transition-all"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">New Booking</span>
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {darkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-gray-600" />}
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 sm:p-6 md:p-8">
            {loading && !stats ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="animate-spin text-rose-500" size={32} />
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardOverview stats={stats} bookings={bookings} onBookNow={openBookingModal} />
                )}
                {['A', 'B', 'C'].includes(activeTab) && (
                  <BookingsTable bookings={bookings} position={activeTab} />
                )}
                {activeTab === 'expenses' && (
                  <ExpenseTracker expenses={expenses} onCreated={fetchAll} />
                )}
                {activeTab === 'reports' && <ReportsView />}
              </>
            )}
          </main>
        </div>
      </div>

      <NewBookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchAll}
        defaultPosition={modalPosition}
      />
    </div>
  );
}
