import { hookstate } from '@hookstate/core';

// We define the shape of our global state
interface AuthState {
  isAuthenticated: boolean;
  user: string | null;
}

// We initialize the global store, checking sessionStorage just in case they refresh the page
export const authState = hookstate<AuthState>({
  isAuthenticated: sessionStorage.getItem('isAuthenticated') === 'true',
  user: sessionStorage.getItem('user') || null,
});