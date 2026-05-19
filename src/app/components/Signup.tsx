import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { ShoppingBag, Sun, Moon, Languages } from 'lucide-react';

const CAMPUSES = ['Ketintang', 'Lidah Wetan', 'Magetan'];

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [campus, setCampus] = useState(CAMPUSES[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp(email, password, name, campus);
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-secondary/10 transition-colors duration-300 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md animate-scale-in">
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-card border-2 border-border hover:bg-accent transition-all duration-300"
          >
            {theme === 'light' ? <Moon className="size-5" /> : <Sun className="size-5" />}
          </button>
          <button
            onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
            className="px-3 py-2 rounded-lg bg-card border-2 border-border hover:bg-accent transition-all duration-300 flex items-center gap-1.5"
          >
            <Languages className="size-4" />
            <span className="text-sm font-medium">{language === 'en' ? 'EN' : 'ID'}</span>
          </button>
        </div>

        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4 group">
            <ShoppingBag className="size-10 sm:size-12 text-primary transform group-hover:scale-110 transition-transform duration-300" />
            <h1 className="text-3xl sm:text-4xl font-bold text-primary">KlikNesa</h1>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{t('signup.createAccount')}</h2>
          <p className="text-muted-foreground mt-2">{t('signup.joinMarketplace')}</p>
        </div>

        <div className="bg-card p-6 sm:p-8 rounded-2xl border-2 border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border-2 border-destructive text-destructive text-sm animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-foreground mb-2 font-medium text-sm sm:text-base">
                {t('signup.fullName')}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 rounded-lg bg-input-background border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all duration-300"
                placeholder={t('signup.namePlaceholder')}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-foreground mb-2 font-medium text-sm sm:text-base">
                {t('signup.unesaEmail')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 rounded-lg bg-input-background border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all duration-300"
                placeholder={t('login.emailPlaceholder')}
                required
              />
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {t('signup.emailHelp')}
              </p>
            </div>

            <div>
              <label htmlFor="campus" className="block text-foreground mb-2 font-medium text-sm sm:text-base">
                {t('signup.campusLocation')}
              </label>
              <select
                id="campus"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 rounded-lg bg-input-background border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all duration-300"
                required
              >
                {CAMPUSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-foreground mb-2 font-medium text-sm sm:text-base">
                {t('signup.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 rounded-lg bg-input-background border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all duration-300"
                placeholder={t('signup.passwordPlaceholder')}
                required
                minLength={6}
              />
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {t('signup.passwordHelp')}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:shadow-lg transition-all duration-300 disabled:opacity-50 transform hover:scale-[1.02]"
            >
              {loading ? t('signup.creatingAccount') : t('signup.signUp')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm sm:text-base">
              {t('signup.haveAccount')}{' '}
              <Link to="/login" className="text-primary font-medium hover:underline transition-colors duration-300">
                {t('nav.login')}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm sm:text-base">
            {t('landing.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
