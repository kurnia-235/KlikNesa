import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { serverUrl } from '../../../utils/supabase/client';
import { ShoppingBag, Plus, Search } from 'lucide-react';
import Layout from './Layout';

const CAMPUSES = ['All', 'Ketintang', 'Lidah Wetan', 'Magetan'];

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  campus: string;
  images: string[];
  status: string;
  sellerId: string;
  createdAt: string;
}

export default function Home() {
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

  const CATEGORY_MAP: { [key: string]: string } = {
    'All': 'All', 'Semua': 'All',
    'Electronics': 'Electronics', 'Elektronik': 'Electronics',
    'Books': 'Books', 'Buku': 'Books',
    'Furniture': 'Furniture', 'Furnitur': 'Furniture',
    'Clothing': 'Clothing', 'Pakaian': 'Clothing',
    'Sports': 'Sports', 'Olahraga': 'Sports',
    'Other': 'Other', 'Lainnya': 'Other'
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCampus !== 'All') params.append('campus', selectedCampus);

      const categoryEn = CATEGORY_MAP[selectedCategory] || selectedCategory;
      if (categoryEn !== 'All') params.append('category', categoryEn);

      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`${serverUrl}/listings?${params.toString()}`);
      const data = await response.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedCampus, selectedCategory, searchQuery]);

  return (
    <Layout>

      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 animate-fade-in">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                {t('home.welcome')}, {user?.name}!
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t('home.browseItems')} {user?.campus}
              </p>
            </div>

          <div className="bg-card border-2 border-border rounded-xl p-4 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Search className="size-5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder={t('home.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-input-background border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">{t('home.campus')}</label>
                <div className="flex gap-2 flex-wrap">
                  {CAMPUSES.map((campus) => (
                    <button
                      key={campus}
                      onClick={() => setSelectedCampus(campus)}
                      className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${
                        selectedCampus === campus
                          ? 'bg-primary text-primary-foreground shadow-md scale-105'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105'
                      }`}
                    >
                      {campus === 'All' ? t('home.all') : campus}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">{t('home.category')}</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-input-background border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-lg text-muted-foreground">{t('home.loading')}</div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 bg-card border-2 border-border rounded-xl animate-fade-in">
            <ShoppingBag className="size-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">{t('home.noListings')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('home.noListingsDesc')}
            </p>
            <Link
              to="/create-listing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all duration-300 hover:scale-105"
            >
              <Plus className="size-5" />
              {t('home.createListing')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {listings.map((listing, index) => (
              <Link
                key={listing.id}
                to={`/listings/${listing.id.replace('listing:', '')}`}
                className="bg-card border-2 border-border rounded-xl overflow-hidden hover:border-primary hover:shadow-lg transition-all duration-300 group animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <ShoppingBag className="size-16 text-muted-foreground group-hover:scale-110 transition-transform duration-300" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors duration-300 truncate">
                    {listing.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {listing.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      Rp {listing.price.toLocaleString()}
                    </span>
                    <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">
                      {listing.campus}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {listing.category}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
}
