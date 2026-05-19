import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// ── CORS — harus diregistrasi SEBELUM semua route ────────────────────────────
// Sertakan x-client-info & apikey karena Supabase SDK mengirimnya secara otomatis.
// Tanpa kedua header ini di allowHeaders, browser memblokir preflight OPTIONS.
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "x-client-info", "apikey"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
  }),
);

// Explicit OPTIONS handler — browser selalu kirim preflight OPTIONS terlebih dahulu.
// Hono perlu merespons 204 secara eksplisit agar fetch tidak diblokir.
app.options("*", (c) =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
      "Access-Control-Max-Age": "86400",
    },
  }),
);

// Middleware to verify user authentication
const requireAuth = async (c: any, next: any) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (!user || error) {
    console.log('Auth error during token verification:', error);
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }

  c.set('userId', user.id);
  c.set('userEmail', user.email);
  await next();
};

// Health check endpoint
app.get("/make-server-2fc7af5c/health", (c) => {
  return c.json({ status: "ok" });
});

// ============== AUTH ENDPOINTS ==============

// Signup endpoint
app.post("/make-server-2fc7af5c/signup", async (c) => {
  try {
    const { email, password, name, campus } = await c.req.json();

    // Validate UNESA email domain
    if (!email.endsWith('@mhs.unesa.ac.id') && !email.endsWith('@unesa.ac.id')) {
      return c.json({ error: 'Invalid email - Must use UNESA student email (@mhs.unesa.ac.id or @unesa.ac.id)' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, campus, verified: false },
      email_confirm: true
    });

    if (error) {
      console.log('Signup error while creating user:', error);
      return c.json({ error: `Signup failed: ${error.message}` }, 400);
    }

    // Store user profile in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      campus,
      verified: false,
      createdAt: new Date().toISOString(),
      rating: 0,
      transactionCount: 0,
      trustBadge: false
    });

    return c.json({
      message: 'Signup successful - Please check your email to verify your account',
      userId: data.user.id
    });
  } catch (error) {
    console.log('Signup error during request processing:', error);
    return c.json({ error: 'Signup failed - Internal server error' }, 500);
  }
});

// Login endpoint (uses Supabase auth directly from frontend)
// This endpoint is for getting user profile after login
app.get("/make-server-2fc7af5c/profile", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const profile = await kv.get(`user:${userId}`);

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ profile });
  } catch (error) {
    console.log('Profile retrieval error:', error);
    return c.json({ error: 'Failed to retrieve profile' }, 500);
  }
});

