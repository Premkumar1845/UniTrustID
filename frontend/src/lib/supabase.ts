/* ══════════════════════════════════════════════════
   Supabase Client — UniTrustID
   ══════════════════════════════════════════════════ */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pccaonyzepaxqkidyvkh.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjY2Fvbnl6ZXBheHFraWR5dmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDcyMzgsImV4cCI6MjA4ODA4MzIzOH0.CMLnAy-91DaXbiOEtig2zLjzTknZHJXpahNTbaNXgNc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ── Auth helpers ── */

/** Hash a password using Web Crypto (SHA-256) */
async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Generate a session token from wallet address + timestamp */
function generateToken(walletAddress: string): string {
  const payload = `${walletAddress}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  // Simple base64 token — in production use JWT
  return btoa(payload);
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  student_id: string;
  department: string;
  wallet_address: string;
  wallet_name: string;
  session_token: string;
  created_at: string;
  last_login: string;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  student_id: string;
  department: string;
  wallet_address: string;
  wallet_name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const AuthService = {
  /**
   * Create a new account — stores hashed password + wallet info in Supabase
   */
  async signUp(data: SignUpData): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email.toLowerCase())
        .maybeSingle();

      if (existing) {
        return { user: null, error: 'An account with this email already exists. Please login instead.' };
      }

      // Check if student ID already exists
      const { data: existingStu } = await supabase
        .from('users')
        .select('id')
        .eq('student_id', data.student_id)
        .maybeSingle();

      if (existingStu) {
        return { user: null, error: 'This Student ID is already registered.' };
      }

      const passwordHash = await hashPassword(data.password);
      const sessionToken = generateToken(data.wallet_address);

      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email: data.email.toLowerCase(),
          password_hash: passwordHash,
          full_name: data.full_name,
          student_id: data.student_id,
          department: data.department,
          wallet_address: data.wallet_address,
          wallet_name: data.wallet_name,
          session_token: sessionToken,
          last_login: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[UniTrustID] Supabase insert error:', error);
        return { user: null, error: error.message };
      }

      return { user: user as AuthUser, error: null };
    } catch (e: any) {
      console.error('[UniTrustID] SignUp error:', e);
      const msg = e.message || String(e);
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        return { user: null, error: 'Cannot reach database. Please ensure the "users" table exists in Supabase and your network is connected.' };
      }
      return { user: null, error: msg || 'Failed to create account' };
    }
  },

  /**
   * Login — verify credentials against Supabase, refresh session token from wallet
   */
  async login(
    data: LoginData,
    walletAddress: string,
    walletName: string
  ): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const passwordHash = await hashPassword(data.password);

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.email.toLowerCase())
        .eq('password_hash', passwordHash)
        .maybeSingle();

      if (error) {
        console.error('[UniTrustID] Supabase login error:', error);
        return { user: null, error: error.message };
      }

      if (!user) {
        return { user: null, error: 'Invalid email or password. Please check your credentials.' };
      }

      // Verify wallet matches the registered one
      if (user.wallet_address !== walletAddress) {
        return {
          user: null,
          error: 'Wallet address does not match the registered account. Connect the same wallet you used during sign-up.',
        };
      }

      // Generate new session token from wallet
      const sessionToken = generateToken(walletAddress);

      // Update session token and last login
      await supabase
        .from('users')
        .update({
          session_token: sessionToken,
          wallet_name: walletName,
          last_login: new Date().toISOString(),
        })
        .eq('id', user.id);

      return { user: { ...user, session_token: sessionToken } as AuthUser, error: null };
    } catch (e: any) {
      console.error('[UniTrustID] Login error:', e);
      const msg = e.message || String(e);
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        return { user: null, error: 'Cannot reach database. Please ensure the "users" table exists in Supabase and your network is connected.' };
      }
      return { user: null, error: msg || 'Login failed' };
    }
  },

  /**
   * Lookup stored user profile by wallet address (for returning sessions)
   */
  async getUserByWallet(walletAddress: string): Promise<AuthUser | null> {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();
    return data as AuthUser | null;
  },

  /**
   * Logout — clear session token
   */
  async logout(userId: string): Promise<void> {
    await supabase
      .from('users')
      .update({ session_token: null })
      .eq('id', userId);
  },
};

/* ── 24-Hour Session Persistence ── */

const SESSION_KEY = 'unitrustid-session';
const SESSION_EXPIRY_KEY = 'unitrustid-session-expiry';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface SessionData {
  user: AuthUser;
  profile: any; // DIDProfile
  credentials: any[]; // Credential[]
}

export const SessionManager = {
  /** Save authenticated user session with state to localStorage (valid for 24 hours) */
  save(data: SessionData): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    localStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION_MS));
  },

  /** Update cached profile and credentials */
  updateState(profile: any, credentials: any[]): void {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SessionData;
        parsed.profile = profile;
        parsed.credentials = credentials;
        localStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
      }
    } catch {}
  },

  /** Restore a valid (non-expired) session. Returns null if expired/missing. */
  restore(): SessionData | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
      if (!raw || !expiry) return null;
      if (Date.now() > Number(expiry)) {
        // Session expired — clean up
        this.clear();
        return null;
      }
      return JSON.parse(raw) as SessionData;
    } catch {
      this.clear();
      return null;
    }
  },

  /** Check if the current session is still valid */
  isValid(): boolean {
    const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
    return !!expiry && Date.now() < Number(expiry);
  },

  /** Get time remaining in ms */
  timeRemaining(): number {
    const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
    if (!expiry) return 0;
    return Math.max(0, Number(expiry) - Date.now());
  },

  /** Clear session (logout or expiry) */
  clear(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  },
};
