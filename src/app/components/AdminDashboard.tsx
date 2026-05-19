import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { supabase } from '../../../utils/supabase/client';
import { ShoppingBag, Users, CheckCircle2, RefreshCw, UserCheck, Clock, Send } from 'lucide-react';
import Layout from './Layout';

interface Metrics {
  listings: number;
  users: number;
  transactions: number;
}

interface PendingSeller {
  id: string;
  name: string;
  email: string;
  campus: string;
  whatsapp_number: string;
  ktm_url: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [metrics, setMetrics]           = useState<Metrics>({ listings: 0, users: 0, transactions: 0 });
  const [pendingSellers, setPendingSellers] = useState<PendingSeller[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [approvingId, setApprovingId]   = useState<string | null>(null);
  const [approveMsg, setApproveMsg]     = useState<{ id: string; ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (user?.email?.endsWith('@admin.com')) fetchAll();
  }, [user]);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [listingsRes, usersRes, trxRes, pendingRes] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('transaction_count'),
        supabase
          .from('profiles')
          .select('id, name, email, campus, whatsapp_number, ktm_url, created_at')
          .eq('seller_status', 'pending')
          .order('created_at', { ascending: true }),
      ]);

      const totalTrx = (trxRes.data ?? []).reduce(
        (sum, row: any) => sum + (row.transaction_count ?? 0), 0,
      );

      setMetrics({
        listings:     listingsRes.count ?? 0,
        users:        usersRes.count    ?? 0,
        transactions: totalTrx,
      });
      setPendingSellers((pendingRes.data ?? []) as PendingSeller[]);
    } catch (err) {
      console.error('[AdminDashboard] fetchAll error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const approveSeller = async (seller: PendingSeller) => {
    setApprovingId(seller.id);
    setApproveMsg(null);

    try {
      // 1. Update status di database
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ seller_status: 'verified', verified: true })
        .eq('id', seller.id);

      if (updateErr) throw updateErr;

      // 2. Kirim notifikasi WhatsApp via Edge Function
      if (seller.whatsapp_number) {
        const { error: waErr } = await supabase.functions.invoke('server', {
          body: {
            route: 'send-verification-success',
            phone: seller.whatsapp_number,
            name:  seller.name,
          },
        });
        if (waErr) {
          console.warn('[approve] WA notif gagal (seller tetap disetujui):', waErr);
        }
      }

      // 3. Hapus dari list pending
      setPendingSellers((prev) => prev.filter((s) => s.id !== seller.id));
      setApproveMsg({ id: seller.id, ok: true, text: `✓ ${seller.name} berhasil disetujui & notifikasi WA terkirim.` });
    } catch (err: any) {
      console.error('[approve] error:', err);
      setApproveMsg({ id: seller.id, ok: false, text: `Gagal menyetujui: ${err.message ?? String(err)}` });
    } finally {
      setApprovingId(null);
    }
  };

  const metricCards = [
    { icon: ShoppingBag, label: t('admin.totalListings'),     value: metrics.listings,     iconColor: 'text-primary',    bgColor: 'bg-primary/10',    delay: '0ms' },
    { icon: Users,       label: t('admin.totalUsers'),        value: metrics.users,        iconColor: 'text-blue-500',   bgColor: 'bg-blue-500/10',   delay: '80ms' },
    { icon: CheckCircle2,label: t('admin.totalTransactions'), value: metrics.transactions, iconColor: 'text-green-500',  bgColor: 'bg-green-500/10',  delay: '160ms' },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('admin.title')}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Global KlikNesa</p>
            </div>
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              title="Perbarui data"
            >
              <RefreshCw className={`size-4 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground text-sm">{t('admin.loading')}</p>
            </div>
          ) : (
            <div className="space-y-8">

              {/* Metric cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {metricCards.map((card) => (
                  <div
                    key={card.label}
                    className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow duration-300 animate-slide-up"
                    style={{ animationDelay: card.delay }}
                  >
                    <div className={`inline-flex p-2.5 rounded-lg mb-4 ${card.bgColor}`}>
                      <card.icon className={`size-5 ${card.iconColor}`} />
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {card.value.toLocaleString('id-ID')}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Pending sellers panel */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Clock className="size-4 text-amber-500" />
                    Verifikasi Penjual Menunggu
                  </h2>
                  <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full font-medium">
                    {pendingSellers.length} pending
                  </span>
                </div>

                {/* Pesan hasil approve */}
                {approveMsg && (
                  <div className={`mx-6 mt-4 px-4 py-2.5 rounded-lg text-sm font-medium ${
                    approveMsg.ok
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/40'
                      : 'bg-destructive/10 text-destructive border border-destructive/30'
                  }`}>
                    {approveMsg.text}
                  </div>
                )}

                {pendingSellers.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <UserCheck className="size-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-sm text-muted-foreground">Tidak ada pengajuan penjual yang menunggu.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {pendingSellers.map((seller) => (
                      <div key={seller.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Info penjual */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">{seller.name}</p>
                          <p className="text-sm text-muted-foreground">{seller.email}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                            <span>📍 {seller.campus}</span>
                            {seller.whatsapp_number && <span>📱 {seller.whatsapp_number}</span>}
                            <span>🕐 {new Date(seller.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>

                        {/* Foto KTM + tombol approve */}
                        <div className="flex items-center gap-3 shrink-0">
                          {seller.ktm_url && (
                            <a
                              href={seller.ktm_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline hover:text-primary/80 transition-colors whitespace-nowrap"
                            >
                              Lihat KTM
                            </a>
                          )}
                          <button
                            onClick={() => approveSeller(seller)}
                            disabled={approvingId === seller.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-800 transition-colors disabled:opacity-60 whitespace-nowrap"
                          >
                            {approvingId === seller.id ? (
                              <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send className="size-3.5" />
                            )}
                            {approvingId === seller.id ? 'Memproses…' : 'Setujui & Notifikasi'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
