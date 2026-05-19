import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { useUserMode } from './UserModeContext';
import { supabase } from '../../../utils/supabase/client';
import {
  ShoppingBag,
  Plus,
  Search,
  Star,
  TrendingUp,
  PackageCheck,
  Wallet,
  MessageCircle,
} from 'lucide-react';
import Layout from './Layout';

// ─── Types ───────────────────────────────────────────────
interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  campus: string;
  images: string[];
  status: string;
  seller_id: string;
  whatsapp_number: string;
  created_at: string;
}

function openWhatsApp(whatsappNumber: string, productTitle: string) {
  let phone = whatsappNumber.replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '62' + phone.slice(1);
  else if (!phone.startsWith('62')) phone = '62' + phone;
  const message = encodeURIComponent(
    `Halo, saya tertarik dengan produk "${productTitle}" yang Anda jual di KlikNesa. Apakah masih tersedia?`
  );
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
}

const CAMPUSES = ['All', 'Ketintang', 'Lidah Wetan', 'Magetan'];

// ─── Seller Dashboard ─────────────────────────────────────
function SellerDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [listingCount, setListingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .then(({ count, error }) => {
        if (!error && count !== null) setListingCount(count);
      });
  }, [user?.id]);

  const stats = [
    {
      icon: PackageCheck,
      label: language === 'en' ? 'Listings' : 'Total Listing',
      value: listingCount,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
    },
    {
      icon: TrendingUp,
      label: language === 'en' ? 'Transactions' : 'Transaksi Berhasil',
      value: user?.transactionCount ?? 0,
      color: 'text-green-600 bg-green-50 dark:bg-green-950',
    },
    {
      icon: Wallet,
      label: language === 'en' ? 'Revenue' : 'Pendapatan',
      value: 'Rp –',
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950',
    },
    {
      icon: Star,
      label: 'Rating',
      value: user?.rating?.toFixed(1) ?? '–',
      color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950',
    },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Heading */}
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {language === 'en' ? 'Seller Dashboard' : 'Dashboard Penjual'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {language === 'en'
              ? `Welcome back, ${user?.name}`
              : `Selamat datang, ${user?.name}`}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2"
            >
              <div className={`size-9 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="size-4" />
              </div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          to="/create-listing"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md"
        >
          <Plus className="size-4" />
          {language === 'en' ? 'Add Item' : 'Tambah Barang'}
        </Link>

        {/* Link ke listing saya */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-2">
            {language === 'en' ? 'Manage Listings' : 'Kelola Listing'}
          </h2>
          <Link
            to="/my-listings"
            className="text-sm text-primary hover:underline"
          >
            {language === 'en' ? 'View all my listings →' : 'Lihat semua listing saya →'}
          </Link>
        </div>
      </div>
    </Layout>
  );
}

// ─── Buyer Catalog ────────────────────────────────────────
function BuyerCatalog() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState(user?.campus || 'All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const CATEGORIES = language === 'en'
    ? ['All', 'Electronics', 'Books', 'Furniture', 'Clothing', 'Sports', 'Other']
    : ['Semua', 'Elektronik', 'Buku', 'Furnitur', 'Pakaian', 'Olahraga', 'Lainnya'];

  const CATEGORY_MAP: Record<string, string> = {
    'All': 'All', 'Semua': 'All',
    'Electronics': 'Electronics', 'Elektronik': 'Electronics',
    'Books': 'Books', 'Buku': 'Books',
    'Furniture': 'Furniture', 'Furnitur': 'Furniture',
    'Clothing': 'Clothing', 'Pakaian': 'Clothing',
    'Sports': 'Sports', 'Olahraga': 'Sports',
    'Other': 'Other', 'Lainnya': 'Other',
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (selectedCampus !== 'All') query = query.eq('campus', selectedCampus);
      const categoryEn = CATEGORY_MAP[selectedCategory] ?? selectedCategory;
      if (categoryEn !== 'All') query = query.eq('category', categoryEn);
      if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);

      const { data, error } = await query;
      if (error) throw error;
      setListings(data || []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedCampus, selectedCategory, searchQuery]);

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">

          {/* Welcome banner */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 sm:p-6">
            <h2 className="text-xl font-bold text-foreground mb-1">
              {t('home.welcome')}, {user?.name}!
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('home.browseItems')} {user?.campus}
            </p>
          </div>

          {/* Filter card */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder={t('home.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-2">
                  {t('home.campus')}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {CAMPUSES.map((campus) => (
                    <button
                      key={campus}
                      onClick={() => setSelectedCampus(campus)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedCampus === campus
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {campus === 'All' ? t('home.all') : campus}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-2">
                  {t('home.category')}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Listings */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">{t('home.loading')}</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="size-14 text-muted-foreground mb-4" />
              <p className="text-base font-semibold text-foreground mb-1">
                {language === 'en' ? 'No products available' : 'Produk tidak tersedia'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'en'
                  ? 'Check back later or try a different filter.'
                  : 'Coba filter lain atau kunjungi lagi nanti.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {listings.map((listing, index) => (
                <div
                  key={listing.id}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary hover:shadow-lg transition-all duration-300 group flex flex-col"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Link to={`/listings/${listing.id}`} className="block">
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {listing.images?.length > 0 ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <ShoppingBag className="size-12 text-muted-foreground group-hover:scale-110 transition-transform duration-300" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm text-foreground mb-1 group-hover:text-primary transition-colors truncate">
                        {listing.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">
                          Rp {listing.price.toLocaleString()}
                        </span>
                        <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                          {listing.campus}
                        </span>
                      </div>
                    </div>
                  </Link>
                  {listing.whatsapp_number && (
                    <div className="px-4 pb-4 mt-auto">
                      <button
                        onClick={() => openWhatsApp(listing.whatsapp_number, listing.title)}
                        className="w-full py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="size-3.5" />
                        {language === 'en' ? 'Contact Seller' : 'Hubungi Penjual'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}

// ─── Home (mode-aware entry) ──────────────────────────────
export default function Home() {
  const { mode } = useUserMode();
  return mode === 'seller' ? <SellerDashboard /> : <BuyerCatalog />;
}
