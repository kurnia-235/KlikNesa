import { Link } from 'react-router';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { ArrowLeft, Mail, Phone, MessageCircle, Instagram, Linkedin, Sun, Moon, Languages } from 'lucide-react';

export default function Contact() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const contactInfo = {
    name: 'KlikNesa Support Team',
    nameId: 'Tim Dukungan KlikNesa',
    email: 'support@kliknesa.com',
    whatsapp: '+62 812 3456 7890',
    whatsappLink: 'https://wa.me/6281234567890',
    instagram: '@kliknesa',
    instagramLink: 'https://instagram.com/kliknesa',
    linkedin: 'KlikNesa',
    linkedinLink: 'https://linkedin.com/company/kliknesa'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-secondary/10 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
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

        <div className="mb-6 sm:mb-8 animate-fade-in">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300 mb-6"
          >
            <ArrowLeft className="size-5" />
            {t('landing.backToHome')}
          </Link>
        </div>

        <div className="text-center mb-8 sm:mb-12 animate-scale-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-8">
          <div className="bg-card border-2 border-border rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">{t('contact.email')}</h3>
              </div>
            </div>
            <a
              href={`mailto:${contactInfo.email}`}
              className="text-primary hover:underline text-base sm:text-lg transition-colors duration-300"
            >
              {contactInfo.email}
            </a>
            <p className="text-sm text-muted-foreground mt-3">
              {language === 'en'
                ? 'Send us an email for general inquiries'
                : 'Kirim email untuk pertanyaan umum'}
            </p>
          </div>

          <div className="bg-card border-2 border-border rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="size-12 bg-secondary/20 rounded-full flex items-center justify-center">
                <Phone className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">{t('contact.whatsapp')}</h3>
              </div>
            </div>
            <p className="text-foreground text-base sm:text-lg mb-4">{contactInfo.whatsapp}</p>
            <a
              href={contactInfo.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-[#25D366] text-white font-medium hover:bg-[#20BA5A] transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
            >
              <MessageCircle className="size-5" />
              {t('contact.chatOnWhatsApp')}
            </a>
          </div>
        </div>

        <div className="bg-card border-2 border-border rounded-xl p-6 sm:p-8 shadow-lg animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-center">
            {t('contact.followUs')}
          </h3>
          <div className="flex justify-center gap-4 sm:gap-6">
            <a
              href={contactInfo.instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 sm:p-6 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:scale-110 transition-all duration-300 shadow-md hover:shadow-xl min-w-[120px]"
            >
              <Instagram className="size-8 sm:size-10" />
              <span className="font-medium text-sm sm:text-base">Instagram</span>
              <span className="text-xs sm:text-sm opacity-90">{contactInfo.instagram}</span>
            </a>

            <a
              href={contactInfo.linkedinLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 sm:p-6 rounded-xl bg-[#0A66C2] text-white hover:scale-110 transition-all duration-300 shadow-md hover:shadow-xl min-w-[120px]"
            >
              <Linkedin className="size-8 sm:size-10" />
              <span className="font-medium text-sm sm:text-base">LinkedIn</span>
              <span className="text-xs sm:text-sm opacity-90">{contactInfo.linkedin}</span>
            </a>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 bg-primary/5 border-2 border-primary/20 rounded-xl p-6 sm:p-8 text-center animate-fade-in">
          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3">
            {language === 'en' ? 'Contact Person' : 'Narahubung'}
          </h3>
          <p className="text-base sm:text-lg font-medium text-primary mb-2">
            {language === 'en' ? contactInfo.name : contactInfo.nameId}
          </p>
          <p className="text-sm sm:text-base text-muted-foreground">
            {language === 'en'
              ? 'Available Monday - Friday, 9 AM - 5 PM WIB'
              : 'Tersedia Senin - Jumat, 09.00 - 17.00 WIB'}
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-primary hover:underline font-medium transition-colors duration-300"
          >
            {language === 'en' ? 'Back to Homepage' : 'Kembali ke Beranda'}
          </Link>
        </div>
      </div>
    </div>
  );
}
