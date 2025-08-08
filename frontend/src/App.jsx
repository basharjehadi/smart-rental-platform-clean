import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileCompletionGuard from './components/ProfileCompletionGuard';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import TenantDashboard from './pages/TenantDashboard';
import TenantDashboardNew from './pages/TenantDashboardNew';
import TenantHelpCenter from './pages/TenantHelpCenter';
import TenantProfile from './pages/TenantProfile';
import RequestForm from './pages/RequestForm';
import MyRequests from './pages/MyRequests';
import LandlordDashboard from './pages/LandlordDashboard';
import LandlordProfile from './pages/LandlordProfile';
import LandlordMyProperty from './pages/LandlordMyProperty';
import LandlordAddProperty from './pages/LandlordAddProperty';
import LandlordEditProperty from './pages/LandlordEditProperty';
import LandlordPropertyDetails from './pages/LandlordPropertyDetails';
import LandlordHelpCenter from './pages/LandlordHelpCenter';
import LandlordRentalRequests from './pages/LandlordRentalRequests';
import LandlordMyTenants from './pages/LandlordMyTenants';
import LandlordTenantProfile from './pages/LandlordTenantProfile';

import MyOffers from './pages/MyOffers';
import PropertyDetailsView from './pages/PropertyDetailsView';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import TenantDashboardRent from './pages/TenantDashboardRent';
import TenantRentHistory from './pages/TenantRentHistory';
import PaymentHistory from './pages/PaymentHistory';

import AdminDashboard from './pages/AdminDashboard';
import AuthCallback from './pages/AuthCallback';
import TestPage from './pages/TestPage';
import ProfilePage from './pages/ProfilePage';


import PropertyMediaUpload from './components/PropertyMediaUpload';
import ContractManagementPage from './pages/ContractManagementPage';
import PaymentManagementPage from './pages/PaymentManagementPage';
import TenantDashboardRedirect from './components/TenantDashboardRedirect';
// import PaymentDemo from './pages/PaymentDemo';
// import PaymentExample from './pages/PaymentExample';

// Component to conditionally render Navbar
const AppContent = () => {
  const location = useLocation();
  const hideNavbarRoutes = ['/', '/login', '/register', '/dashboard', '/tenant-dashboard', '/tenant-help-center', '/tenant-request-for-landlord', '/tenant-profile', '/post-request', '/my-offers', '/property', '/contracts', '/payments', '/payment', '/my-rents', '/my-requests', '/landlord-dashboard', '/tenant-rental-requests', '/requests', '/landlord-profile', '/landlord-my-property', '/landlord-add-property', '/landlord-edit-property', '/landlord-property-details', '/landlord-help-center', '/landlord-my-tenants', '/landlord-tenant-profile', '/admin', '/payment-success', '/payment-history'];
  
  // Check if current path should hide navbar (including parameterized routes)
  const shouldHideNavbar = hideNavbarRoutes.some(route => {
    if (route.includes(':')) {
      // Handle parameterized routes
      const routePattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(location.pathname);
    } else {
      // Handle exact matches
      return location.pathname === route || location.pathname.startsWith(route + '/');
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {!shouldHideNavbar && <Navbar />}
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
              <TenantDashboardRedirect />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tenant-dashboard" 
          element={
            <ProtectedRoute>
              <TenantDashboardNew />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tenant-help-center" 
          element={
            <ProtectedRoute>
              <TenantHelpCenter />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tenant-request-for-landlord" 
          element={
            <ProtectedRoute>
              <TenantDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tenant-profile" 
          element={
            <ProtectedRoute>
              <TenantProfile />
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
          path="/my-requests" 
          element={
            <ProtectedRoute>
              <ProfileCompletionGuard required={true}>
                <MyRequests />
              </ProfileCompletionGuard>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/landlord-dashboard" 
          element={
            <ProtectedRoute>
              <LandlordDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tenant-rental-requests" 
          element={
            <ProtectedRoute>
              <LandlordRentalRequests />
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
          path="/property/:offerId" 
          element={
            <ProtectedRoute>
              <PropertyDetailsView />
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
          path="/payment-success" 
          element={
            <ProtectedRoute>
              <PaymentSuccessPage />
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
          path="/payment-history" 
          element={
            <ProtectedRoute>
              <PaymentHistory />
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
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/landlord-profile" 
          element={
            <ProtectedRoute>
              <LandlordProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/landlord-my-property" 
          element={
            <ProtectedRoute>
              <LandlordMyProperty />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/landlord-add-property" 
          element={
            <ProtectedRoute>
              <LandlordAddProperty />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/landlord-edit-property/:propertyId" 
          element={
            <ProtectedRoute>
              <LandlordEditProperty />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/landlord-property-details/:propertyId" 
          element={
            <ProtectedRoute>
              <LandlordPropertyDetails />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/landlord-help-center" 
          element={
            <ProtectedRoute>
              <LandlordHelpCenter />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/landlord-my-tenants" 
          element={
            <ProtectedRoute>
              <LandlordMyTenants />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/landlord-tenant-profile/:tenantId" 
          element={
            <ProtectedRoute>
              <LandlordTenantProfile />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/property-media" 
          element={
            <ProtectedRoute>
              <PropertyMediaUpload />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/contracts" 
          element={
            <ProtectedRoute>
              <ContractManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payments" 
          element={
            <ProtectedRoute>
              <PaymentManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  console.log('App component is rendering'); // Debug log
  
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
