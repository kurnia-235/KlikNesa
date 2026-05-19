import { Link } from 'react-router';
import { ShoppingBag, Shield, MapPin, Handshake, Sun, Moon, Languages } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';

export default function Landing() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const features = [
    { icon: Shield,      title: t('landing.studentVerified'), desc: t('landing.studentVerifiedDesc') },
    { icon: MapPin,      title: t('landing.campusFocused'),   desc: t('landing.campusFocusedDesc') },
    { icon: Handshake,   title: t('landing.safeTrading'),     desc: t('landing.safeTradingDesc') },
    { icon: ShoppingBag, title: t('landing.affordable'),      desc: t('landing.affordableDesc') },
  ];

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">

        {/* ── Navbar ── */}
        <nav className="flex justify-between items-center mb-16 sm:mb-20 lg:mb-24">
          <Link to="/" className="flex items-center gap-2 group">
            <ShoppingBag className="size-6 text-primary group-hover:scale-110 transition-transform duration-200" />
            <span className="text-lg font-bold text-primary tracking-tight">KlikNesa</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'light'
                ? <Moon className="size-4 text-muted-foreground" />
                : <Sun className="size-4 text-muted-foreground" />}
            </button>

            <button
              onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors duration-200 text-sm text-muted-foreground font-medium"
            >
              <Languages className="size-4" />
              {language === 'en' ? 'EN' : 'ID'}
            </button>

            <Link
              to="/login"
              className="px-4 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors duration-200"
            >
              {t('nav.login')}
            </Link>
            <Link
              to="/signup"
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors duration-200 shadow-sm"
            >
              {t('nav.signup')}
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-20 lg:mb-24 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-foreground mb-5 sm:mb-6 leading-tight tracking-tight">
            {t('landing.title')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-8 sm:mb-10 leading-relaxed max-w-2xl mx-auto">
            {t('landing.subtitle')}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/signup"
              className="px-5 py-2.5 sm:px-7 sm:py-3 lg:px-8 lg:py-3.5 rounded-lg bg-primary text-primary-foreground text-sm sm:text-base font-semibold hover:bg-primary/90 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              {t('landing.getStarted')}
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 sm:px-7 sm:py-3 lg:px-8 lg:py-3.5 rounded-lg border border-border text-sm sm:text-base font-medium text-foreground hover:bg-accent transition-colors duration-200"
            >
              {t('nav.login')}
            </Link>
          </div>
        </div>

        {/* ── Feature cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-14 sm:mb-16 lg:mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card p-5 lg:p-6 rounded-xl border border-border shadow-none hover:shadow-md transition-shadow duration-300 group animate-slide-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="size-4 text-primary" />
              </div>
              <h3 className="text-sm lg:text-base font-semibold text-foreground mb-1.5 leading-snug">
                {feature.title}
              </h3>
              <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* ── CTA banner ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 bg-primary/5 border border-primary/20 rounded-xl px-6 sm:px-8 py-6 sm:py-7">
          <div className="text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {t('landing.readyToStart')}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
              {t('landing.joinCommunity')}
            </p>
          </div>
          <Link
            to="/signup"
            className="shrink-0 px-6 py-2.5 sm:px-7 sm:py-3 rounded-lg bg-secondary text-secondary-foreground text-sm sm:text-base font-semibold hover:bg-secondary/90 transition-colors duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
          >
            {t('landing.createAccount')}
          </Link>
        </div>

        {/* ── Footer link ── */}
        <div className="mt-10 sm:mt-12 text-center">
          <Link
            to="/contact"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            {t('contact.title')}
          </Link>
        </div>

      </div>
    </div>
  );
}
