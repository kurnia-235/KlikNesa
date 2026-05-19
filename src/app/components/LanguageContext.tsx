import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'id';

interface Translations {
  [key: string]: {
    en: string;
    id: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.login': { en: 'Login', id: 'Masuk' },
  'nav.signup': { en: 'Sign Up', id: 'Daftar' },
  'nav.home': { en: 'Home', id: 'Beranda' },
  'nav.sellItem': { en: 'Sell Item', id: 'Jual Barang' },
  'nav.messages': { en: 'Messages', id: 'Pesan' },
  'nav.myListings': { en: 'My Listings', id: 'Daftar Saya' },
  'nav.signOut': { en: 'Sign Out', id: 'Keluar' },
  'nav.admin': { en: 'Admin', id: 'Admin' },

  // Landing Page
  'landing.title': { en: 'UNESA Student Preloved Marketplace', id: 'Pasar Barang Bekas Mahasiswa UNESA' },
  'landing.subtitle': {
    en: 'Buy and sell quality preloved items safely within the UNESA student community. Verified students, trusted transactions, local deals.',
    id: 'Jual beli barang bekas berkualitas dengan aman di komunitas mahasiswa UNESA. Mahasiswa terverifikasi, transaksi terpercaya, lokal.'
  },
  'landing.getStarted': { en: 'Get Started', id: 'Mulai Sekarang' },
  'landing.studentVerified': { en: 'Student Verified', id: 'Mahasiswa Terverifikasi' },
  'landing.studentVerifiedDesc': { en: 'Only verified UNESA students can join and trade', id: 'Hanya mahasiswa UNESA terverifikasi yang dapat bergabung dan berdagang' },
  'landing.campusFocused': { en: 'Campus Focused', id: 'Fokus Kampus' },
  'landing.campusFocusedDesc': { en: 'Filter by Ketintang, Lidah Wetan, or Magetan campus', id: 'Filter berdasarkan kampus Ketintang, Lidah Wetan, atau Magetan' },
  'landing.safeTrading': { en: 'Safe Trading', id: 'Perdagangan Aman' },
  'landing.safeTradingDesc': { en: 'COD meetups and secure e-wallet payments', id: 'COD dan pembayaran e-wallet yang aman' },
  'landing.affordable': { en: 'Affordable', id: 'Terjangkau' },
  'landing.affordableDesc': { en: 'Save on essentials with budget-friendly preloved items', id: 'Hemat untuk kebutuhan dengan barang bekas yang terjangkau' },
  'landing.readyToStart': { en: 'Ready to start trading?', id: 'Siap untuk mulai berdagang?' },
  'landing.joinCommunity': { en: 'Join the growing community of UNESA students buying and selling safely', id: 'Bergabunglah dengan komunitas mahasiswa UNESA yang membeli dan menjual dengan aman' },
  'landing.createAccount': { en: 'Create Account', id: 'Buat Akun' },
  'landing.backToHome': { en: 'Back to home', id: 'Kembali ke beranda' },

  // Login Page
  'login.welcomeBack': { en: 'Welcome Back', id: 'Selamat Datang Kembali' },
  'login.signInAccount': { en: 'Sign in to your account', id: 'Masuk ke akun Anda' },
  'login.email': { en: 'Email', id: 'Email' },
  'login.password': { en: 'Password', id: 'Kata Sandi' },
  'login.signIn': { en: 'Sign In', id: 'Masuk' },
  'login.signingIn': { en: 'Signing in...', id: 'Sedang masuk...' },
  'login.noAccount': { en: "Don't have an account?", id: 'Belum punya akun?' },
  'login.emailPlaceholder': { en: 'your.email@mhs.unesa.ac.id', id: 'email.anda@mhs.unesa.ac.id' },
  'login.passwordPlaceholder': { en: 'Enter your password', id: 'Masukkan kata sandi Anda' },

  // Signup Page
  'signup.createAccount': { en: 'Create Account', id: 'Buat Akun' },
  'signup.joinMarketplace': { en: 'Join the UNESA marketplace', id: 'Bergabung dengan pasar UNESA' },
  'signup.fullName': { en: 'Full Name', id: 'Nama Lengkap' },
  'signup.unesaEmail': { en: 'UNESA Email', id: 'Email UNESA' },
  'signup.campusLocation': { en: 'Campus Location', id: 'Lokasi Kampus' },
  'signup.password': { en: 'Password', id: 'Kata Sandi' },
  'signup.signUp': { en: 'Sign Up', id: 'Daftar' },
  'signup.creatingAccount': { en: 'Creating account...', id: 'Membuat akun...' },
  'signup.haveAccount': { en: 'Already have an account?', id: 'Sudah punya akun?' },
  'signup.namePlaceholder': { en: 'Your full name', id: 'Nama lengkap Anda' },
  'signup.emailHelp': { en: 'Must be a valid UNESA student email', id: 'Harus email mahasiswa UNESA yang valid' },
  'signup.passwordPlaceholder': { en: 'Create a secure password', id: 'Buat kata sandi yang aman' },
  'signup.passwordHelp': { en: 'At least 6 characters', id: 'Minimal 6 karakter' },

  // Home Page
  'home.welcome': { en: 'Welcome', id: 'Selamat Datang' },
  'home.browseItems': { en: 'Browse preloved items from verified UNESA students at', id: 'Jelajahi barang bekas dari mahasiswa UNESA terverifikasi di' },
  'home.search': { en: 'Search for items...', id: 'Cari barang...' },
  'home.campus': { en: 'Campus', id: 'Kampus' },
  'home.category': { en: 'Category', id: 'Kategori' },
  'home.all': { en: 'All', id: 'Semua' },
  'home.loading': { en: 'Loading listings...', id: 'Memuat daftar...' },
  'home.noListings': { en: 'No listings found', id: 'Tidak ada daftar' },
  'home.noListingsDesc': { en: 'Try adjusting your filters or be the first to post an item!', id: 'Coba sesuaikan filter atau jadilah yang pertama memposting barang!' },
  'home.createListing': { en: 'Create Listing', id: 'Buat Daftar' },

  // Categories
  'category.electronics': { en: 'Electronics', id: 'Elektronik' },
  'category.books': { en: 'Books', id: 'Buku' },
  'category.furniture': { en: 'Furniture', id: 'Furnitur' },
  'category.clothing': { en: 'Clothing', id: 'Pakaian' },
  'category.sports': { en: 'Sports', id: 'Olahraga' },
  'category.other': { en: 'Other', id: 'Lainnya' },

  // Listing Detail
  'listing.back': { en: 'Back', id: 'Kembali' },
  'listing.description': { en: 'Description', id: 'Deskripsi' },
  'listing.trusted': { en: 'Trusted', id: 'Terpercaya' },
  'listing.contactSeller': { en: 'Contact Seller', id: 'Hubungi Penjual' },
  'listing.hideChat': { en: 'Hide Chat', id: 'Sembunyikan Chat' },
  'listing.buyWithCOD': { en: 'Buy with COD', id: 'Beli dengan COD' },
  'listing.buyWithEWallet': { en: 'Buy with E-Wallet', id: 'Beli dengan E-Wallet' },
  'listing.yourListing': { en: 'This is your listing', id: 'Ini adalah daftar Anda' },
  'listing.manageListings': { en: 'Manage your listings', id: 'Kelola daftar Anda' },
  'listing.chatWithSeller': { en: 'Chat with Seller', id: 'Chat dengan Penjual' },
  'listing.noMessages': { en: 'No messages yet. Start the conversation!', id: 'Belum ada pesan. Mulai percakapan!' },
  'listing.typeMessage': { en: 'Type a message...', id: 'Ketik pesan...' },
  'listing.notFound': { en: 'Listing not found', id: 'Daftar tidak ditemukan' },

  // My Listings
  'myListings.title': { en: 'My Listings', id: 'Daftar Saya' },
  'myListings.newListing': { en: 'New Listing', id: 'Daftar Baru' },
  'myListings.loading': { en: 'Loading your listings...', id: 'Memuat daftar Anda...' },
  'myListings.noListings': { en: 'No listings yet', id: 'Belum ada daftar' },
  'myListings.startSelling': { en: 'Start selling your preloved items to other UNESA students', id: 'Mulai jual barang bekas Anda ke mahasiswa UNESA lainnya' },
  'myListings.createFirst': { en: 'Create Your First Listing', id: 'Buat Daftar Pertama Anda' },
  'myListings.view': { en: 'View', id: 'Lihat' },
  'myListings.active': { en: 'Active', id: 'Aktif' },
  'myListings.available': { en: 'Available', id: 'Tersedia' },
  'myListings.sold': { en: 'Sold', id: 'Terjual' },
  'myListings.inactive': { en: 'Inactive', id: 'Nonaktif' },

  // Create Listing
  'createListing.title': { en: 'Create Listing', id: 'Buat Daftar' },
  'createListing.listingTitle': { en: 'Title', id: 'Judul' },
  'createListing.description': { en: 'Description', id: 'Deskripsi' },
  'createListing.price': { en: 'Price (Rp)', id: 'Harga (Rp)' },
  'createListing.category': { en: 'Category', id: 'Kategori' },
  'createListing.campus': { en: 'Campus Location', id: 'Lokasi Kampus' },
  'createListing.cancel': { en: 'Cancel', id: 'Batal' },
  'createListing.create': { en: 'Create Listing', id: 'Buat Daftar' },
  'createListing.creating': { en: 'Creating...', id: 'Membuat...' },
  'createListing.titlePlaceholder': { en: 'e.g., Calculus Textbook (9th Edition)', id: 'contoh: Buku Kalkulus (Edisi ke-9)' },
  'createListing.descPlaceholder': { en: "Describe the item's condition, features, etc.", id: 'Jelaskan kondisi barang, fitur, dll.' },
  'createListing.whatsapp': { en: 'WhatsApp Number', id: 'Nomor WhatsApp' },
  'createListing.whatsappPlaceholder': { en: 'e.g., 08123456789', id: 'contoh: 08123456789' },
  'createListing.imageUpload': { en: 'Click to upload product photo', id: 'Klik untuk unggah foto produk' },
  'createListing.imageHelp': { en: 'JPG, JPEG, or PNG format. Max 5MB.', id: 'Format JPG, JPEG, atau PNG. Maks 5MB.' },
  'createListing.imageChange': { en: 'Click to change photo', id: 'Klik untuk ganti foto' },

  // Conversations
  'conversations.title': { en: 'Messages', id: 'Pesan' },
  'conversations.loading': { en: 'Loading conversations...', id: 'Memuat percakapan...' },
  'conversations.noConversations': { en: 'No conversations yet', id: 'Belum ada percakapan' },
  'conversations.startChatting': { en: 'Start chatting with sellers by contacting them from listing pages', id: 'Mulai mengobrol dengan penjual dari halaman daftar' },

  // Admin
  'admin.title': { en: 'Admin Dashboard', id: 'Dashboard Admin' },
  'admin.totalUsers': { en: 'Total Users', id: 'Total Pengguna' },
  'admin.reports': { en: 'Reports', id: 'Laporan' },
  'admin.activeListings': { en: 'Active Listings', id: 'Daftar Aktif' },
  'admin.recentUsers': { en: 'Recent Users', id: 'Pengguna Terbaru' },
  'admin.noUsers': { en: 'No users yet', id: 'Belum ada pengguna' },
  'admin.noReports': { en: 'No reports', id: 'Tidak ada laporan' },
  'admin.loading': { en: 'Loading admin data...', id: 'Memuat data admin...' },

  // Contact
  'contact.title': { en: 'Contact Us', id: 'Hubungi Kami' },
  'contact.subtitle': { en: 'Get in touch with the KlikNesa team', id: 'Hubungi tim KlikNesa' },
  'contact.name': { en: 'Name', id: 'Nama' },
  'contact.email': { en: 'Email', id: 'Email' },
  'contact.whatsapp': { en: 'WhatsApp', id: 'WhatsApp' },
  'contact.chatOnWhatsApp': { en: 'Chat on WhatsApp', id: 'Chat di WhatsApp' },
  'contact.followUs': { en: 'Follow Us', id: 'Ikuti Kami' },

  // Common
  'common.loading': { en: 'Loading...', id: 'Memuat...' },
  'common.error': { en: 'Error', id: 'Kesalahan' },
  'common.success': { en: 'Success', id: 'Berhasil' },
  'common.rp': { en: 'Rp', id: 'Rp' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('kliknesa-language');
    return (saved as Language) || 'id';
  });

  useEffect(() => {
    localStorage.setItem('kliknesa-language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
