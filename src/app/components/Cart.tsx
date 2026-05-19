import { Navigate } from 'react-router';
import Layout from './Layout';
import { ShoppingCart } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useUserMode } from './UserModeContext';

export default function Cart() {
  const { language } = useLanguage();
  const { mode } = useUserMode();

  if (mode === 'seller') return <Navigate to="/home" replace />;

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="rounded-full bg-muted p-6">
          <ShoppingCart className="size-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          {language === 'en' ? 'Your Cart' : 'Keranjang Belanja'}
        </h2>
        <p className="text-muted-foreground max-w-xs">
          {language === 'en'
            ? 'Your cart is empty. Browse listings to add items.'
            : 'Keranjangmu masih kosong. Jelajahi listing untuk menambahkan barang.'}
        </p>
      </div>
    </Layout>
  );
}
