-- =============================================================
-- KlikNesa - Schema Supabase
-- Jalankan di: Supabase Dashboard > SQL Editor > New Query
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Tabel profiles
--    Menyimpan data profil user UNESA (nama, kampus, rating, dll)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT         NOT NULL,
  name              TEXT         NOT NULL,
  campus            TEXT         NOT NULL
                                 CHECK (campus IN ('Ketintang', 'Lidah Wetan', 'Magetan')),
  verified          BOOLEAN      NOT NULL DEFAULT false,
  rating            NUMERIC(3,2) NOT NULL DEFAULT 0,
  transaction_count INTEGER      NOT NULL DEFAULT 0,
  trust_badge       BOOLEAN      NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 2. Tabel products
--    Menyimpan data produk/listing yang dijual mahasiswa UNESA
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT          NOT NULL,
  description TEXT          NOT NULL DEFAULT '',
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  category    TEXT          NOT NULL
                            CHECK (category IN ('Electronics', 'Books', 'Furniture', 'Clothing', 'Sports', 'Other')),
  campus      TEXT          NOT NULL
                            CHECK (campus IN ('Ketintang', 'Lidah Wetan', 'Magetan')),
  seller_id   UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT          NOT NULL DEFAULT 'available'
                            CHECK (status IN ('available', 'sold', 'inactive')),
  images           TEXT[]        NOT NULL DEFAULT '{}',
  whatsapp_number  TEXT          NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_public" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE USING (auth.uid() = seller_id);

-- Jalankan ini jika tabel products sudah ada dan perlu kolom baru:
-- ALTER TABLE public.products ADD COLUMN IF NOT EXISTS whatsapp_number TEXT NOT NULL DEFAULT '';

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------
-- 4. Row Level Security (RLS) – profiles
--    Aktifkan agar setiap user hanya bisa akses data miliknya
-- ---------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User bisa baca profil siapa saja (perlu untuk tampilkan data penjual)
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

-- User hanya bisa insert profil miliknya sendiri
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User hanya bisa update profil miliknya sendiri
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ---------------------------------------------------------------
-- 4b. Trigger: auto-buat profil saat user baru mendaftar
--    Ini memastikan profil selalu terbuat, bahkan jika registrasi
--    dilakukan lewat berbagai cara (frontend, admin, dsb.)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, campus)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Pengguna Baru'),
    COALESCE(NEW.raw_user_meta_data->>'campus', 'Ketintang')
  )
  ON CONFLICT (id) DO NOTHING;  -- Amankan dari duplikasi
  RETURN NEW;
END;
$$;

-- Pasang trigger ke tabel auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------
-- 5. (Opsional) Auto-update kolom updated_at saat data diubah
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------
-- 6. Tabel KV Store — dipakai Edge Function untuk simpan OTP sementara
--    Dibuat otomatis oleh Figma Make; jalankan ini jika belum ada.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kv_store_2fc7af5c (
  key   TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Edge Function mengakses tabel ini via service role key (RLS tidak perlu)
-- tapi kita aktifkan RLS dengan policy service-role-only agar aman.
ALTER TABLE public.kv_store_2fc7af5c ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- 7. Tambahan kolom profiles untuk fitur Seller Verification
--    Jalankan IF NOT EXISTS agar aman diulang.
-- ---------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seller_status    TEXT    DEFAULT 'unverified';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_number  TEXT    DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ktm_url          TEXT    DEFAULT '';

-- ---------------------------------------------------------------
-- 8. Catatan pengaturan Auth di Supabase Dashboard
-- ---------------------------------------------------------------
-- Untuk menonaktifkan verifikasi email (saat development):
-- Dashboard > Authentication > Providers > Email
-- Matikan "Enable email confirmations"
--
-- Untuk membatasi email ke domain UNESA:
-- (Tidak bisa dilakukan di Supabase secara native, lakukan di frontend)
-- ---------------------------------------------------------------
