import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabase/client';

interface User {
  id: string;
  email: string;
  name: string;
  campus: string;
  verified: boolean;
  rating: number;
  transactionCount: number;
  trustBadge: boolean;
}

interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  signUp: (email: string, password: string, name: string, campus: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Ambil profil dari tabel `profiles`.
  // fallbackUser = objek dari sesi Auth — dipakai jika tabel profiles kosong/error,
  // sehingga tidak perlu network call tambahan ke getUser().
  const fetchProfile = async (userId: string, fallbackUser?: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Auth] Gagal membaca tabel profiles:', error.message, '| code:', error.code);
      }

      if (data) {
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          campus: data.campus,
          verified: data.verified,
          rating: Number(data.rating),
          transactionCount: data.transaction_count,
          trustBadge: data.trust_badge,
        });
        return;
      }

      // Fallback darurat: gunakan metadata sesi yang sudah ada di memori — tanpa network call.
      console.warn('[Auth] Fallback ke user_metadata karena profil tidak ditemukan');
      const meta = fallbackUser?.user_metadata ?? {};
      setUser({
        id: userId,
        email: fallbackUser?.email ?? '',
        name: meta.name ?? '',
        campus: meta.campus ?? '',
        verified: false,
        rating: 0,
        transactionCount: 0,
        trustBadge: false,
      });
    } catch (err) {
      console.error('[Auth] fetchProfile exception:', err);
      // Fallback minimal agar app tidak menggantung
      if (fallbackUser) {
        const meta = fallbackUser?.user_metadata ?? {};
        setUser({
          id: userId,
          email: fallbackUser?.email ?? '',
          name: meta.name ?? '',
          campus: meta.campus ?? '',
          verified: false,
          rating: 0,
          transactionCount: 0,
          trustBadge: false,
        });
      }
    }
  };

  useEffect(() => {
    // onAuthStateChange adalah sumber kebenaran utama.
    // INITIAL_SESSION menggantikan kebutuhan getSession() — callback ini selalu dipanggil
    // segera saat ada sesi di localStorage, sehingga loading dapat diselesaikan lebih cepat.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Tandai auth sudah diketahui SEBELUM fetchProfile — ini yang menghilangkan infinite loading.
      // Profile akan di-load di background tanpa memblokir render halaman.
      setSession(session);
      setLoading(false);

      if (session?.user?.id) {
        // Jalankan tanpa await agar tidak memblokir. fetchProfile sudah punya try/catch internal.
        fetchProfile(session.user.id, session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, campus: string) => {
    // Validasi domain email UNESA
    if (!email.endsWith('@mhs.unesa.ac.id') && !email.endsWith('@unesa.ac.id')) {
      throw new Error('Email harus menggunakan domain UNESA (@mhs.unesa.ac.id atau @unesa.ac.id)');
    }

    // Daftar via Supabase Auth — name & campus disimpan di user_metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, campus },
      },
    });

    if (error) throw error;

    // Cadangan: upsert profil jika trigger belum terpasang.
    // ignoreDuplicates mencegah error jika trigger sudah membuatnya lebih dulu.
    if (data.user) {
      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          email,
          name,
          campus,
          verified: false,
          rating: 0,
          transaction_count: 0,
          trust_badge: false,
        },
        { onConflict: 'id', ignoreDuplicates: true },
      );
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await fetchProfile(data.user.id, data.user);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await fetchProfile(authUser.id, authUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
