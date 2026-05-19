import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { supabase } from '../../../utils/supabase/client';
import {
  ArrowLeft, User, Camera, Lock, MapPin, LogOut,
  Check, Loader2, AlertCircle,
} from 'lucide-react';
import Layout from './Layout';

const CAMPUSES = ['Ketintang', 'Lidah Wetan', 'Magetan'] as const;

export default function ProfileSettings() {
  const { user, signOut, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Avatar ─────────────────────────────────────────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // ── Username ────────────────────────────────────────────────────────────────
  const [username, setUsername] = useState(user?.name ?? '');
  const [usernameLastChanged, setUsernameLastChanged] = useState<string | null>(null);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // ── Campus ──────────────────────────────────────────────────────────────────
  const [campus, setCampus] = useState(user?.campus ?? 'Ketintang');
  const [campusSaving, setCampusSaving] = useState(false);
  const [campusSuccess, setCampusSuccess] = useState(false);

  // ── Password ────────────────────────────────────────────────────────────────
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passSaving, setPassSaving] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState('');

  // ── Sign out ────────────────────────────────────────────────────────────────
  const [signingOut, setSigningOut] = useState(false);

  // Load profile data including new columns
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('avatar_url, username_last_changed, name, campus')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setAvatarUrl(data.avatar_url ?? null);
        setUsernameLastChanged(data.username_last_changed ?? null);
        setUsername(data.name ?? '');
        setCampus(data.campus ?? 'Ketintang');
      });
  }, [user?.id]);

  // Returns remaining cooldown days, or null if allowed
  const usernameWaitDays = (() => {
    if (!usernameLastChanged) return null;
    const diff = Date.now() - new Date(usernameLastChanged).getTime();
    const remaining = 30 - Math.floor(diff / 86_400_000);
    return remaining > 0 ? remaining : null;
  })();
  const canChangeUsername = usernameWaitDays === null;

  // Initials fallback for avatar
  const initials = (user?.name ?? '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setAvatarError(language === 'en' ? 'Only JPG and PNG allowed.' : 'Hanya JPG dan PNG yang diperbolehkan.');
      return;
    }
    setAvatarError('');
    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);
      if (updateErr) throw updateErr;
      setAvatarUrl(urlData.publicUrl);
      await refreshProfile();
    } catch (err: any) {
      setAvatarError(err.message);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveUsername = async () => {
    if (!user || !canChangeUsername) return;
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameError(language === 'en' ? 'Username cannot be empty.' : 'Username tidak boleh kosong.');
      return;
    }
    setUsernameError('');
    setUsernameSaving(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('profiles')
      .update({ name: trimmed, username_last_changed: now })
      .eq('id', user.id);
    setUsernameSaving(false);
    if (error) {
      setUsernameError(error.message);
    } else {
      setUsernameLastChanged(now);
      setUsernameSuccess(true);
      await refreshProfile();
      setTimeout(() => setUsernameSuccess(false), 3000);
    }
  };

  const handleSaveCampus = async () => {
    if (!user) return;
    setCampusSaving(true);
    const { error } = await supabase.from('profiles').update({ campus }).eq('id', user.id);
    setCampusSaving(false);
    if (!error) {
      setCampusSuccess(true);
      await refreshProfile();
      setTimeout(() => setCampusSuccess(false), 3000);
    }
  };

  const handleSavePassword = async () => {
    setPassError('');
    if (newPass.length < 6) {
      setPassError(language === 'en' ? 'Minimum 6 characters.' : 'Minimal 6 karakter.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError(language === 'en' ? 'Passwords do not match.' : 'Password tidak cocok.');
      return;
    }
    setPassSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setPassSaving(false);
    if (error) {
      setPassError(error.message);
    } else {
      setPassSuccess(true);
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => setPassSuccess(false), 3000);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate('/login', { replace: true });
  };

  // ── Shared input class ───────────────────────────────────────────────────────
  const inputCls =
    'w-full px-4 py-2.5 rounded-lg bg-input-background border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200';
  const btnPrimary =
    'w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2';

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-xl">

          {/* Header */}
          <div className="flex items-center gap-4 mb-6 sm:mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {language === 'en' ? 'Profile Settings' : 'Pengaturan Profil'}
            </h1>
          </div>

          <div className="space-y-5">

            {/* ── 1. Foto Profil ─────────────────────────────────────────────── */}
            <div className="bg-card border-2 border-border rounded-xl p-5">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      className="size-24 rounded-full object-cover ring-4 ring-primary/20"
                    />
                  ) : (
                    <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20">
                      {initials ? (
                        <span className="text-2xl font-bold text-primary">{initials}</span>
                      ) : (
                        <User className="size-10 text-primary" />
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute bottom-0 right-0 size-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md disabled:opacity-60"
                    title={language === 'en' ? 'Change photo' : 'Ganti foto'}
                  >
                    {avatarUploading
                      ? <Loader2 className="size-4 animate-spin" />
                      : <Camera className="size-4" />}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <p className="text-sm text-muted-foreground text-center">
                  {language === 'en'
                    ? 'Tap the camera icon to upload a new photo (JPG / PNG)'
                    : 'Ketuk ikon kamera untuk mengunggah foto baru (JPG / PNG)'}
                </p>
                {avatarError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="size-4 shrink-0" /> {avatarError}
                  </p>
                )}
              </div>
            </div>

            {/* ── 2. Username ────────────────────────────────────────────────── */}
            <div className="bg-card border-2 border-border rounded-xl p-5">
              <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <User className="size-4 text-primary" />
                Username
              </h2>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameSuccess(false);
                  setUsernameError('');
                }}
                disabled={!canChangeUsername}
                className={`${inputCls} mb-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder={language === 'en' ? 'Your name' : 'Nama Anda'}
              />
              {!canChangeUsername && (
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                  <AlertCircle className="size-4 shrink-0" />
                  {language === 'en'
                    ? `You can change your username again in ${usernameWaitDays} day(s).`
                    : `Username bisa diganti lagi dalam ${usernameWaitDays} hari.`}
                </p>
              )}
              {usernameError && (
                <p className="text-sm text-destructive mb-2">{usernameError}</p>
              )}
              {usernameSuccess && (
                <p className="text-sm text-green-600 flex items-center gap-1 mb-2">
                  <Check className="size-4" />
                  {language === 'en' ? 'Username updated!' : 'Username berhasil diperbarui!'}
                </p>
              )}
              <button
                onClick={handleSaveUsername}
                disabled={!canChangeUsername || usernameSaving || username.trim() === user?.name}
                className={btnPrimary}
              >
                {usernameSaving && <Loader2 className="size-4 animate-spin" />}
                {language === 'en' ? 'Save Username' : 'Simpan Username'}
              </button>
            </div>

            {/* ── 3. Kampus ──────────────────────────────────────────────────── */}
            <div className="bg-card border-2 border-border rounded-xl p-5">
              <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                {language === 'en' ? 'Campus' : 'Kampus'}
              </h2>
              <select
                value={campus}
                onChange={(e) => { setCampus(e.target.value); setCampusSuccess(false); }}
                className={`${inputCls} mb-2`}
              >
                {CAMPUSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {campusSuccess && (
                <p className="text-sm text-green-600 flex items-center gap-1 mb-2">
                  <Check className="size-4" />
                  {language === 'en' ? 'Campus updated!' : 'Kampus berhasil diperbarui!'}
                </p>
              )}
              <button
                onClick={handleSaveCampus}
                disabled={campusSaving || campus === user?.campus}
                className={btnPrimary}
              >
                {campusSaving && <Loader2 className="size-4 animate-spin" />}
                {language === 'en' ? 'Save Campus' : 'Simpan Kampus'}
              </button>
            </div>

            {/* ── 4. Ganti Password ──────────────────────────────────────────── */}
            <div className="bg-card border-2 border-border rounded-xl p-5">
              <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Lock className="size-4 text-primary" />
                {language === 'en' ? 'Change Password' : 'Ganti Password'}
              </h2>
              <div className="space-y-2">
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => { setNewPass(e.target.value); setPassSuccess(false); setPassError(''); }}
                  className={inputCls}
                  placeholder={language === 'en' ? 'New password' : 'Password baru'}
                />
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => { setConfirmPass(e.target.value); setPassSuccess(false); setPassError(''); }}
                  className={inputCls}
                  placeholder={language === 'en' ? 'Confirm new password' : 'Konfirmasi password baru'}
                />
                {passError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="size-4 shrink-0" /> {passError}
                  </p>
                )}
                {passSuccess && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="size-4" />
                    {language === 'en' ? 'Password updated!' : 'Password berhasil diubah!'}
                  </p>
                )}
                <button
                  onClick={handleSavePassword}
                  disabled={passSaving || !newPass}
                  className={btnPrimary}
                >
                  {passSaving && <Loader2 className="size-4 animate-spin" />}
                  {language === 'en' ? 'Save Password' : 'Simpan Password'}
                </button>
              </div>
            </div>

            {/* ── 5. Sign Out ────────────────────────────────────────────────── */}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full py-3.5 rounded-xl bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
            >
              {signingOut
                ? <Loader2 className="size-5 animate-spin" />
                : <LogOut className="size-5" />}
              {language === 'en' ? 'Sign Out' : 'Keluar dari Akun'}
            </button>

          </div>
        </div>
      </div>
    </Layout>
  );
}
