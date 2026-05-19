import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { serverUrl } from '../../../utils/supabase/client';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import Layout from './Layout';

export default function Conversations() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${serverUrl}/conversations`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
          <div className="flex items-center gap-4 mb-6 sm:mb-8 animate-fade-in">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-accent transition-all duration-300"
            >
              <ArrowLeft className="size-5 sm:size-6" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('conversations.title')}</h1>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-lg text-muted-foreground">{t('conversations.loading')}</div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 bg-card border-2 border-border rounded-xl animate-scale-in">
              <MessageCircle className="size-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">{t('conversations.noConversations')}</h3>
              <p className="text-muted-foreground px-4">
                {t('conversations.startChatting')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-card border-2 border-border rounded-xl p-6 text-center text-muted-foreground">
                {t('conversations.startChatting')}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
