import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ENDPOINTS from '../api/Endpoint';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Get user data from localStorage
  const getUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('👤 User from localStorage:', user);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('🔍 UserProfile component mounted');
    
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    const userData = getUserData();
    
    if (!token || !userData) {
      console.log('❌ No auth found, redirecting to login');
      navigate('/login');
      return;
    }

    // If admin, redirect to dashboard
    if (userData.role === 'Admin' || userData.role === 'admin') {
      navigate('/admin/dashboard');
      return;
    }

    fetchUserProfile();
  }, [navigate]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      const userData = getUserData();
      
      if (!token) {
        setError('Authentication required. Please login again.');
        navigate('/login');
        return;
      }

      if (!userData || !userData.user_id) {
        setError('User ID not found. Please login again.');
        navigate('/login');
        return;
      }

      console.log('📡 Fetching profile for user ID:', userData.user_id);
      const response = await fetch(`${ENDPOINTS.PROFILE.USER_PROFILE}/${userData.user_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);

      if (response.status === 401) {
        console.log('❌ Unauthorized, clearing auth and redirecting');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiry');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      console.log('✅ Profile data received:', data);
      setProfile(data.user);
    } catch (error) {
      console.error('❌ Fetch profile error:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-red-700 font-medium">{error}</p>
                <button 
                  onClick={fetchUserProfile}
                  className="mt-3 text-red-600 hover:text-red-800 font-medium text-sm underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
              <p className="text-gray-600 mt-1">Welcome back, {profile.full_name}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Profile Information Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 bg-linear-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {profile.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{profile.full_name}</h3>
                <p className="text-gray-600 mt-1">@{profile.username}</p>
                <span className={`inline-flex mt-2 px-3 py-1 text-xs font-semibold rounded-full ${
                  profile.role === 'admin' || profile.role === 'Admin'
                    ? 'bg-purple-100 text-purple-800' 
                    : profile.role === 'developer' || profile.role === 'Developer'
                    ? 'bg-blue-100 text-blue-800'
                    : profile.role === 'tester' || profile.role === 'Tester'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1).toLowerCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4 hover:border-cyan-300 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700 uppercase">User ID</span>
                </div>
                <p className="text-gray-900 font-medium">#{profile.user_id}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:border-cyan-300 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700 uppercase">Email</span>
                </div>
                <p className="text-gray-900 font-medium break-all">{profile.email}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:border-cyan-300 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700 uppercase">Mobile</span>
                </div>
                <p className="text-gray-900 font-medium">{profile.mobile || 'Not provided'}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:border-cyan-300 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700 uppercase">Role</span>
                </div>
                <p className="text-gray-900 font-medium">{profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1).toLowerCase()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">My Assigned Projects</h2>
            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold text-cyan-700 bg-cyan-100 rounded-full">
              {profile.projects?.length || 0} {profile.projects?.length === 1 ? 'Project' : 'Projects'}
            </span>
          </div>
          
          {!profile.projects || profile.projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg font-medium">No projects assigned yet</p>
              <p className="text-gray-500 text-sm mt-1">Contact your administrator to get assigned to projects</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.projects.map((project, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-5 hover:border-cyan-400 hover:shadow-lg transition-all duration-200 bg-linear-to-br from-white to-gray-50">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-linear-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg mb-2 truncate">{project.project_name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-100 text-cyan-800 text-xs font-semibold rounded-full">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {project.support_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;