import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { useUserMode } from './UserModeContext';
import { supabase } from '../../../utils/supabase/client';
import {
  ArrowLeft, Upload, Clock, Store, CheckCircle, AlertCircle, X, Phone, ShieldCheck,
} from 'lucide-react';
import Layout from './Layout';

export default function SellerVerification() {
  const { user, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const { setMode } = useUserMode();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ktmFile, setKtmFile] = useState<File | null>(null);
  const [ktmPreview, setKtmPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── WhatsApp OTP states ───────────────────────────────────────────────────
  const [waNumber, setWaNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [waVerified, setWaVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState(''); // format 62xxxxxxxxxx dari server
  const [otpError, setOtpError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const sellerStatus = user?.sellerStatus ?? 'unverified';

  useEffect(() => {
    if (sellerStatus === 'verified') {
      setMode('seller');
      navigate('/home', { replace: true });
    }
  }, [sellerStatus]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setError(language === 'en' ? 'Only JPG and PNG allowed.' : 'Hanya JPG dan PNG yang diperbolehkan.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(language === 'en' ? 'Maximum file size is 5MB.' : 'Ukuran file maksimal 5MB.');
      return;
    }
    setError('');
    setKtmFile(file);
    setKtmPreview(URL.createObjectURL(file));
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setKtmFile(null);
    setKtmPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendOTP = async () => {
    const cleaned = waNumber.replace(/\D/g, '');
    if (cleaned.length < 9 || cleaned.length > 13) {
      setOtpError(
        language === 'en'
          ? 'Enter a valid WhatsApp number (9–13 digits).'
          : 'Masukkan nomor WhatsApp yang valid (9–13 digit).',
      );
      return;
    }

    setSendingOtp(true);
    setOtpError('');
    setOtpInput('');

    // invoke('server', ...) → request ke root '/' function, bukan subpath.
    // Gateway Supabase hanya mengenal nama function 'server', subpath di nama
    // function menyebabkan gateway gagal merutekan sehingga CORS error.
    // Route OTP dikodekan di dalam body { route: '...' }.
    const { data, error } = await supabase.functions.invoke('server', {
      body: { route: 'send-otp', phone: waNumber },
    });

    setSendingOtp(false);

    if (error) {
      // FunctionsHttpError.context = body JSON yang dikembalikan server
      // Coba beberapa jalur untuk mendapat pesan yang bermakna:
      //   ctx.error   → { error: '...' }    (format kita)
      //   ctx.message → { message: '...' }  (format Supabase/Hono default)
      //   ctx string  → body plain text
      //   error.message → fallback SDK ('Edge Function returned a non-2xx status code')
      const ctx = (error as any)?.context;
      console.error('[send-otp] error:', error, '| context:', ctx);
      const msg =
        ctx?.error ??
        ctx?.message ??
        (typeof ctx === 'string' ? ctx : null) ??
        error.message ??
        'Gagal mengirim OTP.';
      setOtpError(msg);
      return;
    }

    setOtpSent(true);
  };

  const verifyOTP = async () => {
    if (otpInput.length !== 4) return;
    setVerifyingOtp(true);
    setOtpError('');

    const { data, error } = await supabase.functions.invoke('server', {
      body: { route: 'verify-otp', code: otpInput },
    });

    setVerifyingOtp(false);

    if (error) {
      const ctx = (error as any)?.context;
      console.error('[verify-otp] error:', error, '| context:', ctx);
      const msg =
        ctx?.error ??
        ctx?.message ??
        (typeof ctx === 'string' ? ctx : null) ??
        error.message ??
        'Kode OTP salah.';
      setOtpError(msg);
      return;
    }

    setVerifiedPhone((data as any)?.phone ?? '');
    setWaVerified(true);
  };

  const resetWA = () => {
    setWaVerified(false);
    setOtpSent(false);
    setOtpInput('');
    setOtpError('');
    setVerifiedPhone('');
  };

  const handleSubmit = async () => {
    if (!user || !ktmFile || !agreed || !waVerified) return;
    setError('');
    setUploading(true);
    try {
      const ext = ktmFile.name.split('.').pop();
      const path = `ktm/${user.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(path, ktmFile, { contentType: ktmFile.type, upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          ktm_url: urlData.publicUrl,
          seller_status: 'pending',
          whatsapp_number: verifiedPhone,
          whatsapp_verified: true,
        })
        .eq('id', user.id);
      if (updateErr) throw updateErr;
      await refreshProfile();
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Pending / submitted screen ─────────────────────────────────────────────
  if (sellerStatus === 'pending' || submitted) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-sm w-full">
            <div className="bg-card border-2 border-border rounded-xl shadow-lg p-8 flex flex-col items-center text-center gap-5">
              <div className="size-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Clock className="size-10 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground mb-2">
                  {language === 'en' ? 'Verification Under Review' : 'Pendaftaran Penjual Sedang Ditinjau'}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {language === 'en'
                    ? 'The KlikNesa Admin team is verifying your KTM. Please wait while this manual process is completed.'
                    : 'Tim Admin KlikNesa sedang memverifikasi KTM kamu. Mohon tunggu proses manual ini selesai.'}
                </p>
              </div>
              <div className="w-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-xl p-4 text-left space-y-2">
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {language === 'en' ? 'What happens next?' : 'Apa yang terjadi selanjutnya?'}
                </p>
                <ul className="text-xs text-green-700 dark:text-green-400 list-disc list-inside space-y-1">
                  <li>{language === 'en' ? 'Admin reviews your KTM photo' : 'Admin meninjau foto KTM kamu'}</li>
                  <li>{language === 'en' ? 'Status updated to Verified or Rejected' : 'Status diperbarui: Terverifikasi atau Ditolak'}</li>
                  <li>{language === 'en' ? 'You can sell after verification' : 'Kamu bisa berjualan setelah terverifikasi'}</li>
                </ul>
              </div>
              <button
                onClick={() => navigate('/home')}
                className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold transition-colors duration-300"
              >
                {language === 'en' ? 'Back to Home' : 'Kembali ke Beranda'}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Verification form (unverified / rejected) ──────────────────────────────
  return (
    <Layout>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">

          {/* Header */}
          <div className="flex items-center gap-4 mb-6 sm:mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-accent transition-all duration-300"
            >
              <ArrowLeft className="size-5 sm:size-6" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {language === 'en' ? 'Seller Verification' : 'Verifikasi Akun Penjual'}
            </h1>
          </div>

          {/* Rejected notice */}
          {sellerStatus === 'rejected' && (
            <div className="mb-4 p-4 rounded-xl bg-destructive/10 border-2 border-destructive text-destructive text-sm">
              <p className="font-semibold mb-1">
                {language === 'en' ? 'Verification Rejected' : 'Verifikasi Ditolak'}
              </p>
              <p className="opacity-80">
                {language === 'en'
                  ? 'Your previous submission was rejected. Please re-upload a clear, valid KTM photo.'
                  : 'Pengajuan KTM sebelumnya ditolak. Silakan unggah ulang foto KTM yang jelas dan valid.'}
              </p>
            </div>
          )}

          <div className="bg-card border-2 border-border rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="space-y-5 sm:space-y-6">

              {/* ── T&C Section ── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Store className="size-5 text-green-700" />
                  <h2 className="font-bold text-foreground">
                    {language === 'en' ? 'Seller Terms & Conditions' : 'Syarat & Ketentuan Penjual'}
                  </h2>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground leading-relaxed space-y-2.5 mb-4">
                  <p>
                    {language === 'en'
                      ? 'To start selling on KlikNesa, you are required to upload your KTM (Student Card) or active E-KTM document as proof that you are a genuine UNESA student.'
                      : 'Untuk mulai berjualan di KlikNesa, kamu wajib mengunggah Kartu Tanda Mahasiswa (KTM) atau bukti Surat E-KTM aktif sebagai bukti bahwa kamu adalah mahasiswa UNESA murni.'}
                  </p>
                  <p>
                    {language === 'en'
                      ? 'By registering as a seller, you agree to only sell items in accordance with applicable laws and KlikNesa community guidelines.'
                      : 'Dengan mendaftar sebagai penjual, kamu menyetujui untuk hanya menjual barang yang sesuai dengan hukum yang berlaku dan pedoman komunitas KlikNesa.'}
                  </p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 size-4 accent-green-700 cursor-pointer shrink-0"
                  />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    {language === 'en'
                      ? 'I have read and agree to the Seller Terms & Conditions above.'
                      : 'Saya telah membaca dan menyetujui Syarat & Ketentuan Penjual di atas.'}
                  </span>
                </label>
              </div>

              {/* ── WhatsApp Verification ── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="size-5 text-green-700" />
                  <h2 className="font-bold text-foreground">
                    {language === 'en' ? 'WhatsApp Verification' : 'Verifikasi Nomor WhatsApp'}
                  </h2>
                  {waVerified && (
                    <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-green-600">
                      <ShieldCheck className="size-4" />
                      {language === 'en' ? 'Verified' : 'Terverifikasi'}
                    </span>
                  )}
                </div>

                {waVerified ? (
                  /* Nomor sudah terverifikasi */
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50">
                    <CheckCircle className="size-5 text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        {waNumber}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {language === 'en' ? 'Number successfully verified' : 'Nomor berhasil diverifikasi'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetWA}
                      className="ml-auto text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                    >
                      {language === 'en' ? 'Change' : 'Ganti'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Input nomor + tombol Kirim OTP */}
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={waNumber}
                        onChange={(e) => {
                          setWaNumber(e.target.value);
                          setOtpSent(false);
                          setOtpInput('');
                          setOtpError('');
                        }}
                        placeholder="08xxxxxxxxxx"
                        className="flex-1 px-4 py-2.5 rounded-lg bg-input-background border-2 border-border focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20 transition-all text-sm"
                        disabled={sendingOtp}
                      />
                      <button
                        type="button"
                        onClick={sendOTP}
                        disabled={!waNumber || sendingOtp}
                        className="px-4 py-2.5 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {sendingOtp
                          ? (language === 'en' ? 'Sending…' : 'Mengirim…')
                          : otpSent
                            ? (language === 'en' ? 'Resend' : 'Kirim Ulang')
                            : (language === 'en' ? 'Send OTP' : 'Kirim OTP')}
                      </button>
                    </div>

                    {/* Input kode OTP + tombol Verifikasi */}
                    {otpSent && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          value={otpInput}
                          onChange={(e) => {
                            setOtpInput(e.target.value.replace(/\D/g, ''));
                            setOtpError('');
                          }}
                          placeholder={language === 'en' ? '4-digit OTP' : 'Kode OTP 4 digit'}
                          className="flex-1 px-4 py-2.5 rounded-lg bg-input-background border-2 border-border focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20 transition-all text-sm tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={verifyOTP}
                          disabled={otpInput.length !== 4 || verifyingOtp}
                          className="px-4 py-2.5 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {verifyingOtp
                            ? (language === 'en' ? 'Checking…' : 'Memeriksa…')
                            : (language === 'en' ? 'Verify' : 'Verifikasi')}
                        </button>
                      </div>
                    )}

                    {otpError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3 shrink-0" />
                        {otpError}
                      </p>
                    )}

                    {otpSent && !otpError && (
                      <p className="text-xs text-muted-foreground">
                        {language === 'en'
                          ? 'OTP sent to your WhatsApp. Enter the 4-digit code above.'
                          : 'OTP dikirim ke WhatsApp kamu. Masukkan 4 digit kode di atas.'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ── KTM Upload ── */}
              <div>
                <label className="block text-foreground mb-2 font-medium text-sm sm:text-base">
                  {language === 'en' ? 'Upload KTM / E-KTM Photo' : 'Foto KTM / E-KTM'}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-green-600 dark:border-green-700 rounded-xl overflow-hidden cursor-pointer hover:border-green-700 dark:hover:border-green-500 transition-colors duration-300 bg-green-50 dark:bg-green-900/10"
                >
                  {ktmPreview ? (
                    <div className="relative">
                      <img
                        src={ktmPreview}
                        alt="KTM Preview"
                        className="w-full h-48 sm:h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-sm font-medium">
                          {language === 'en' ? 'Click to change photo' : 'Klik untuk ganti foto'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="absolute top-2 right-2 size-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 sm:p-10 text-center">
                      <Upload className="size-10 sm:size-12 text-green-600 mx-auto mb-3" />
                      <p className="text-sm sm:text-base text-green-700 dark:text-green-400 mb-1 font-medium">
                        {language === 'en' ? 'Click to upload KTM photo' : 'Klik untuk unggah foto KTM'}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-500">
                        JPG, JPEG, PNG · Maks 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border-2 border-destructive text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* ── Actions ── */}
              <div className="flex gap-3 sm:gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 py-2.5 sm:py-3 rounded-lg border-2 border-border hover:bg-accent transition-all duration-300 font-medium text-sm sm:text-base"
                >
                  {language === 'en' ? 'Cancel' : 'Batal'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!ktmFile || !agreed || !waVerified || uploading}
                  className="flex-1 py-2.5 sm:py-3 rounded-lg bg-green-700 text-white font-medium hover:bg-green-800 hover:shadow-lg transition-all duration-300 disabled:opacity-50 transform hover:scale-[1.02] text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="size-4" />
                  )}
                  {uploading
                    ? (language === 'en' ? 'Uploading…' : 'Mengunggah…')
                    : (language === 'en' ? 'Submit Verification' : 'Kirim Verifikasi')}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
