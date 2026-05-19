import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { supabase } from '../../../utils/supabase/client';
import { ArrowLeft, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Layout from './Layout';

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
  created_at: string;
}

export default function MyListings() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', listingId);

      if (!error) fetchMyListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-accent transition-all duration-300"
            >
              <ArrowLeft className="size-5 sm:size-6" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('myListings.title')}</h1>
          </div>
          <Link
            to="/create-listing"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:shadow-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto justify-center"
          >
            <Plus className="size-5" />
            {t('myListings.newListing')}
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-lg text-muted-foreground">{t('myListings.loading')}</div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 bg-card border-2 border-border rounded-xl animate-scale-in">
            <ShoppingBag className="size-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">{t('myListings.noListings')}</h3>
            <p className="text-muted-foreground mb-6 px-4">
              {t('myListings.startSelling')}
            </p>
            <Link
              to="/create-listing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Plus className="size-5" />
              {t('myListings.createFirst')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {listings.map((listing, index) => (
              <div
                key={listing.id}
                className="bg-card border-2 border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="size-16 text-muted-foreground" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-foreground mb-1 truncate">{listing.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {listing.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-primary">
                      Rp {listing.price.toLocaleString()}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        listing.status === 'available'
                          ? 'bg-primary/10 text-primary'
                          : listing.status === 'sold'
                          ? 'bg-muted text-muted-foreground line-through'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {t(`myListings.${listing.status}`)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/listings/${listing.id}`}
                      className="flex-1 py-2 text-center rounded-lg border-2 border-border hover:bg-accent transition-all duration-300 text-sm font-medium"
                    >
                      {t('myListings.view')}
                    </Link>
                    <button
                      onClick={() => deleteListing(listing.id)}
                      className="p-2 rounded-lg border-2 border-destructive/20 text-destructive hover:bg-destructive/10 transition"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
}
