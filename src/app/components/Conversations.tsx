import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { supabase } from '../../../utils/supabase/client';
import { MessageCircle, Send, ArrowLeft, Search, ShoppingBag } from 'lucide-react';
import Layout from './Layout';

interface ConvUser { id: string; name: string; campus: string; }

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  product_title: string;
  last_message: string;
  last_message_at: string;
  created_at: string;
  buyer: ConvUser;
  seller: ConvUser;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function Conversations() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(searchParams.get('conv'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(!!searchParams.get('conv'));
  const [search, setSearch] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null;
  const otherUser = activeConv
    ? (activeConv.buyer_id === user?.id ? activeConv.seller : activeConv.buyer)
    : null;

  // ── Load all conversations ──────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConvs(true);
    try {
      const { data: rawConvs, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      if (!rawConvs?.length) { setConversations([]); return; }

      const ids = [...new Set(rawConvs.flatMap(c => [c.buyer_id, c.seller_id]))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, campus')
        .in('id', ids);

      const pMap = new Map((profiles ?? []).map(p => [p.id, p as ConvUser]));
      const fallback = (id: string): ConvUser => ({ id, name: 'Unknown', campus: '' });

      setConversations(
        rawConvs.map(c => ({
          ...c,
          buyer: pMap.get(c.buyer_id) ?? fallback(c.buyer_id),
          seller: pMap.get(c.seller_id) ?? fallback(c.seller_id),
        }))
      );
    } catch (err) {
      console.error('loadConversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  }, [user?.id]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Load messages for active conversation ───────────────────────────
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data ?? []);
    } catch (err) {
      console.error('loadMessages:', err);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  // ── Realtime subscription ───────────────────────────────────────────
  const subscribeMessages = useCallback((convId: string) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase
      .channel(`msgs-${convId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
          setConversations(prev =>
            prev
              .map(c => c.id === convId ? { ...c, last_message: msg.content, last_message_at: msg.created_at } : c)
              .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
          );
        }
      )
      .subscribe();
  }, []);

  useEffect(() => {
    if (!activeConvId) return;
    setMessages([]);
    loadMessages(activeConvId);
    subscribeMessages(activeConvId);
    return () => {
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    };
  }, [activeConvId, loadMessages, subscribeMessages]);

  // ── Auto-scroll to bottom ───────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectConv = (id: string) => {
    setActiveConvId(id);
    setMobileShowChat(true);
  };

  // ── Send message ────────────────────────────────────────────────────
  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || !activeConvId || !user || sending) return;
    setSending(true);
    setNewMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: activeConvId,
        sender_id: user.id,
        content,
      });
      if (error) throw error;
      await supabase
        .from('conversations')
        .update({ last_message: content, last_message_at: new Date().toISOString() })
        .eq('id', activeConvId);
    } catch (err) {
      console.error('sendMessage:', err);
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const onTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toDateString() === new Date().toDateString()
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredConvs = conversations.filter(c => {
    if (!search) return true;
    const other = c.buyer_id === user?.id ? c.seller : c.buyer;
    const q = search.toLowerCase();
    return other.name.toLowerCase().includes(q) || c.product_title.toLowerCase().includes(q);
  });

  return (
    <Layout fullHeight>
      <div className="h-full flex overflow-hidden">

        {/* ══ Left panel: conversation list ══════════════════════════════ */}
        <div className={`flex flex-col bg-card border-r border-border shrink-0 w-full md:w-72 lg:w-80 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>

          <div className="px-4 py-3 border-b border-border shrink-0">
            <h2 className="text-base font-bold text-foreground mb-2.5">
              {language === 'en' ? 'Messages' : 'Pesan'}
            </h2>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border">
              <Search className="size-3.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={language === 'en' ? 'Search conversations…' : 'Cari percakapan…'}
                className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex justify-center items-center py-16">
                <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center gap-2">
                <MessageCircle className="size-12 text-muted-foreground opacity-40" />
                <p className="text-sm font-semibold text-foreground">
                  {language === 'en' ? 'No conversations yet' : 'Belum ada percakapan'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'en'
                    ? 'Start a conversation from a product listing'
                    : 'Mulai percakapan dari halaman produk'}
                </p>
              </div>
            ) : (
              filteredConvs.map(conv => {
                const other = conv.buyer_id === user?.id ? conv.seller : conv.buyer;
                const isActive = conv.id === activeConvId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConv(conv.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all border-b border-border/40 border-l-[3px] hover:bg-accent/40 ${
                      isActive ? 'bg-primary/5 border-l-primary' : 'border-l-transparent'
                    }`}
                  >
                    <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-sm font-bold text-primary">{other.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1 mb-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">{other.name}</p>
                        <p className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{fmtTime(conv.last_message_at)}</p>
                      </div>
                      {conv.product_title && (
                        <p className="text-[10px] text-primary truncate mb-0.5 flex items-center gap-0.5">
                          <ShoppingBag className="size-2.5 shrink-0" />
                          {conv.product_title}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.last_message || (language === 'en' ? 'No messages yet' : 'Belum ada pesan')}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ══ Right panel: chat area ══════════════════════════════════════ */}
        <div className={`flex-1 flex flex-col overflow-hidden ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>

          {!activeConvId ? (
            /* No conversation selected */
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <MessageCircle className="size-16 text-muted-foreground opacity-30" />
              <p className="text-base font-semibold text-foreground">
                {language === 'en' ? 'Select a conversation' : 'Pilih percakapan'}
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {language === 'en'
                  ? 'Choose a conversation from the left panel'
                  : 'Pilih percakapan dari panel kiri'}
              </p>
            </div>

          ) : !activeConv ? (
            /* activeConvId set but conversations still loading */
            <div className="flex items-center justify-center h-full">
              <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>

          ) : (
            /* Active conversation */
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-border flex items-center gap-3 shrink-0 bg-card">
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-1.5 -ml-1 rounded-md hover:bg-accent transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {otherUser?.name.charAt(0).toUpperCase() ?? '?'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">{otherUser?.name}</p>
                  {activeConv.product_title && (
                    <p className="text-xs text-muted-foreground truncate">
                      {language === 'en' ? 're: ' : 'tentang: '}{activeConv.product_title}
                    </p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 bg-background">
                {loadingMsgs ? (
                  <div className="flex justify-center py-12">
                    <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-sm text-muted-foreground">
                      {language === 'en'
                        ? 'No messages yet. Start the conversation!'
                        : 'Belum ada pesan. Mulai percakapan!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map(msg => {
                      const mine = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            mine
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-card border border-border text-foreground rounded-bl-sm'
                          }`}>
                            <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-[10px] mt-0.5 ${mine ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground'}`}>
                              {fmtTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {/* Message input */}
              <div className="px-4 py-3 border-t border-border flex items-end gap-2 shrink-0 bg-card">
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={onTextareaChange}
                  onKeyDown={onKeyDown}
                  placeholder={language === 'en' ? 'Type a message…' : 'Ketik pesan…'}
                  rows={1}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-all overflow-hidden"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="size-9 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-all"
                  aria-label={language === 'en' ? 'Send' : 'Kirim'}
                >
                  <Send className="size-4" />
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </Layout>
  );
}
