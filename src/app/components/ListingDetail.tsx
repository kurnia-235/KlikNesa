import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { serverUrl } from '../../../utils/supabase/client';
import { ArrowLeft, MapPin, Tag, User, Send, Star, MessageCircle } from 'lucide-react';
import Layout from './Layout';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  campus: string;
  images: string[];
  sellerId: string;
  createdAt: string;
}

interface Seller {
  name: string;
  campus: string;
  rating: number;
  transactionCount: number;
  trustBadge: boolean;
}

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export default function ListingDetail() {
  const { id } = useParams();
  const { user, session } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

  useEffect(() => {
    if (showChat && seller) {
      fetchMessages();
    }
  }, [showChat, seller]);

  const fetchListing = async () => {
    try {
      const response = await fetch(`${serverUrl}/listings/${id}`);
      const data = await response.json();
      setListing(data.listing);
      setSeller(data.seller);
    } catch (error) {
      console.error('Error fetching listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!seller || !listing) return;

    try {
      const response = await fetch(
        `${serverUrl}/conversations/${listing.id}/${seller.id || listing.sellerId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !listing) return;

    try {
      const response = await fetch(`${serverUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          listingId: listing.id,
          recipientId: listing.sellerId,
          content: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startTransaction = async (paymentMethod: string) => {
    if (!listing) return;

    try {
      const response = await fetch(`${serverUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          listingId: listing.id,
          paymentMethod,
          meetingLocation: listing.campus,
        }),
      });

      if (response.ok) {
        alert('Transaction initiated! Please coordinate with the seller via chat.');
        setShowChat(true);
      }
    } catch (error) {
      console.error('Error starting transaction:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="inline-block size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
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
            <Link to="/home" className="text-primary hover:underline">
              {t('listing.back')}
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const isOwnListing = listing.sellerId === user?.id;

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
          <div>
            <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-4">
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Tag className="size-24 text-muted-foreground" />
                </div>
              )}
            </div>
            {listing.images && listing.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {listing.images.slice(1, 5).map((img, i) => (
                  <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img src={img} alt={`${listing.title} ${i + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{listing.title}</h1>
              <div className="text-4xl font-bold text-primary mb-4">
                Rp {listing.price.toLocaleString()}
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-accent rounded-full text-sm font-medium flex items-center gap-1">
                  <MapPin className="size-4" />
                  {listing.campus}
                </span>
                <span className="px-3 py-1 bg-secondary/20 rounded-full text-sm font-medium">
                  {listing.category}
                </span>
              </div>
            </div>

            <div className="border-t-2 border-border pt-6">
              <h3 className="font-bold text-foreground mb-2">{t('listing.description')}</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
            </div>

            {seller && (
              <div className="border-2 border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="size-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-2">
                        {seller.name}
                        {seller.trustBadge && (
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
                      <span className="font-bold">{seller.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({seller.transactionCount})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isOwnListing && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="w-full py-3 rounded-lg border-2 border-primary text-primary font-medium hover:bg-primary/10 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="size-5" />
                  {showChat ? t('listing.hideChat') : t('listing.contactSeller')}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => startTransaction('COD')}
                    className="py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:shadow-md transition-all duration-300"
                  >
                    {t('listing.buyWithCOD')}
                  </button>
                  <button
                    onClick={() => startTransaction('E-Wallet')}
                    className="py-3 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/90 hover:shadow-md transition-all duration-300"
                  >
                    {t('listing.buyWithEWallet')}
                  </button>
                </div>
              </div>
            )}

            {isOwnListing && (
              <div className="bg-accent/50 border-2 border-border rounded-xl p-4 text-center">
                <p className="text-muted-foreground">{t('listing.yourListing')}</p>
                <Link
                  to="/my-listings"
                  className="text-primary font-medium hover:underline transition-colors duration-300"
                >
                  {t('listing.manageListings')}
                </Link>
              </div>
            )}

            {showChat && !isOwnListing && (
              <div className="border-2 border-border rounded-xl p-4 space-y-4 animate-scale-in">
                <h3 className="font-bold text-foreground">{t('listing.chatWithSeller')}</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t('listing.noMessages')}
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.senderId === user?.id
                            ? 'bg-primary text-primary-foreground ml-8'
                            : 'bg-muted mr-8'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={t('listing.typeMessage')}
                    className="flex-1 px-4 py-2 rounded-lg bg-input-background border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
                  >
                    <Send className="size-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
}
