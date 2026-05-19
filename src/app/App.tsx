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
import Contact from './components/Contact';

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-background">
        <div className="text-lg font-medium text-foreground">Loading KlikNesa...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={session ? <Navigate to="/dashboard" replace /> : <Signup />} />
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
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
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