// Update user profile
app.put("/make-server-2fc7af5c/profile", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const updates = await c.req.json();

    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const updatedProfile = { ...profile, ...updates, id: userId };
    await kv.set(`user:${userId}`, updatedProfile);

    return c.json({ profile: updatedProfile });
  } catch (error) {
    console.log('Profile update error:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// ============== LISTING ENDPOINTS ==============

// Create listing
app.post("/make-server-2fc7af5c/listings", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { title, description, price, category, campus, images } = await c.req.json();

    const listingId = `listing:${crypto.randomUUID()}`;
    const listing = {
      id: listingId,
      sellerId: userId,
      title,
      description,
      price,
      category,
      campus,
      images: images || [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(listingId, listing);

    // Add to user's listings
    const userListings = await kv.get(`user:${userId}:listings`) || [];
    userListings.push(listingId);
    await kv.set(`user:${userId}:listings`, userListings);

    return c.json({ listing });
  } catch (error) {
    console.log('Listing creation error:', error);
    return c.json({ error: 'Failed to create listing' }, 500);
  }
});

// Get listings with filters
app.get("/make-server-2fc7af5c/listings", async (c) => {
  try {
    const campus = c.req.query('campus');
    const category = c.req.query('category');
    const search = c.req.query('search');
    const minPrice = c.req.query('minPrice');
    const maxPrice = c.req.query('maxPrice');

    // Get all listings
    const allListings = await kv.getByPrefix('listing:');

    // Filter listings
    let filteredListings = allListings.filter((listing: any) =>
      listing.status === 'active'
    );

    if (campus) {
      filteredListings = filteredListings.filter((l: any) => l.campus === campus);
    }

    if (category) {
      filteredListings = filteredListings.filter((l: any) => l.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredListings = filteredListings.filter((l: any) =>
        l.title.toLowerCase().includes(searchLower) ||
        l.description.toLowerCase().includes(searchLower)
      );
    }

    if (minPrice) {
      filteredListings = filteredListings.filter((l: any) => l.price >= parseFloat(minPrice));
    }

    if (maxPrice) {
      filteredListings = filteredListings.filter((l: any) => l.price <= parseFloat(maxPrice));
    }

    // Sort by most recent
    filteredListings.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({ listings: filteredListings });
  } catch (error) {
    console.log('Listings retrieval error:', error);
    return c.json({ error: 'Failed to retrieve listings' }, 500);
  }
});

// Get single listing
app.get("/make-server-2fc7af5c/listings/:id", async (c) => {
  try {
    const listingId = `listing:${c.req.param('id')}`;
    const listing = await kv.get(listingId);

    if (!listing) {
      return c.json({ error: 'Listing not found' }, 404);
    }

    // Get seller profile
    const seller = await kv.get(`user:${listing.sellerId}`);

    return c.json({ listing, seller });
  } catch (error) {
    console.log('Listing retrieval error:', error);
    return c.json({ error: 'Failed to retrieve listing' }, 500);
  }
});

// Update listing
app.put("/make-server-2fc7af5c/listings/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const listingId = `listing:${c.req.param('id')}`;
    const updates = await c.req.json();

    const listing = await kv.get(listingId);
    if (!listing) {
      return c.json({ error: 'Listing not found' }, 404);
    }

    if (listing.sellerId !== userId) {
      return c.json({ error: 'Unauthorized - You can only edit your own listings' }, 403);
    }

    const updatedListing = {
      ...listing,
      ...updates,
      id: listingId,
      sellerId: userId,
      updatedAt: new Date().toISOString()
    };
    await kv.set(listingId, updatedListing);

    return c.json({ listing: updatedListing });
  } catch (error) {
    console.log('Listing update error:', error);
    return c.json({ error: 'Failed to update listing' }, 500);
  }
});

// Delete listing
app.delete("/make-server-2fc7af5c/listings/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const listingId = `listing:${c.req.param('id')}`;

    const listing = await kv.get(listingId);
    if (!listing) {
      return c.json({ error: 'Listing not found' }, 404);
    }

    if (listing.sellerId !== userId) {
      return c.json({ error: 'Unauthorized - You can only delete your own listings' }, 403);
    }

    await kv.del(listingId);

    // Remove from user's listings
    const userListings = await kv.get(`user:${userId}:listings`) || [];
    const updatedUserListings = userListings.filter((id: string) => id !== listingId);
    await kv.set(`user:${userId}:listings`, updatedUserListings);

    return c.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.log('Listing deletion error:', error);
    return c.json({ error: 'Failed to delete listing' }, 500);
  }
});

// Get user's listings
app.get("/make-server-2fc7af5c/my-listings", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const listingIds = await kv.get(`user:${userId}:listings`) || [];

    const listings = await Promise.all(
      listingIds.map(async (id: string) => await kv.get(id))
    );

    return c.json({ listings: listings.filter(Boolean) });
  } catch (error) {
    console.log('User listings retrieval error:', error);
    return c.json({ error: 'Failed to retrieve your listings' }, 500);
  }
});

// ============== MESSAGING ENDPOINTS ==============

// Send message
app.post("/make-server-2fc7af5c/messages", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { listingId, recipientId, content } = await c.req.json();

    const messageId = `message:${crypto.randomUUID()}`;
    const message = {
      id: messageId,
      listingId,
      senderId: userId,
      recipientId,
      content,
      createdAt: new Date().toISOString(),
      read: false
    };

    await kv.set(messageId, message);

    // Add to conversation
    const conversationId = [userId, recipientId].sort().join(':');
    const conversationKey = `conversation:${conversationId}:${listingId}`;
    const messages = await kv.get(conversationKey) || [];
    messages.push(messageId);
    await kv.set(conversationKey, messages);

    return c.json({ message });
  } catch (error) {
    console.log('Message sending error:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Get conversation
app.get("/make-server-2fc7af5c/conversations/:listingId/:otherUserId", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const listingId = c.req.param('listingId');
    const otherUserId = c.req.param('otherUserId');

    const conversationId = [userId, otherUserId].sort().join(':');
    const conversationKey = `conversation:${conversationId}:${listingId}`;
    const messageIds = await kv.get(conversationKey) || [];

    const messages = await Promise.all(
      messageIds.map(async (id: string) => await kv.get(id))
    );

    return c.json({ messages: messages.filter(Boolean) });
  } catch (error) {
    console.log('Conversation retrieval error:', error);
    return c.json({ error: 'Failed to retrieve conversation' }, 500);
  }
});

// Get all user conversations
app.get("/make-server-2fc7af5c/conversations", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');

    // Get all conversations that include this user
    const allConversations = await kv.getByPrefix('conversation:');
    const userConversations = allConversations.filter((conv: any) =>
      Array.isArray(conv) // Filter valid conversation arrays
    );

    return c.json({ conversations: userConversations });
  } catch (error) {
    console.log('Conversations retrieval error:', error);
    return c.json({ error: 'Failed to retrieve conversations' }, 500);
  }
});

