import { FormEvent, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { useUserMode } from './UserModeContext';
import { supabase } from '../../../utils/supabase/client';
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  ClipboardList,
  Plus,
  Package,
  User,
  MessageCircle,
  LogOut,
  Sun,
  Moon,
  Shield,
  X,
  Menu,
  Phone,
  Store,
  KeyRound,
  MapPin,
  Check,
  Loader2,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CAMPUSES = ['Ketintang', 'Lidah Wetan', 'Magetan'] as const;

// ── Shared class helpers ──────────────────────────────────────────────────────

// Text/element that fades in when sidebar expands on desktop
const fadeOnExpand =
  'opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-200 lg:delay-75 lg:group-hover/sidebar:delay-0';

// ─────────────────────────────────────────────────────────────────────────────

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, signOut, refreshProfile } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { mode, setMode } = useUserMode();
  const location = useLocation();
  const navigate = useNavigate();

  // ── Seller listing count ──────────────────────────────────────────────────
  const [listingCount, setListingCount] = useState(0);

  useEffect(() => {
    if (!user || mode !== 'seller') return;
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .then(({ count, error }) => {
        if (!error && count !== null) setListingCount(count);
      });
  }, [user?.id, mode]);

  // ── Account settings modal ────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSaving, setPassSaving] = useState(false);
  const [passDone, setPassDone] = useState(false);
  const [campus, setCampus] = useState(user?.campus ?? 'Ketintang');
  const [campusSaving, setCampusSaving] = useState(false);
  const [campusDone, setCampusDone] = useState(false);

  useEffect(() => {
    if (user?.campus) setCampus(user.campus);
  }, [user?.campus]);

  const openModal = () => {
    setPassError(''); setPassDone(false); setNewPass(''); setConfirmPass('');
    setCampusDone(false);
    setModalOpen(true);
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPassError('');
    if (newPass.length < 6) {
      setPassError(language === 'en' ? 'Min. 6 characters' : 'Minimal 6 karakter');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError(language === 'en' ? 'Passwords do not match' : 'Password tidak cocok');
      return;
    }
    setPassSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setPassSaving(false);
    if (error) {
      setPassError(error.message);
    } else {
      setPassDone(true);
      setNewPass(''); setConfirmPass('');
    }
  };

  const handleChangeCampus = async () => {
    if (!user || campus === user.campus) return;
    setCampusSaving(true);
    const { error } = await supabase.from('profiles').update({ campus }).eq('id', user.id);
    setCampusSaving(false);
    if (!error) { await refreshProfile(); setCampusDone(true); }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate('/', { replace: true });
  };

  const isActive = (path: string) => location.pathname === path;

  const buyerItems = user
    ? [
        { icon: Home,          label: language === 'en' ? 'Browse'           : 'Beranda',         path: '/home' },
        { icon: MessageCircle, label: language === 'en' ? 'Messages'         : 'Pesan',           path: '/conversations' },
        { icon: ShoppingCart,  label: language === 'en' ? 'Cart'             : 'Keranjang',        path: '/cart' },
        { icon: ClipboardList, label: language === 'en' ? 'Purchase History' : 'Riwayat Belanja',  path: '/orders' },
      ]
    : [
        { icon: Home,        label: language === 'en' ? 'Home'   : 'Beranda', path: '/' },
        { icon: User,        label: t('nav.login'),                             path: '/login' },
        { icon: ShoppingBag, label: t('nav.signup'),                            path: '/signup' },
      ];

  const sellerItems = [
    { icon: Package,       label: language === 'en' ? 'My Listings' : 'Listing Saya', path: '/my-listings' },
    { icon: MessageCircle, label: language === 'en' ? 'Messages'    : 'Pesan',         path: '/conversations' },
    { icon: Shield,        label: language === 'en' ? 'Admin'       : 'Admin',         path: '/admin' },
  ];

  const navItems = user && mode === 'seller' ? sellerItems : buyerItems;

  return (
    <>
      {/* ── Mobile backdrop — klik untuk tutup sidebar ── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SIDEBAR
          Mobile  : fixed overlay, toggle dengan isOpen, w-64
          Desktop : static dalam flex, w-16 (collapsed) → hover → w-64
      ══════════════════════════════════════════════════════════════════════ */}
      <aside
        className={`
          group/sidebar
          fixed lg:static
          inset-y-0 left-0
          h-screen
          z-50 lg:z-auto
          flex flex-col shrink-0
          bg-card border-r border-border
          overflow-hidden
          shadow-2xl lg:shadow-none
          transition-all duration-300 ease-in-out
          w-64 lg:w-16 lg:hover:w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">

          {/* ── Header: logo + tombol tutup (mobile only) ── */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-border shrink-0 min-h-[52px]">
            <Link
              to={user ? '/home' : '/'}
              onClick={onClose}
              className="flex items-center gap-2 overflow-hidden"
            >
              <ShoppingBag className="size-5 text-primary shrink-0" />
              <span className={`text-base font-bold text-primary tracking-tight whitespace-nowrap ${fadeOnExpand}`}>
                KlikNesa
              </span>
            </Link>
            {/* Tombol X — hanya di mobile */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-accent transition-colors lg:hidden shrink-0"
              aria-label="Tutup menu"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* ── Profil / guest ── */}
          <div className="px-2 py-2 border-b border-border shrink-0">
            {user ? (
              <>
                {/* Card profil */}
                <button
                  onClick={openModal}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-accent/60 transition-all text-left"
                  title={language === 'en' ? 'Account Settings' : 'Pengaturan Akun'}
                >
                  <div className="size-8 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shrink-0">
                    <User className="size-4 text-primary-foreground" />
                  </div>
                  <div className={`flex-1 min-w-0 ${fadeOnExpand}`}>
                    <p className="text-sm font-semibold text-foreground truncate whitespace-nowrap leading-tight">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate whitespace-nowrap leading-tight">
                      {user.campus}
                    </p>
                  </div>
                  <span className={`text-xs text-muted-foreground shrink-0 ${fadeOnExpand}`}>⚙</span>
                </button>

                {/* Mode switch — disembunyikan di desktop collapsed, tampil saat hover */}
                <div className={`
                  mt-2 rounded-lg overflow-hidden border border-border
                  flex lg:hidden lg:group-hover/sidebar:flex
                `}>
                  <button
                    onClick={() => { setMode('buyer'); navigate('/home'); }}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium transition-colors ${
                      mode === 'buyer' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <ShoppingCart className="size-3 shrink-0" />
                    <span className="whitespace-nowrap">{language === 'en' ? 'Buyer' : 'Pembeli'}</span>
                  </button>
                  <button
                    onClick={() => { setMode('seller'); navigate('/home'); }}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium transition-colors ${
                      mode === 'seller' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <Store className="size-3 shrink-0" />
                    <span className="whitespace-nowrap">{language === 'en' ? 'Seller' : 'Penjual'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className={`flex gap-2 ${fadeOnExpand}`}>
                <Link to="/login" onClick={onClose} className="flex-1 py-1.5 text-center rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary/10 transition-colors whitespace-nowrap">
                  {t('nav.login')}
                </Link>
                <Link to="/signup" onClick={onClose} className="flex-1 py-1.5 text-center rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">
                  {t('nav.signup')}
                </Link>
              </div>
            )}
          </div>

          {/* ── Navigasi ── */}
          <nav className="flex-1 px-2 py-2 flex flex-col gap-0.5 min-h-0 overflow-hidden">

            {/* Statistik penjual — hanya saat seller mode, disembunyikan collapsed */}
            {user && mode === 'seller' && (
              <>
                <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted/40 p-2 mb-2 text-center lg:hidden lg:group-hover/sidebar:grid">
                  <div>
                    <p className="text-sm font-bold text-foreground">{listingCount}</p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">{language === 'en' ? 'Listings' : 'Listing'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{user.transactionCount}</p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">{language === 'en' ? 'Trx' : 'Transaksi'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Rp–</p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">{language === 'en' ? 'Revenue' : 'Pendapatan'}</p>
                  </div>
                </div>

                {/* CTA Jual Barang — ikon saja saat collapsed, teks saat hover */}
                <Link
                  to="/create-listing"
                  onClick={onClose}
                  className="flex items-center h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors mb-2"
                  title={language === 'en' ? 'Sell Item' : 'Jual Barang'}
                >
                  <div className="w-10 h-9 flex items-center justify-center shrink-0 ml-1">
                    <Plus className="size-4" />
                  </div>
                  <span className={`whitespace-nowrap ml-1 pr-3 ${fadeOnExpand}`}>
                    {language === 'en' ? 'Sell Item' : 'Jual Barang'}
                  </span>
                </Link>
              </>
            )}

            {/* Label seksi — disembunyikan saat collapsed */}
            <p className={`px-1 mb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap ${fadeOnExpand}`}>
              {language === 'en' ? 'Navigation' : 'Navigasi'}
            </p>

            {/* Nav items */}
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                title={item.label}
                className={`flex items-center h-10 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0 ml-1">
                  <item.icon className="size-5" />
                </div>
                <span className={`text-sm font-medium whitespace-nowrap ml-2 ${fadeOnExpand}`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* ── Settings bawah ── */}
          <div className="px-2 py-2 border-t border-border flex flex-col gap-1 shrink-0">

            {/* Baris: tema + bahasa */}
            <div className="flex items-center mb-0.5 overflow-hidden">
              <div className="w-10 h-10 flex items-center justify-center shrink-0 ml-1">
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-md hover:bg-accent transition-colors"
                  aria-label={theme === 'light' ? 'Mode gelap' : 'Mode terang'}
                  title={theme === 'light' ? 'Dark mode' : 'Light mode'}
                >
                  {theme === 'light'
                    ? <Moon className="size-4 text-foreground" />
                    : <Sun className="size-4 text-foreground" />}
                </button>
              </div>
              <div className={`flex-1 overflow-hidden ml-2 pr-2 ${fadeOnExpand}`}>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'id' | 'en')}
                  className="w-full text-xs bg-muted/50 border border-border rounded-md px-2 py-1.5 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                  <option value="id">🇮🇩 Indonesia</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>
            </div>

            {/* Hubungi Kami */}
            <Link
              to="/contact"
              onClick={onClose}
              title={language === 'en' ? 'Contact Us' : 'Hubungi Kami'}
              className="flex items-center h-10 rounded-lg text-sm text-foreground hover:bg-accent transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0 ml-1">
                <Phone className="size-4 text-primary" />
              </div>
              <span className={`whitespace-nowrap ml-2 ${fadeOnExpand}`}>
                {language === 'en' ? 'Contact Us' : 'Hubungi Kami'}
              </span>
            </Link>

            {/* Sign out */}
            {user && (
              <button
                onClick={handleSignOut}
                title={t('nav.signOut')}
                className="flex items-center h-10 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0 ml-1">
                  <LogOut className="size-4" />
                </div>
                <span className={`whitespace-nowrap ml-2 ${fadeOnExpand}`}>
                  {t('nav.signOut')}
                </span>
              </button>
            )}
          </div>

        </div>
      </aside>

      {/* ── Account Settings Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-bold text-foreground">
                {language === 'en' ? 'Account Settings' : 'Pengaturan Akun'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-md hover:bg-accent transition-colors">
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Ganti Password */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <KeyRound className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {language === 'en' ? 'Change Password' : 'Ganti Password'}
                  </h3>
                </div>
                <form onSubmit={handleChangePassword} className="space-y-2">
                  <input
                    type="password"
                    placeholder={language === 'en' ? 'New password' : 'Password baru'}
                    value={newPass}
                    onChange={(e) => { setNewPass(e.target.value); setPassDone(false); setPassError(''); }}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="password"
                    placeholder={language === 'en' ? 'Confirm password' : 'Konfirmasi password'}
                    value={confirmPass}
                    onChange={(e) => { setConfirmPass(e.target.value); setPassDone(false); setPassError(''); }}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {passError && <p className="text-xs text-destructive">{passError}</p>}
                  {passDone && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="size-3" />
                      {language === 'en' ? 'Password updated!' : 'Password berhasil diubah!'}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={passSaving || !newPass}
                    className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {passSaving && <Loader2 className="size-3.5 animate-spin" />}
                    {language === 'en' ? 'Save Password' : 'Simpan Password'}
                  </button>
                </form>
              </section>

              <div className="border-t border-border" />

              {/* Ganti Kampus */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {language === 'en' ? 'Campus' : 'Kampus'}
                  </h3>
                </div>
                <div className="space-y-2">
                  <select
                    value={campus}
                    onChange={(e) => { setCampus(e.target.value); setCampusDone(false); }}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                  >
                    {CAMPUSES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {campusDone && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="size-3" />
                      {language === 'en' ? 'Campus updated!' : 'Kampus berhasil diperbarui!'}
                    </p>
                  )}
                  <button
                    onClick={handleChangeCampus}
                    disabled={campusSaving || campus === user?.campus}
                    className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {campusSaving && <Loader2 className="size-3.5 animate-spin" />}
                    {language === 'en' ? 'Save Campus' : 'Simpan Kampus'}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-accent transition-colors"
      aria-label="Buka menu"
    >
      <Menu className="size-5" />
    </button>
  );
}
