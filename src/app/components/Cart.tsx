import { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { useUserMode } from './UserModeContext';
import { supabase } from '../../../utils/supabase/client';
import { Heart, ShoppingBag, MessageCircle, Trash2, MapPin, Tag } from 'lucide-react';
import Layout from './Layout';

interface WishlistItem {
  wishlist_id: string;
  id: string;
  title: string;
  price: number;
  category: string;
  campus: string;
  images: string[];
  whatsapp_number: string;
  seller_id: string;
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

export default function Cart() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { mode } = useUserMode();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // All hooks must be declared before any conditional return
  const fetchWishlist = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Step 1: fetch wishlist rows
      const { data: rows, error } = await supabase
        .from('wishlists')
        .select('id, product_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!rows?.length) { setItems([]); return; }

      // Step 2: fetch product details
      const productIds = rows.map((r) => r.product_id);
      const { data: products } = await supabase
        .from('products')
        .select('id, title, price, category, campus, images, whatsapp_number, seller_id')
        .in('id', productIds);

      const productMap = Object.fromEntries((products ?? []).map((p) => [p.id, p]));
      const merged: WishlistItem[] = rows
        .filter((r) => productMap[r.product_id])
        .map((r) => ({ wishlist_id: r.id, ...productMap[r.product_id] }));

      setItems(merged);
    } catch (err) {
      console.error('fetchWishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  // Conditional return must come AFTER all hooks
  if (mode === 'seller') return <Navigate to="/home" replace />;

  const removeItem = async (wishlistId: string) => {
    await supabase.from('wishlists').delete().eq('id', wishlistId);
    setItems((prev) => prev.filter((item) => item.wishlist_id !== wishlistId));
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Heart className="size-6 text-primary fill-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {language === 'en' ? 'My Wishlist' : 'Wishlist Saya'}
            </h1>
            {items.length > 0 && (
              <span className="ml-auto text-sm text-muted-foreground">
                {items.length} {language === 'en' ? 'item(s)' : 'produk'}
              </span>
            )}
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>

          /* Empty state */
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="rounded-full bg-muted p-6">
                <Heart className="size-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                {language === 'en' ? 'Your wishlist is empty' : 'Wishlist kamu masih kosong'}
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                {language === 'en'
                  ? 'Save products you like by tapping the heart icon in the catalog.'
                  : 'Simpan produk yang kamu suka dengan menekan ikon hati di katalog.'}
              </p>
              <Link
                to="/home"
                className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                {language === 'en' ? 'Browse Products' : 'Jelajahi Produk'}
              </Link>
            </div>

          /* Product list */
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((item) => (
                <div
                  key={item.wishlist_id}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary hover:shadow-lg transition-all duration-300 flex flex-col"
                >
                  {/* Product info */}
                  <Link to={`/listings/${item.id}`} className="flex gap-4 p-4">
                    <div className="size-20 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {item.images?.length > 0 ? (
                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="size-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate mb-1">
                        {item.title}
                      </h3>
                      <p className="text-base font-bold text-primary mb-2">
                        Rp {item.price.toLocaleString()}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                          <MapPin className="size-3" /> {item.campus}
                        </span>
                        <span className="text-xs bg-secondary/20 text-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Tag className="size-3" /> {item.category}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Action buttons */}
                  <div className="px-4 pb-4 flex gap-2 mt-auto">
                    {item.whatsapp_number?.trim() && (
                      <button
                        onClick={() => openWhatsApp(item.whatsapp_number, item.title)}
                        className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="size-3.5" />
                        {language === 'en' ? 'Contact via WhatsApp' : 'Hubungi via WhatsApp'}
                      </button>
                    )}
                    <button
                      onClick={() => removeItem(item.wishlist_id)}
                      className="p-2 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                      title={language === 'en' ? 'Remove from wishlist' : 'Hapus dari wishlist'}
                    >
                      <Trash2 className="size-4" />
                    </button>
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