// ============== TRANSACTION ENDPOINTS ==============

// Create transaction
app.post("/make-server-2fc7af5c/transactions", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { listingId, paymentMethod, meetingLocation } = await c.req.json();

    const listing = await kv.get(listingId);
    if (!listing) {
      return c.json({ error: 'Listing not found' }, 404);
    }

    if (listing.sellerId === userId) {
      return c.json({ error: 'You cannot buy your own listing' }, 400);
    }

    const transactionId = `transaction:${crypto.randomUUID()}`;
    const transaction = {
      id: transactionId,
      listingId,
      buyerId: userId,
      sellerId: listing.sellerId,
      amount: listing.price,
      paymentMethod,
      meetingLocation,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(transactionId, transaction);

    return c.json({ transaction });
  } catch (error) {
    console.log('Transaction creation error:', error);
    return c.json({ error: 'Failed to create transaction' }, 500);
  }
});

// Update transaction status
app.put("/make-server-2fc7af5c/transactions/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const transactionId = `transaction:${c.req.param('id')}`;
    const { status, rating, review } = await c.req.json();

    const transaction = await kv.get(transactionId);
    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      return c.json({ error: 'Unauthorized - Not part of this transaction' }, 403);
    }

    const updatedTransaction = {
      ...transaction,
      status,
      rating,
      review,
      updatedAt: new Date().toISOString()
    };

    await kv.set(transactionId, updatedTransaction);

    // If completed, update seller rating
    if (status === 'completed' && rating) {
      const seller = await kv.get(`user:${transaction.sellerId}`);
      if (seller) {
        const newCount = (seller.transactionCount || 0) + 1;
        const newRating = ((seller.rating || 0) * (seller.transactionCount || 0) + rating) / newCount;
        seller.transactionCount = newCount;
        seller.rating = newRating;
        seller.trustBadge = newCount >= 5 && newRating >= 4.0;
        await kv.set(`user:${transaction.sellerId}`, seller);
      }
    }

    return c.json({ transaction: updatedTransaction });
  } catch (error) {
    console.log('Transaction update error:', error);
    return c.json({ error: 'Failed to update transaction' }, 500);
  }
});

// Get user's transactions
app.get("/make-server-2fc7af5c/transactions", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');

    const allTransactions = await kv.getByPrefix('transaction:');
    const userTransactions = allTransactions.filter((t: any) =>
      t.buyerId === userId || t.sellerId === userId
    );

    return c.json({ transactions: userTransactions });
  } catch (error) {
    console.log('Transactions retrieval error:', error);
    return c.json({ error: 'Failed to retrieve transactions' }, 500);
  }
});

// ============== REPORT ENDPOINTS ==============

// Submit report
app.post("/make-server-2fc7af5c/reports", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { listingId, reportedUserId, reason, description } = await c.req.json();

    const reportId = `report:${crypto.randomUUID()}`;
    const report = {
      id: reportId,
      reporterId: userId,
      listingId,
      reportedUserId,
      reason,
      description,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await kv.set(reportId, report);

    return c.json({ report });
  } catch (error) {
    console.log('Report submission error:', error);
    return c.json({ error: 'Failed to submit report' }, 500);
  }
});

// ============== ADMIN ENDPOINTS ==============

// Get all reports (admin only - simplified for prototype)
app.get("/make-server-2fc7af5c/admin/reports", requireAuth, async (c) => {
  try {
    const reports = await kv.getByPrefix('report:');
    return c.json({ reports });
  } catch (error) {
    console.log('Admin reports retrieval error:', error);
    return c.json({ error: 'Failed to retrieve reports' }, 500);
  }
});

// Get all users (admin only - simplified for prototype)
app.get("/make-server-2fc7af5c/admin/users", requireAuth, async (c) => {
  try {
    const users = await kv.getByPrefix('user:');
    const userProfiles = users.filter((item: any) =>
      item.id && item.email && !item.id.includes(':')
    );
    return c.json({ users: userProfiles });
  } catch (error) {
    console.log('Admin users retrieval error:', error);
    return c.json({ error: 'Failed to retrieve users' }, 500);
  }
});

// ============== WHATSAPP OTP ==============

const OTP_TTL_MS = 5 * 60 * 1000; // 5 menit

/** Normalisasi ke format 628xxx — aman untuk semua format input Indonesia */
function normalizePhone(raw: string): string {
  // Ambil digit saja terlebih dahulu untuk keamanan
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0'))  return '62' + digits.slice(1);
  // Jika tidak ada awalan 0 atau 62 (contoh: 85150673929), tetap tambahkan 62
  return '62' + digits;
}

