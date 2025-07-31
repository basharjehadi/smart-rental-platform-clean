import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileCompletionGuard from './components/ProfileCompletionGuard';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RequestForm from './pages/RequestForm';
import LandlordDashboard from './pages/LandlordDashboard';
import MyOffers from './pages/MyOffers';
import PaymentPage from './pages/PaymentPage';
import TenantDashboardRent from './pages/TenantDashboardRent';
import TenantRentHistory from './pages/TenantRentHistory';
import LandlordRentOverview from './pages/LandlordRentOverview';
import AdminDashboard from './pages/AdminDashboard';
import AuthCallback from './pages/AuthCallback';
import TestPage from './pages/TestPage';
import ProfilePage from './pages/ProfilePage';
import ProfileViewPage from './pages/ProfileViewPage';
// import PaymentDemo from './pages/PaymentDemo';
// import PaymentExample from './pages/PaymentExample';

function App() {
  console.log('App component is rendering'); // Debug log
  
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/post-request" 
              element={
                <ProtectedRoute>
                  <ProfileCompletionGuard required={true}>
                    <RequestForm />
                  </ProfileCompletionGuard>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/requests" 
              element={
                <ProtectedRoute>
                  <ProfileCompletionGuard required={true}>
                    <LandlordDashboard />
                  </ProfileCompletionGuard>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-offers" 
              element={
                <ProtectedRoute>
                  <MyOffers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment" 
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment/:offerId" 
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-rents" 
              element={
                <ProtectedRoute>
                  <TenantRentHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/landlord-rents" 
              element={
                <ProtectedRoute>
                  <LandlordRentOverview />
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
              path="/profile-view" 
              element={
                <ProtectedRoute>
                  <ProfileViewPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
