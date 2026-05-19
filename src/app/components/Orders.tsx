import { Navigate } from 'react-router';
import Layout from './Layout';
import { ClipboardList } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useUserMode } from './UserModeContext';

export default function Orders() {
  const { language } = useLanguage();
  const { mode } = useUserMode();

  if (mode === 'seller') return <Navigate to="/home" replace />;

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="rounded-full bg-muted p-6">
          <ClipboardList className="size-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          {language === 'en' ? 'Purchase History' : 'Riwayat Belanja'}
        </h2>
        <p className="text-muted-foreground max-w-xs">
          {language === 'en'
            ? 'You have no purchase history yet.'
            : 'Belum ada riwayat pembelian.'}
        </p>
      </div>
    </Layout>
  );
}
