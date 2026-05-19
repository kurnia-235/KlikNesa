import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { serverUrl } from '../../../utils/supabase/client';
import { ArrowLeft, Users, AlertTriangle, ShoppingBag } from 'lucide-react';
import Layout from './Layout';

export default function AdminDashboard() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [usersRes, reportsRes] = await Promise.all([
        fetch(`${serverUrl}/admin/users`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }),
        fetch(`${serverUrl}/admin/reports`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }),
      ]);

      const usersData = await usersRes.json();
      const reportsData = await reportsRes.json();

      setUsers(usersData.users || []);
      setReports(reportsData.reports || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-4 mb-6 sm:mb-8 animate-fade-in">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-accent transition-all duration-300"
            >
              <ArrowLeft className="size-5 sm:size-6" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('admin.title')}</h1>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-lg text-muted-foreground">{t('admin.loading')}</div>
            </div>
          ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-card border-2 border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 animate-slide-up">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="size-8 text-primary" />
                  <div className="text-3xl font-bold text-foreground">{users.length}</div>
                </div>
                <div className="text-muted-foreground">{t('admin.totalUsers')}</div>
              </div>

              <div className="bg-card border-2 border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="size-8 text-destructive" />
                  <div className="text-3xl font-bold text-foreground">{reports.length}</div>
                </div>
                <div className="text-muted-foreground">{t('admin.reports')}</div>
              </div>

              <div className="bg-card border-2 border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 animate-slide-up" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingBag className="size-8 text-secondary" />
                  <div className="text-3xl font-bold text-foreground">-</div>
                </div>
                <div className="text-muted-foreground">{t('admin.activeListings')}</div>
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-4">{t('admin.recentUsers')}</h2>
              {users.length === 0 ? (
                <p className="text-muted-foreground">{t('admin.noUsers')}</p>
              ) : (
                <div className="space-y-3">
                  {users.slice(0, 10).map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div>
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <div className="text-sm">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {user.campus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card border-2 border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-4">{t('admin.reports')}</h2>
              {reports.length === 0 ? (
                <p className="text-muted-foreground">{t('admin.noReports')}</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((report: any) => (
                    <div
                      key={report.id}
                      className="p-4 rounded-lg bg-destructive/5 border-2 border-destructive/20"
                    >
                      <div className="font-medium text-foreground mb-1">{report.reason}</div>
                      <div className="text-sm text-muted-foreground">{report.description}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(report.createdAt).toLocaleString()}
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
