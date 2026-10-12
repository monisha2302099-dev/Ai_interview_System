import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame, Star, BarChart3, CalendarDays, Check, Circle, Code2, Users, FileText,
  ArrowRight, TrendingDown, TrendingUp, User, LogOut, ChevronDown, Bot, Monitor,
  Sparkles,
} from 'lucide-react';
import { supabase } from './supabaseClient';
import {
  getProfile, getScoreStats, getStreakData, getWeekDays, toISO,
} from './api';
import ProfileModal from './ProfileModal';
import './dashboard.css';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MODES = [
  { key: 'technical', title: 'Technical Interview', path: '/interview/technical', icon: Code2, accent: 'blue',
    text: 'Practice subject-wise technical questions and get AI feedback.', art: Monitor },
  { key: 'general', title: 'General Interview', path: '/interview/general', icon: Users, accent: 'purple',
    text: 'Improve your communication and problem-solving skills.', art: Users },
  { key: 'resume', title: 'Resume Checker', path: '/resume-checker', icon: FileText, accent: 'green',
    text: 'Get instant feedback on your resume and improve your profile.', art: FileText },
];

export default function Dashboard({ session }) {
  const navigate = useNavigate();
  const user = session.user;

  const [profile, setProfile] = useState(null);
  const [activeDates, setActiveDates] = useState(() => new Set());
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({ average: 0, change: null, count: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [error, setError] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      getProfile(user.id),
      getStreakData(user.id),
      getScoreStats(user.id),
    ]).then(([profileResult, streakResult, scoreResult]) => {
      if (cancelled) return;

      const errors = [];
      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value);
      } else {
        errors.push(profileResult.reason.message);
      }
      if (streakResult.status === 'fulfilled') {
        setActiveDates(streakResult.value.activeDates);
        setStreak(streakResult.value.currentStreak);
      } else {
        errors.push(streakResult.reason.message);
      }
      if (scoreResult.status === 'fulfilled') {
        setStats(scoreResult.value);
      } else {
        errors.push(scoreResult.reason.message);
      }
      setError(errors.join(' '));
    });

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  /* Close dropdown on outside click */
  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const logout = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      return;
    }
    navigate('/', { replace: true });
  };

  const firstName = (profile?.full_name || user.email?.split('@')[0] || 'there').split(' ')[0];
  const week = getWeekDays();
  const todayISO = toISO(new Date());

  const R = 62, C = 2 * Math.PI * R;
  const offset = C - (stats.average / 100) * C;

  return (
    <div className="pz-page min-h-screen text-slate-100">
      {/* ---------------- top bar ---------------- */}
      <header className="pz-nav">
        <div className="pz-brand">
          <span className="pz-brand-mark"><Sparkles size={19} /></span>
          <span className="pz-brand-copy">
            <strong>prepzio</strong>
            <small>AI interview practice</small>
          </span>
        </div>

        <div className="pz-right" ref={menuRef}>
          <button className="pz-avatar-btn" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen}>
            <span className="pz-avatar"><User size={20} /></span>
            <ChevronDown size={14} />
          </button>

          {menuOpen && (
            <div className="pz-menu" role="menu">
              <button role="menuitem" onClick={() => { setMenuOpen(false); setProfileOpen(true); }}>
                <User size={16} /> Profile Details
              </button>
              <button role="menuitem" onClick={logout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="pz-main mx-auto w-full max-w-6xl">
        <h1>Welcome Back, {firstName}!</h1>
        <p className="pz-sub">Keep going! You're one step closer to your goals.</p>
        {error && <p className="pz-error">{error}</p>}

        {/* ---------------- streak + score ---------------- */}
        <section className="pz-row">
          <div className="pz-card pz-streaks">
            <div className="pz-card-head">
              <h2><Flame className="orange" size={22} /> Your Streaks</h2>
              <span className="pz-chip"><CalendarDays size={14} /> Date-wise</span>
            </div>

            <div className="pz-days">
              {week.map((d, i) => {
                const iso = toISO(d);
                const done = activeDates.has(iso);
                return (
                  <div key={iso} className={`pz-day ${done ? 'done' : ''} ${iso === todayISO ? 'today' : ''}`}>
                    <span>{DAY_NAMES[i]}</span>
                    <b>{String(d.getDate()).padStart(2, '0')}</b>
                    {done ? <Check size={16} /> : <Circle size={14} />}
                  </div>
                );
              })}
            </div>

            <div className="pz-streak-foot">
              <span><Flame size={16} className="orange" /> <em>{streak} day streak!</em></span>
              <i>Keep it up!</i>
            </div>
          </div>

          <div className="pz-card pz-score">
            <div className="pz-card-head">
              <h2><Star className="pink" size={22} fill="currentColor" /> Overall Score</h2>
              <span className="pz-chip"><BarChart3 size={14} /> Average</span>
            </div>

            <div className="pz-score-body">
              <div className="pz-ring">
                <svg viewBox="0 0 150 150">
                  <defs>
                    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <circle cx="75" cy="75" r={R} className="ring-bg" />
                  <circle cx="75" cy="75" r={R} className="ring-fg" stroke="url(#ring)"
                    strokeDasharray={C} strokeDashoffset={offset} transform="rotate(-90 75 75)" />
                </svg>
                <span>{stats.count ? `${stats.average}%` : '—'}</span>
              </div>

              <div className="pz-score-text">
                <small>Your Average Score</small>
                <strong>{stats.count ? `${stats.average}%` : '—'}</strong>
                {stats.change !== null ? (
                  <p className={stats.change >= 0 ? 'up' : 'down'}>
                    {stats.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {stats.change >= 0 ? '+' : ''}{stats.change}%
                    <small>from last week</small>
                  </p>
                ) : (
                  <p className="muted"><small>{stats.count ? 'Not enough data for a weekly change' : 'Complete a practice to get scored'}</small></p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- practice modes ---------------- */}
        <h3 className="pz-section">Choose Your Practice Mode</h3>
        <p className="pz-sub tight">Select a section to start your preparation</p>

        <section className="pz-modes">
          {MODES.map(({ key, title, path, icon: Icon, accent, text, art: Art }) => (
            <button key={key} className={`pz-mode ${accent} rounded-2xl transition-all hover:-translate-y-1`} onClick={() => navigate(path)}>
              <div className="pz-mode-top">
                <span className="pz-ico"><Icon size={26} /></span>
                <h4>{title}</h4>
                <span className="pz-go"><ArrowRight size={18} /></span>
              </div>
              <p>{text}</p>
              <Art className="pz-art" size={84} strokeWidth={1.2} />
            </button>
          ))}
        </section>

        {/* ---------------- chatbot ---------------- */}
        <section className="pz-chatbot">
          <span className="pz-bot"><Bot size={42} /></span>
          <div>
            <h4>Chatbot</h4>
            <p>Ask questions, get instant answers, and learn at your own pace with our AI chatbot.</p>
          </div>
          <button className="pz-cta" onClick={() => navigate('/chatbot')}>
            Go to Chatbot <ArrowRight size={18} />
          </button>
        </section>
      </main>

      {profileOpen && (
        <ProfileModal
          user={user}
          profile={profile}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </div>
  );
}
