import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { supabase } from '../../../utils/supabase/client';
import { ArrowLeft, MapPin, Tag, User, Star, MessageCircle, ShoppingBag } from 'lucide-react';
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
  whatsapp_number: string;
  created_at: string;
}

interface Seller {
  id: string;
  name: string;
  campus: string;
  rating: number;
  transaction_count: number;
  trust_badge: boolean;
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

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (id) fetchListing(id);
  }, [id]);

  const fetchListing = async (listingId: string) => {
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', listingId)
        .single();

      if (productError) throw productError;
      setListing(product);

      if (product?.seller_id) {
        const { data: sellerData } = await supabase
          .from('profiles')
          .select('id, name, campus, rating, transaction_count, trust_badge')
          .eq('id', product.seller_id)
          .single();

        if (sellerData) setSeller(sellerData);
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{t('listing.notFound')}</h2>
            <Link to="/home" className="text-primary hover:underline">{t('listing.back')}</Link>
          </div>
        </div>
      </Layout>
    );
  }

  const isOwnListing = listing.seller_id === user?.id;
  const hasWhatsApp = listing.whatsapp_number?.trim().length > 0;

  const startChat = async () => {
    if (!user || isOwnListing) return;
    setStartingChat(true);
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('seller_id', listing.seller_id)
        .eq('product_id', listing.id)
        .maybeSingle();

      if (existing) { navigate(`/conversations?conv=${existing.id}`); return; }

      const { data: created, error } = await supabase
        .from('conversations')
        .insert({
          buyer_id: user.id,
          seller_id: listing.seller_id,
          product_id: listing.id,
          product_title: listing.title,
          last_message: '',
        })
        .select('id')
        .single();

      if (error) throw error;
      navigate(`/conversations?conv=${created.id}`);
    } catch (err) {
      console.error('startChat:', err);
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors duration-300 animate-fade-in"
          >
            <ArrowLeft className="size-5" />
            {t('listing.back')}
          </button>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Images */}
            <div>
              <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-4 flex items-center justify-center">
                {listing.images?.length > 0 ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="size-24 text-muted-foreground" />
                )}
              </div>
              {listing.images?.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {listing.images.slice(1, 5).map((img, i) => (
                    <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img src={img} alt={`${listing.title} ${i + 2}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{listing.title}</h1>
                <div className="text-4xl font-bold text-primary mb-4">
                  Rp {listing.price.toLocaleString()}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-accent rounded-full text-sm font-medium flex items-center gap-1">
                    <MapPin className="size-4" />
                    {listing.campus}
                  </span>
                  <span className="px-3 py-1 bg-secondary/20 rounded-full text-sm font-medium flex items-center gap-1">
                    <Tag className="size-4" />
                    {listing.category}
                  </span>
                </div>
              </div>

              <div className="border-t-2 border-border pt-6">
                <h3 className="font-bold text-foreground mb-2">{t('listing.description')}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
              </div>

              {/* Seller card */}
              {seller && (
                <div className="border-2 border-border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="size-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-2">
                          {seller.name}
                          {seller.trust_badge && (
                            <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
                              {t('listing.trusted')}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{seller.campus}</div>
                      </div>
                    </div>
                    {seller.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="size-5 fill-secondary text-secondary" />
                        <span className="font-bold">{Number(seller.rating).toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({seller.transaction_count})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Buyer actions */}
              {!isOwnListing && (
                <div className="space-y-3">
                  {hasWhatsApp && (
                    <button
                      onClick={() => openWhatsApp(listing.whatsapp_number, listing.title)}
                      className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <MessageCircle className="size-5" />
                      {language === 'en' ? 'Contact Seller via WhatsApp' : 'Hubungi Penjual via WhatsApp'}
                    </button>
                  )}
                  <button
                    onClick={startChat}
                    disabled={startingChat}
                    className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    <MessageCircle className="size-5" />
                    {startingChat
                      ? (language === 'en' ? 'Opening chat…' : 'Membuka chat…')
                      : (language === 'en' ? 'Chat with Seller' : 'Chat dengan Penjual')}
                  </button>
                </div>
              )}

              {/* Own listing notice */}
              {isOwnListing && (
                <div className="bg-accent/50 border-2 border-border rounded-xl p-4 text-center">
                  <p className="text-muted-foreground mb-2">{t('listing.yourListing')}</p>
                  <Link
                    to="/my-listings"
                    className="text-primary font-medium hover:underline transition-colors duration-300"
                  >
                    {t('listing.manageListings')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
