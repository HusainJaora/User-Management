import './App.css'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login'; // Adjust path based on your folder structure
import UserProfile from './pages/UserProfile';// Your home page component
import AdminAddUser from './pages/AddUser'; // Your admin page
import Dashboard from './pages/Dashboard';
import UserDetail from './pages/UserDetail';
import EditUser from './pages/EditUser';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const accessToken = localStorage.getItem('accessToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Check if token is expired
  const tokenExpiry = localStorage.getItem('tokenExpiry');
  const isExpired = !tokenExpiry || Date.now() > parseInt(tokenExpiry);
  
  if (!accessToken || isExpired) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && user.role !== 'Admin') {
    return <Navigate to="/home" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes */}
        <Route 
          path="/home"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Only Routes */}
        <Route 
          path="/admin/add-user" 
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminAddUser />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute adminOnly={true}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/user-detail/:userId" 
          element={
            <ProtectedRoute adminOnly={true}>
              <UserDetail />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/edit-user/:userId" 
          element={
            <ProtectedRoute adminOnly={true}>
              <EditUser />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
