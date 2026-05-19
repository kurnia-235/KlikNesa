import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './components/AuthContext';
import { LanguageProvider } from './components/LanguageContext';
import { ThemeProvider } from './components/ThemeContext';
import { UserModeProvider } from './components/UserModeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './components/Landing';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import Cart from './components/Cart';
import Orders from './components/Orders';
import ListingDetail from './components/ListingDetail';
import MyListings from './components/MyListings';
import CreateListing from './components/CreateListing';
import Conversations from './components/Conversations';
import AdminDashboard from './components/AdminDashboard';
import AdminReports from './components/AdminReports';
import Contact from './components/Contact';
import ProfileSettings from './components/ProfileSettings';
import SellerVerification from './components/SellerVerification';

const isAdmin = (email?: string | null) => !!email?.endsWith('@admin.com');

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, user, loading } = useAuth();

  // Tunggu auth selesai, dan tunggu profil user selesai dimuat
  // agar tidak ada jendela singkat di mana user null tapi session ada
  if (loading || (session && !user)) {
    return (
      <div className="size-full flex items-center justify-center bg-background">
        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  // Blokir siapa pun yang bukan @admin.com — termasuk user null
  if (!isAdmin(user?.email)) return <Navigate to="/home" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-background">
        <div className="text-lg font-medium text-foreground">Loading KlikNesa...</div>
      </div>
    );
  }

  const adminEmail = isAdmin(session?.user?.email);

  return (
    <Routes>
      <Route path="/" element={session ? <Navigate to={adminEmail ? '/admin' : '/dashboard'} replace /> : <Landing />} />
      <Route path="/login" element={session ? <Navigate to={adminEmail ? '/admin' : '/dashboard'} replace /> : <Login />} />
      <Route path="/signup" element={session ? <Navigate to={adminEmail ? '/admin' : '/dashboard'} replace /> : <Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/listings/:id"
        element={
          <ProtectedRoute>
            <ListingDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-listings"
        element={
          <ProtectedRoute>
            <MyListings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-listing"
        element={
          <ProtectedRoute>
            <CreateListing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conversations"
        element={
          <ProtectedRoute>
            <Conversations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AdminRoute>
            <AdminReports />
          </AdminRoute>
        }
      />
      <Route
        path="/wishlist"
        element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        }
      />
      <Route path="/contact" element={<Contact />} />
      <Route
        path="/seller-verification"
        element={
          <ProtectedRoute>
            <SellerVerification />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile-settings"
        element={
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <UserModeProvider>
              <div className="size-full bg-background transition-colors duration-300">
                <AppRoutes />
              </div>
            </UserModeProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Router>
  );
}