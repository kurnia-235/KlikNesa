import { Link } from 'react-router';
import { ShoppingBag, Shield, MapPin, Handshake, Sun, Moon, Languages } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';

export default function Landing() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-secondary/10 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <nav className="flex flex-wrap justify-between items-center gap-4 mb-12 sm:mb-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <ShoppingBag className="size-8 sm:size-10 text-primary transform group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-primary/20 blur-xl scale-0 group-hover:scale-100 transition-transform duration-300"></div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">KlikNesa</h1>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-lg bg-card border-2 border-border hover:bg-accent transition-all duration-300 hover:scale-105"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="size-5 sm:size-6 text-foreground" />
              ) : (
                <Sun className="size-5 sm:size-6 text-foreground" />
              )}
            </button>

            <button
              onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-card border-2 border-border hover:bg-accent transition-all duration-300 hover:scale-105 flex items-center gap-1.5 sm:gap-2"
            >
              <Languages className="size-4 sm:size-5" />
              <span className="text-sm sm:text-base font-medium">{language === 'en' ? 'EN' : 'ID'}</span>
            </button>

            <Link
              to="/login"
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg border-2 border-primary text-primary font-medium hover:bg-primary/10 transition-all duration-300 hover:scale-105 text-sm sm:text-base"
            >
              {t('nav.login')}
            </Link>
            <Link
              to="/signup"
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm sm:text-base"
            >
              {t('nav.signup')}
            </Link>
          </div>
        </nav>

        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
            {t('landing.title')}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed px-4">
            {t('landing.subtitle')}
          </p>
          <Link
            to="/signup"
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 rounded-lg bg-primary text-primary-foreground text-base sm:text-lg font-medium hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
          >
            {t('landing.getStarted')}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto mb-12 sm:mb-16">
          {[
            { icon: Shield, title: t('landing.studentVerified'), desc: t('landing.studentVerifiedDesc') },
            { icon: MapPin, title: t('landing.campusFocused'), desc: t('landing.campusFocusedDesc') },
            { icon: Handshake, title: t('landing.safeTrading'), desc: t('landing.safeTradingDesc') },
            { icon: ShoppingBag, title: t('landing.affordable'), desc: t('landing.affordableDesc') },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-card p-6 sm:p-8 rounded-xl border-2 border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-primary/50 group animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <feature.icon className="size-12 sm:size-14 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 sm:p-12 rounded-2xl border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 max-w-4xl mx-auto">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            {t('landing.readyToStart')}
          </h3>
          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('landing.joinCommunity')}
          </p>
          <Link
            to="/signup"
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/90 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 transform text-base sm:text-lg"
          >
            {t('landing.createAccount')}
          </Link>
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <Link
            to="/contact"
            className="inline-block text-muted-foreground hover:text-primary transition-colors duration-300 text-sm sm:text-base"
          >
            {t('contact.title')}
          </Link>
        </div>
      </div>
    </div>
  );
}
