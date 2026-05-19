import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { supabase } from '../../../utils/supabase/client';
import { ArrowLeft, Upload, X, Phone } from 'lucide-react';
import Layout from './Layout';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE_MB = 5;

export default function CreateListing() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [campus, setCampus] = useState(user?.campus || 'Ketintang');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const CATEGORIES = ['Electronics', 'Books', 'Furniture', 'Clothing', 'Sports', 'Other'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(language === 'en'
        ? 'Only JPG, JPEG, and PNG files are allowed.'
        : 'Hanya file JPG, JPEG, dan PNG yang diperbolehkan.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(language === 'en'
        ? `File too large. Maximum size is ${MAX_SIZE_MB}MB.`
        : `File terlalu besar. Ukuran maksimal ${MAX_SIZE_MB}MB.`);
      return;
    }

    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Bangun array gambar secara eksplisit sebagai string[] agar sesuai tipe kolom TEXT[]
      const images: string[] = [];

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `${user!.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, imageFile, { contentType: imageFile.type, upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(path);

        images.push(urlData.publicUrl);
      }

      const { error: insertError } = await supabase
        .from('products')
        .insert({
          title,
          description,
          price: parseFloat(price),
          category,
          campus,
          seller_id: user!.id,
          status: 'available',
          images,
          whatsapp_number: whatsappNumber,
        });

      if (insertError) throw insertError;

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

              {/* Image Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary transition-colors duration-300 bg-muted/30"
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 sm:h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-sm font-medium">{t('createListing.imageChange')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 size-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 sm:p-10 text-center">
                      <Upload className="size-10 sm:size-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm sm:text-base text-muted-foreground mb-1 font-medium">
                        {t('createListing.imageUpload')}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('createListing.imageHelp')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
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

              {/* Description */}
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

              {/* Price & Category */}
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
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Campus */}
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

              {/* WhatsApp Number */}
              <div>
                <label htmlFor="whatsapp" className="block text-foreground mb-2 font-medium text-sm sm:text-base flex items-center gap-2">
                  <Phone className="size-4 text-green-500" />
                  {t('createListing.whatsapp')}
                </label>
                <input
                  id="whatsapp"
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 rounded-lg bg-input-background border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  placeholder={t('createListing.whatsappPlaceholder')}
                />
              </div>

              {/* Actions */}
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
