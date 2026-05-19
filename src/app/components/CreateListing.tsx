import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { serverUrl } from '../../../utils/supabase/client';
import { ArrowLeft, Upload } from 'lucide-react';
import Layout from './Layout';

export default function CreateListing() {
  const { user, session } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [campus, setCampus] = useState(user?.campus || 'Ketintang');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const CATEGORIES = ['Electronics', 'Books', 'Furniture', 'Clothing', 'Sports', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${serverUrl}/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          category,
          campus,
          images: [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create listing');
      }

      navigate('/my-listings');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-6 sm:mb-8 animate-fade-in">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-accent transition-all duration-300"
          >
            <ArrowLeft className="size-5 sm:size-6" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('createListing.title')}</h1>
        </div>

        <div className="bg-card border-2 border-border rounded-xl p-4 sm:p-6 shadow-lg animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border-2 border-destructive text-destructive text-sm animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-foreground mb-2 font-medium text-sm sm:text-base">
                {t('createListing.listingTitle')}
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 rounded-lg bg-input-background border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                placeholder={t('createListing.titlePlaceholder')}
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-foreground mb-2 font-medium text-sm sm:text-base">
                {t('createListing.description')}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 rounded-lg bg-input-background border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-32 transition-all duration-300"
                placeholder={t('createListing.descPlaceholder')}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-foreground mb-2 font-medium text-sm sm:text-base">
                  {t('createListing.price')}
                </label>
                <input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 rounded-lg bg-input-background border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  placeholder="50000"
                  required
                  min="0"
                  step="1000"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-foreground mb-2 font-medium text-sm sm:text-base">
                  {t('createListing.category')}
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 rounded-lg bg-input-background border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="campus" className="block text-foreground mb-2 font-medium text-sm sm:text-base">
                {t('createListing.campus')}
              </label>
              <select
                id="campus"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 rounded-lg bg-input-background border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                required
              >
                <option value="Ketintang">Ketintang</option>
                <option value="Lidah Wetan">Lidah Wetan</option>
                <option value="Magetan">Magetan</option>
              </select>
            </div>

            <div className="border-2 border-dashed border-border rounded-xl p-6 sm:p-8 text-center bg-muted/30">
              <Upload className="size-10 sm:size-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground mb-2">{t('createListing.imageUpload')}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('createListing.imageHelp')}
              </p>
            </div>

            <div className="flex gap-3 sm:gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 py-2.5 sm:py-3 rounded-lg border-2 border-border hover:bg-accent transition-all duration-300 font-medium text-sm sm:text-base"
              >
                {t('createListing.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 sm:py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:shadow-lg transition-all duration-300 disabled:opacity-50 transform hover:scale-[1.02] text-sm sm:text-base"
              >
                {loading ? t('createListing.creating') : t('createListing.create')}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </Layout>
  );
}
