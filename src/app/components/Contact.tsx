import { Link } from 'react-router';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { ArrowLeft, Mail, MessageCircle, Instagram, Linkedin, Sun, Moon, Languages } from 'lucide-react';

const WA_NUMBER  = '+62 851-5067-3929';
const WA_LINK    = 'https://wa.me/6285150673929?text=Halo%20Admin%20KlikNesa,%20saya%20butuh%20bantuan...';
const IG_HANDLE  = '@kliknesa';
const IG_LINK    = 'https://instagram.com/kliknesa';
const LI_LINK    = 'https://linkedin.com/company/kliknesa';
const EMAIL      = 'support@kliknesa.com';

export default function Contact() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen lg:h-screen bg-background transition-colors duration-300 flex flex-col justify-center items-center py-6 relative">

      {/* ── Top-right controls ── */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors duration-200"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="size-4 text-muted-foreground" /> : <Sun className="size-4 text-muted-foreground" />}
        </button>
        <button
          onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors duration-200 text-sm text-muted-foreground font-medium"
        >
          <Languages className="size-4" />
          {language === 'en' ? 'EN' : 'ID'}
        </button>
      </div>

      <div className="w-full max-w-3xl px-4 sm:px-6 space-y-5">

        {/* ── Back link ── */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <ArrowLeft className="size-4" />
          {t('landing.backToHome')}
        </Link>

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {t('contact.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {language === 'en' ? 'KlikNesa Team' : 'Tim KlikNesa'}
          </p>
        </div>

        {/* ── Contact cards ── */}
        <div className="grid sm:grid-cols-2 gap-4">

          {/* Email */}
          <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Mail className="size-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">{t('contact.email')}</h3>
            </div>
            <a
              href={`mailto:${EMAIL}`}
              className="text-primary hover:underline text-sm font-medium transition-colors duration-200"
            >
              {EMAIL}
            </a>
            <p className="text-xs text-muted-foreground mt-1.5">
              {language === 'en' ? 'For general inquiries & feedback' : 'Untuk pertanyaan umum & masukan'}
            </p>
          </div>

          {/* WhatsApp */}
          <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-9 bg-[#25D366]/10 rounded-lg flex items-center justify-center shrink-0">
                <MessageCircle className="size-4 text-[#25D366]" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">{t('contact.whatsapp')}</h3>
            </div>
            <p className="text-sm font-medium text-foreground mb-3">{WA_NUMBER}</p>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] text-white text-sm font-semibold hover:bg-[#20BA5A] transition-colors duration-200 shadow-sm"
            >
              <MessageCircle className="size-4" />
              {t('contact.chatOnWhatsApp')}
            </a>
          </div>

        </div>

        {/* ── Follow Us + Narahubung ── */}
        <div className="grid sm:grid-cols-2 gap-4">

          {/* Ikuti Kami */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">{t('contact.followUs')}</h3>
            <div className="flex gap-3">
              {/* Instagram */}
              <a
                href={IG_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity duration-200 shadow-sm"
              >
                <Instagram className="size-5" />
                <span className="text-xs font-semibold">Instagram</span>
                <span className="text-[10px] opacity-85">{IG_HANDLE}</span>
              </a>

              {/* LinkedIn */}
              <a
                href={LI_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-white hover:opacity-90 transition-opacity duration-200 shadow-sm"
                style={{ backgroundColor: '#0077B5' }}
              >
                <Linkedin className="size-5" />
                <span className="text-xs font-semibold">LinkedIn</span>
                <span className="text-[10px] opacity-85">KlikNesa</span>
              </a>
            </div>
          </div>

          {/* Narahubung */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              {language === 'en' ? 'Contact Person' : 'Narahubung'}
            </h3>
            <p className="text-sm font-medium text-primary">
              {language === 'en' ? 'KlikNesa Support Team' : 'Tim Dukungan KlikNesa'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'en'
                ? 'Mon – Fri · 09.00 – 17.00 WIB'
                : 'Senin – Jumat · 09.00 – 17.00 WIB'}
            </p>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline transition-colors duration-200"
            >
              <MessageCircle className="size-3.5" />
              {language === 'en' ? 'Chat directly via WhatsApp' : 'Chat langsung via WhatsApp'}
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
