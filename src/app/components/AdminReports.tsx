import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { supabase } from '../../../utils/supabase/client';
import { AlertTriangle, CheckCircle2, Inbox, RefreshCw } from 'lucide-react';
import Layout from './Layout';

interface Report {
  id: string;
  reporter_id: string | null;
  product_id: string | null;
  report_type: string;
  description: string;
  status: string;
  created_at: string;
  reporter?: { name: string; email: string } | null;
  product?: { title: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  open:       'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  reviewing:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  resolved:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  dismissed:  'bg-muted text-muted-foreground',
};

export default function AdminReports() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.email?.endsWith('@admin.com')) fetchReports();
  }, [user]);

  const fetchReports = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data } = await supabase
        .from('reports')
        .select(`
          id, reporter_id, product_id, report_type, description, status, created_at,
          reporter:profiles!reporter_id ( name, email ),
          product:products!product_id ( title )
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      setReports((data ?? []) as Report[]);
    } catch (err) {
      console.error('[AdminReports] fetchReports error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const total    = reports.length;
  const resolved = reports.filter((r) => r.status === 'resolved').length;
  const open     = reports.filter((r) => r.status === 'open').length;

  const metricCards = [
    {
      icon: AlertTriangle,
      label: t('admin.totalReports'),
      value: total,
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/10',
      delay: '0ms',
    },
    {
      icon: CheckCircle2,
      label: t('admin.resolvedReports'),
      value: resolved,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-500/10',
      delay: '80ms',
    },
    {
      icon: Inbox,
      label: t('admin.openReports'),
      value: open,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      delay: '160ms',
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('admin.reportsTitle')}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Global KlikNesa</p>
            </div>
            <button
              onClick={() => fetchReports(true)}
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

              {/* Tabel laporan */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="size-4 text-destructive" />
                    {t('admin.reports')}
                  </h2>
                  <span className="text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full font-medium">
                    {total} {t('admin.totalReports').toLowerCase()}
                  </span>
                </div>

                {reports.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <Inbox className="size-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-muted-foreground text-sm">{t('admin.noReports')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="text-left px-6 py-3 font-semibold text-muted-foreground whitespace-nowrap">Pelapor</th>
                          <th className="text-left px-6 py-3 font-semibold text-muted-foreground whitespace-nowrap">Produk</th>
                          <th className="text-left px-6 py-3 font-semibold text-muted-foreground whitespace-nowrap">Jenis</th>
                          <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Deskripsi</th>
                          <th className="text-left px-6 py-3 font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                          <th className="text-left px-6 py-3 font-semibold text-muted-foreground whitespace-nowrap">Tanggal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {reports.map((r) => (
                          <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-medium text-foreground whitespace-nowrap">
                                {(r.reporter as any)?.name ?? '—'}
                              </p>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {(r.reporter as any)?.email ?? r.reporter_id?.slice(0, 8) ?? '—'}
                              </p>
                            </td>
                            <td className="px-6 py-4 max-w-[140px]">
                              <span className="text-foreground line-clamp-2">
                                {(r.product as any)?.title ?? (r.product_id ? r.product_id.slice(0, 8) + '…' : '—')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap capitalize text-foreground">
                              {r.report_type}
                            </td>
                            <td className="px-6 py-4 max-w-[220px]">
                              <p className="text-muted-foreground line-clamp-2">{r.description || '—'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${STATUS_COLORS[r.status] ?? STATUS_COLORS.dismissed}`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-xs">
                              {new Date(r.created_at).toLocaleDateString('id-ID', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
