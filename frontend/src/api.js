import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function requestApi(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch (error) {
    throw new Error(`Cannot reach the backend. Start FastAPI on port 8000. ${error.message}`);
  }

  const body = await response.text();
  let payload;
  if (body.trim()) {
    try {
      payload = JSON.parse(body);
    } catch {
      throw new Error(`Backend returned an invalid response (HTTP ${response.status}).`);
    }
  }
  if (!response.ok) {
    throw new Error(payload?.detail || `Backend request failed with HTTP ${response.status}.`);
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('Backend returned an empty response.');
  }
  return payload;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name,email')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function getWeekDays(referenceDate = new Date()) {
  const monday = new Date(referenceDate);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
}

export function toISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function markTodayActive(userId) {
  const { error } = await supabase
    .from('practice_activity')
    .upsert(
      { user_id: userId, active_on: toISO(new Date()) },
      { onConflict: 'user_id,active_on', ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function getStreakData(userId) {
  const { data, error } = await supabase
    .from('practice_activity')
    .select('active_on')
    .eq('user_id', userId)
    .order('active_on', { ascending: false })
    .limit(365);
  if (error) throw error;

  const dates = new Set((data || []).map((row) => row.active_on));
  const weekStart = toISO(getWeekDays()[0]);
  const activeDates = new Set([...dates].filter((date) => date >= weekStart));
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!dates.has(toISO(cursor))) cursor.setDate(cursor.getDate() - 1);

  let currentStreak = 0;
  while (dates.has(toISO(cursor))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { activeDates, currentStreak };
}

export async function getScoreStats(userId) {
  const { data, error } = await supabase
    .from('practice_scores')
    .select('score,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;

  const scores = data || [];
  if (!scores.length) return { average: 0, change: null, count: 0 };

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const currentWeek = scores.filter((item) => {
    const age = now - Date.parse(item.created_at);
    return age >= 0 && age < 7 * oneDay;
  });
  const previousWeek = scores.filter((item) => {
    const age = now - Date.parse(item.created_at);
    return age >= 7 * oneDay && age < 14 * oneDay;
  });
  const mean = (items) => items.reduce((sum, item) => sum + Number(item.score), 0) / items.length;
  return {
    average: Math.round(mean(scores)),
    change: currentWeek.length && previousWeek.length
      ? Math.round(mean(currentWeek) - mean(previousWeek))
      : null,
    count: scores.length,
  };
}

export async function savePracticeScore(userId, mode, score) {
  const { error } = await supabase
    .from('practice_scores')
    .insert({ user_id: userId, mode, score });
  if (error) throw error;
}
