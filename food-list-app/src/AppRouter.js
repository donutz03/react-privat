// First install react-router-dom:
// npm install react-router-dom

// AppRouter.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import FriendsManager from './components/FriendsManager';
import SharedProducts from './components/SharedProducts';

// PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const currentUser = localStorage.getItem('currentUser');
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <PrivateRoute>
              <FriendsManager />
            </PrivateRoute>
          }
        />
        <Route
          path="/shared-products"
          element={
            <PrivateRoute>
              <SharedProducts />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;