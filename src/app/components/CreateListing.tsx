import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { supabase } from '../../../utils/supabase/client';
import { ArrowLeft, Upload, X, ImagePlus } from 'lucide-react';
import Layout from './Layout';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE_MB   = 5;
const MAX_PHOTOS    = 5;

export default function CreateListing() {
  const { user }         = useAuth();
  const { t, language }  = useLanguage();
  const navigate         = useNavigate();
  const fileInputRef     = useRef<HTMLInputElement>(null);

  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice]           = useState('');
  const [category, setCategory]     = useState('Electronics');
  const [campus, setCampus]         = useState(user?.campus || 'Ketintang');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews]     = useState<string[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [photoError, setPhotoError] = useState('');

  const CATEGORIES = ['Electronics', 'Books', 'Furniture', 'Clothing', 'Sports', 'Other'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;

    // Reset file input agar event re-trigger bisa terjadi lagi
    if (fileInputRef.current) fileInputRef.current.value = '';

    const available = MAX_PHOTOS - imageFiles.length;
    if (available <= 0) {
      setPhotoError(
        language === 'en'
          ? `Maximum ${MAX_PHOTOS} photos allowed.`
          : `Maksimal foto produk yang dapat diunggah adalah ${MAX_PHOTOS} foto.`,
      );
      return;
    }

    // Potong otomatis jika melebihi sisa slot
    const toAdd = selected.slice(0, available);
    const skipped = selected.length - toAdd.length;

    const valid: File[]   = [];
    const newPreviews: string[] = [];
    const localErrors: string[] = [];

    for (const file of toAdd) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        localErrors.push(
          language === 'en'
            ? `"${file.name}" — only JPG/PNG allowed.`
            : `"${file.name}" — hanya JPG/PNG yang diperbolehkan.`,
        );
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        localErrors.push(
          language === 'en'
            ? `"${file.name}" — exceeds ${MAX_SIZE_MB}MB.`
            : `"${file.name}" — melebihi ${MAX_SIZE_MB}MB.`,
        );
        continue;
      }
      valid.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    if (localErrors.length) {
      setPhotoError(localErrors.join(' '));
      return;
    }

    const warningParts: string[] = [];
    if (skipped > 0) {
      warningParts.push(
        language === 'en'
          ? `${skipped} file(s) skipped — maximum ${MAX_PHOTOS} photos.`
          : `${skipped} file diabaikan — maksimal ${MAX_PHOTOS} foto.`,
      );
    }
    setPhotoError(warningParts.join(' '));

    setImageFiles((prev) => [...prev, ...valid]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setPhotoError('');
  };

  const canSubmit = imageFiles.length >= 1 && imageFiles.length <= MAX_PHOTOS && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of imageFiles) {
        const ext  = file.name.split('.').pop();
        const path = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, file, { contentType: file.type, upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(path);

        uploadedUrls.push(urlData.publicUrl);
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
          images: uploadedUrls,
          whatsapp_number: user?.whatsappNumber ?? '',
        });

      if (insertError) throw insertError;

      navigate('/my-listings');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const slotsFull = imageFiles.length >= MAX_PHOTOS;

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

              {/* ── Photo upload ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-sm sm:text-base text-foreground">
                    {t('createListing.imageUpload')}
                  </label>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    slotsFull
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {imageFiles.length}/{MAX_PHOTOS}
                  </span>
                </div>

                {/* Hidden multi-file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* Grid preview + add slot */}
                {previews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2">
                    {previews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border-2 border-border group">
                        <img src={src} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button
                          type="button"
                          onClick={(e) => removeImage(i, e)}
                          className="absolute top-1 right-1 size-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                        >
                          <X className="size-3" />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full leading-none">
                            {language === 'en' ? 'Cover' : 'Cover'}
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Tombol tambah foto jika masih ada slot */}
                    {!slotsFull && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
                      >
                        <ImagePlus className="size-5" />
                        <span className="text-[10px] font-medium leading-none">
                          {language === 'en' ? 'Add' : 'Tambah'}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* Drop zone — tampil hanya jika belum ada foto */}
                {previews.length === 0 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors duration-300 bg-muted/30"
                  >
                    <div className="p-8 sm:p-10 text-center">
                      <Upload className="size-10 sm:size-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm sm:text-base text-muted-foreground mb-1 font-medium">
                        {language === 'en' ? 'Click to upload product photos' : 'Klik untuk unggah foto produk'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'en'
                          ? `JPG, PNG · Max ${MAX_SIZE_MB}MB per file · Up to ${MAX_PHOTOS} photos`
                          : `JPG, PNG · Maks ${MAX_SIZE_MB}MB per file · Hingga ${MAX_PHOTOS} foto`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Pesan error / peringatan foto */}
                {photoError && (
                  <p className="mt-2 text-xs text-destructive flex items-start gap-1">
                    <span className="shrink-0 mt-0.5">⚠</span>
                    {photoError}
                  </p>
                )}

                {/* Hint jika slot penuh */}
                {slotsFull && (
                  <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                    ✓ {language === 'en'
                      ? `${MAX_PHOTOS} photos selected. Maximum reached.`
                      : `${MAX_PHOTOS} foto dipilih. Batas maksimal tercapai.`}
                  </p>
                )}

                {/* Hint wajib foto */}
                {imageFiles.length === 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {language === 'en' ? 'At least 1 photo is required.' : 'Minimal 1 foto harus diunggah.'}
                  </p>
                )}
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
                  <option value="Lidah Wetan">Lidah Wetan</option>
                  <option value="Ketintang">Ketintang</option>
                  <option value="Moestopo">Moestopo</option>
                  <option value="Magetan">Magetan</option>
                </select>
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
                  disabled={!canSubmit}
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
