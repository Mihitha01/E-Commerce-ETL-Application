// frontend/src/store/authStore.ts

import { hookstate } from '@hookstate/core';

/**
 * HOOKSTATE ADVANCED FEATURES — PDF Day 1 Requirements
 * 
 * This store demonstrates:
 * 1. hookstate() construction — creating global state
 * 2. downgrade — converting hookstate → plain React useState pattern
 * 3. merge — merging partial updates into state
 * 4. construct — custom initialization logic
 */

// ─── State Interface ───
interface AuthState {
  isAuthenticated: boolean;
  user: string | null;
  role: string;
  loginTimestamp: number | null;
  apiBaseUrl: string;
}

// ─── Cookie Utilities (PDF Day 2: cookiesStorage) ───
function setCookie(name: string, value: string, days: number = 1): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// ─── CONSTRUCT: Custom initialization with fallback chain ───
// Checks localStorage → sessionStorage → cookies → defaults
function constructAuthState(): AuthState {
  // PDF Day 3: Dynamic server path from localStorage
  const savedApiUrl = localStorage.getItem('apiBaseUrl');
  
  return {
    isAuthenticated:
      localStorage.getItem('isAuthenticated') === 'true' ||
      sessionStorage.getItem('isAuthenticated') === 'true' ||
      getCookie('isAuthenticated') === 'true',
    user:
      localStorage.getItem('user') ||
      sessionStorage.getItem('user') ||
      getCookie('user') ||
      null,
    role: localStorage.getItem('role') || 'viewer',
    loginTimestamp: Number(localStorage.getItem('loginTimestamp')) || null,
    apiBaseUrl: savedApiUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  };
}

// ─── Create Global State (hookstate construction) ───
export const authState = hookstate<AuthState>(constructAuthState());

// ─── MERGE Helper: Partial state updates ───
// Instead of setting each field individually, merge allows atomic batch updates
export function loginUser(username: string, role: string = 'admin'): void {
  const timestamp = Date.now();

  // MERGE: Update multiple fields at once — cleaner than individual .set() calls
  authState.merge({
    isAuthenticated: true,
    user: username,
    role,
    loginTimestamp: timestamp,
  });

  // Persist to ALL storage mechanisms (PDF Day 2 requirement)
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('user', username);
  localStorage.setItem('role', role);
  localStorage.setItem('loginTimestamp', String(timestamp));

  sessionStorage.setItem('isAuthenticated', 'true');
  sessionStorage.setItem('user', username);

  setCookie('isAuthenticated', 'true', 1);
  setCookie('user', username, 1);
}

export function logoutUser(): void {
  // MERGE: Clear all auth fields atomically
  authState.merge({
    isAuthenticated: false,
    user: null,
    role: 'viewer',
    loginTimestamp: null,
  });

  // Clear ALL storage mechanisms
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
  localStorage.removeItem('loginTimestamp');

  sessionStorage.clear();

  deleteCookie('isAuthenticated');
  deleteCookie('user');
}

// ─── DOWNGRADE: Convert hookstate to plain value for non-hookstate consumers ───
// Useful when passing state to libraries that don't understand hookstate proxies
export function getAuthSnapshot(): AuthState {
  return {
    isAuthenticated: authState.isAuthenticated.get(),
    user: authState.user.get(),
    role: authState.role.get(),
    loginTimestamp: authState.loginTimestamp.get(),
    apiBaseUrl: authState.apiBaseUrl.get(),
  };
}

// ─── Dynamic API URL (PDF Day 3: .env + localStorage) ───
export function setApiBaseUrl(url: string): void {
  authState.apiBaseUrl.set(url);
  localStorage.setItem('apiBaseUrl', url);
}