async function sendOtpLogic(userId: string, phone: string): Promise<{ ok: boolean; error?: string }> {
  // Sanitasi defensif: pastikan phone adalah string sebelum diproses
  const cleaned = String(phone ?? '').replace(/\D/g, '');

  console.log(`[send-otp] Input phone: "${phone}" → cleaned: "${cleaned}"`);

  if (cleaned.length < 9 || cleaned.length > 13) {
    return { ok: false, error: `Nomor WhatsApp tidak valid (${cleaned.length} digit, butuh 9–13).` };
  }

  const waPhone = normalizePhone(cleaned);
  console.log(`[send-otp] waPhone setelah normalisasi: "${waPhone}"`);

  const otp = Math.floor(1000 + Math.random() * 9000);

  // Simpan OTP ke KV store sebelum menembak Wablas
  await kv.set(`otp:${userId}`, {
    code: otp,
    phone: waPhone,
    expiresAt: Date.now() + OTP_TTL_MS,
  });

  const wablasDomain = Deno.env.get('WABLAS_DOMAIN') ?? 'console.wablas.com';
  const wablasToken  = Deno.env.get('WABLAS_TOKEN') ?? '';

  if (!wablasToken) {
    console.error('[send-otp] WABLAS_TOKEN env var belum diset di Supabase secrets!');
    return { ok: false, error: 'Konfigurasi Wablas belum diset di server. Hubungi admin.' };
  }

  // Wablas memakai format: token ada di URL path → https://{domain}/{token}/api/send-message
  // Authorization header juga dikirim sebagai fallback untuk kompatibilitas lintas versi.
  const wablasUrl = `https://${wablasDomain}/${wablasToken}/api/send-message`;
  const message   =
    `[KlikNesa] Kode OTP Verifikasi Penjual Anda adalah: ${otp}. ` +
    `Jangan bagikan kode ini kepada siapa pun yaa.`;

  console.log(`[send-otp] Menembak Wablas → URL: https://${wablasDomain}/***token***/api/send-message | To: ${waPhone}`);

  // Try-catch eksplisit agar crash jaringan tidak menghancurkan seluruh request
  try {
    const res = await fetch(wablasUrl, {
      method: 'POST',
      headers: {
        'Authorization': wablasToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: waPhone, message }),
    });

    // Baca body response Wablas untuk log & pesan error yang informatif
    const resText = await res.text();
    console.log(`[send-otp] Wablas response HTTP ${res.status}:`, resText);

    if (!res.ok) {
      // Kembalikan detail HTTP status + body Wablas agar mudah didiagnosis
      return {
        ok: false,
        error: `Wablas error ${res.status}: ${resText || '(no body)'}`,
      };
    }

    return { ok: true };
  } catch (err) {
    // Jaringan gagal total (DNS, timeout, koneksi ditolak, dsb)
    console.error('[send-otp] Wablas fetch EXCEPTION:', err);
    return {
      ok: false,
      error: `Gagal menghubungi server Wablas: ${(err as Error)?.message ?? String(err)}`,
    };
  }
}

async function verifyOtpLogic(userId: string, code: string): Promise<{ ok: boolean; phone?: string; error?: string }> {
  const record = await kv.get(`otp:${userId}`);
  if (!record) return { ok: false, error: 'OTP tidak ditemukan. Silakan kirim ulang.' };
  if (Date.now() > record.expiresAt) {
    await kv.del(`otp:${userId}`);
    return { ok: false, error: 'OTP sudah kedaluwarsa (5 menit). Silakan kirim ulang.' };
  }
  if (String(record.code) !== String(code).trim()) {
    return { ok: false, error: 'Kode OTP salah. Silakan coba lagi.' };
  }
  await kv.del(`otp:${userId}`);
  return { ok: true, phone: record.phone };
}

// ── Root dispatcher ────────────────────────────────────────────────────────────
// supabase.functions.invoke('server', { body: { route: '...', ... } }) mengirim
// request ke path '/' (bukan subpath). Dispatcher ini menangani routing OTP
// berdasarkan field `route` di dalam body request.
app.post("/", requireAuth, async (c) => {
  try {
    const body   = await c.req.json();
    const route  = body.route;
    const userId = c.get('userId');

    if (route === 'send-otp') {
      const result = await sendOtpLogic(userId, body.phone ?? '');
      return result.ok ? c.json({ ok: true }) : c.json({ error: result.error }, 400);
    }

    if (route === 'verify-otp') {
      const result = await verifyOtpLogic(userId, body.code ?? '');
      return result.ok
        ? c.json({ ok: true, phone: result.phone })
        : c.json({ error: result.error }, 400);
    }

    return c.json({ error: 'Rute tidak dikenal.' }, 400);
  } catch (err) {
    console.error('[root-dispatcher] exception:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

Deno.serve(app.fetch);
