import { Link } from 'react-router';
import { useAuth } from './AuthContext';
import Layout from './Layout';
import { ShoppingBag, Plus, MessageCircle, ListOrdered, Star, Shield } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  const quickActions = [
    {
      label: 'Jelajahi Listing',
      description: 'Temukan barang yang kamu butuhkan',
      icon: ShoppingBag,
      to: '/home',
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    },
    {
      label: 'Buat Listing',
      description: 'Jual barangmu sekarang',
      icon: Plus,
      to: '/create-listing',
      color: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    },
    {
      label: 'Listing Saya',
      description: 'Kelola barang yang kamu jual',
      icon: ListOrdered,
      to: '/my-listings',
      color: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
    },
    {
      label: 'Pesan',
      description: 'Lihat percakapan aktif',
      icon: MessageCircle,
      to: '/conversations',
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    },
  ];

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Selamat datang, {user?.name ?? 'Pengguna'} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Kampus: {user?.campus ?? '-'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-3">
              <Star className="size-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rating</p>
              <p className="text-xl font-semibold text-foreground">
                {user?.rating?.toFixed(1) ?? '—'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
              <ShoppingBag className="size-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
              <p className="text-xl font-semibold text-foreground">
                {user?.transactionCount ?? 0}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3">
              <Shield className="size-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trust Badge</p>
              <p className="text-xl font-semibold text-foreground">
                {user?.trustBadge ? 'Terverifikasi' : 'Belum'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className={`rounded-lg p-3 w-fit ${action.color}`}>
                  <action.icon className="size-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{action.label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
