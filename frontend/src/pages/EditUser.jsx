import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ENDPOINTS from '../api/Endpoint';

const supportTypeOptions = [
  'Project Incharge',
  'Project Support',
  'Technical Support',
  'Customer Support'
];

const EditUser = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    mobile: '',
    role: ''
  });

  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      const pResp = await fetch(ENDPOINTS.PROJECTS.PROJECT_LIST, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (pResp.status === 401) {
        localStorage.removeItem('accessToken');
        navigate('/login');
        return;
      }
      if (!pResp.ok) throw new Error('Failed to fetch projects list');
      const pData = await pResp.json();
      const fetchedProjects = pData.projects ?? pData.data ?? pData;
      setAllProjects(Array.isArray(fetchedProjects) ? fetchedProjects : []);

      const resp = await fetch(`${ENDPOINTS.ADMIN.USER_DETAIL}/${userId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (resp.status === 401) {
        localStorage.removeItem('accessToken');
        navigate('/login');
        return;
      }
      if (!resp.ok) throw new Error('Failed to fetch user data');

      const data = await resp.json();
      const u = data.user ?? data;

      setFormData({
        username: u.username || '',
        full_name: u.full_name || '',
        email: u.email || '',
        mobile: u.mobile || '',
        role: u.role || ''
      });

      const assigned = Array.isArray(u.projects) ? u.projects.map(p => ({
        project_id: p.project_id || p.projectId || p.project_id,
        project_name: p.project_name || p.project_name || p.projectName || p.project_name,
        support_type: p.support_type || p.supportType || p.support_type
      })) : [];
      setProjects(assigned);
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Failed to load data: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const addProjectRow = () => {
    setProjects(prev => [...prev, { project_id: '', project_name: '', support_type: '' }]);
    setError('');
  };

  const removeProjectRow = (index) => {
    setProjects(prev => prev.filter((_, i) => i !== index));
  };

  const handleProjectChange = (index, field, value) => {
    setProjects(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };

      if (field === 'project_id') {
        const match = allProjects.find(ap => String(ap.project_id ?? ap.projectId ?? ap.id) === String(value));
        copy[index].project_name = match ? (match.project_name ?? match.projectName ?? match.name) : '';
      }
      return copy;
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.username?.trim()) { setError('Username is required'); return false; }
    if (!formData.full_name?.trim()) { setError('Full name is required'); return false; }
    if (!formData.email?.trim()) { setError('Email is required'); return false; }
    if (!formData.role) { setError('Role is required'); return false; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { setError('Please enter a valid email address'); return false; }
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) { setError('Mobile number must be 10 digits'); return false; }

    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      if (!p.project_id || !p.support_type) {
        setError('Each assigned project must have a project and support type');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication required. Please login again.');
        setSubmitting(false);
        return;
      }

      const payload = {
        username: formData.username,
        full_name: formData.full_name,
        email: formData.email,
        mobile: formData.mobile,
        role: formData.role,
        projects: projects.map(p => ({ project_id: Number(p.project_id), support_type: p.support_type }))
      };

      const response = await fetch(`${ENDPOINTS.ADMIN.EDIT_USER}/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update user');
      }

      setSuccess('User updated successfully!');
      if (data.user) {
        const u = data.user;
        setFormData({
          username: u.username || '',
          full_name: u.full_name || '',
          email: u.email || '',
          mobile: u.mobile || '',
          role: u.role || ''
        });

        setProjects((u.projects || []).map(p => ({
          project_id: p.project_id,
          project_name: p.project_name,
          support_type: p.support_type
        })));
      }

      setTimeout(() => navigate('/admin/dashboard'), 1000);
    } catch (err) {
      console.error('Update failed:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => navigate('/admin/dashboard');

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Developer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Tester':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Customer Support':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header with Back Button */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg shadow-sm transition-colors border border-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800">Edit User</h1>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* User Profile Header Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-linear-to-r from-cyan-500 to-blue-500 h-32"></div>
          <div className="px-8 pb-8">
            <div className="flex items-start gap-6 -mt-16">
              {/* Avatar */}
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                <div className="w-28 h-28 bg-linear-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              </div>

              {/* Name and Role Badge */}
              <div className="flex-1 pt-16">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {formData.full_name || 'User Name'}
                </h2>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-4 py-1.5 text-sm font-semibold rounded-full border ${getRoleBadgeColor(formData.role)}`}>
                    {formData.role || 'No Role'}
                  </span>
                  <span className="text-gray-500 text-sm">ID: #{userId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              User Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center shrink-0 mt-7">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-500 mb-1">Username <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 mt-7">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-500 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0 mt-7">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-500 mb-1">Email Address <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Mobile */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center shrink-0 mt-7">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-500 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    maxLength={10}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Role */}
              <div className="flex items-start gap-3 md:col-span-2">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center shrink-0 mt-7">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-500 mb-1">Role <span className="text-red-500">*</span></label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100"
                    disabled={submitting}
                  >
                    <option value="">Select Role</option>
                    <option value="Admin">Admin</option>
                    <option value="Developer">Developer</option>
                    <option value="Tester">Tester</option>
                    <option value="Customer Support">Customer Support</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Projects */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Assigned Projects
                <span className="ml-2 px-2.5 py-0.5 bg-cyan-100 text-cyan-800 text-sm font-semibold rounded-full">
                  {projects.length}
                </span>
              </h3>
              <button
                type="button"
                onClick={addProjectRow}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Project
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg font-medium mb-1">No Projects Assigned</p>
                <p className="text-gray-500 text-sm">Click "Add Project" to assign projects to this user.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 bg-linear-to-br from-white to-gray-50"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-5">
                        <label className="block text-sm text-gray-600 mb-2">Project *</label>
                        <select
                          value={project.project_id}
                          onChange={(e) => handleProjectChange(idx, 'project_id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none disabled:bg-gray-100"
                          disabled={submitting}
                        >
                          <option value="">Select project</option>
                          {allProjects.map((ap) => {
                            const id = ap.project_id ?? ap.projectId ?? ap.id;
                            const name = ap.project_name ?? ap.projectName ?? ap.name;
                            return <option key={id} value={id}>{name}</option>;
                          })}
                        </select>
                      </div>

                      <div className="md:col-span-5">
                        <label className="block text-sm text-gray-600 mb-2">Support Type *</label>
                        <select
                          value={project.support_type}
                          onChange={(e) => handleProjectChange(idx, 'support_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none disabled:bg-gray-100"
                          disabled={submitting}
                        >
                          <option value="">Select support type</option>
                          {supportTypeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <div className="md:col-span-2 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeProjectRow(idx)}
                          disabled={submitting}
                          className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition-colors border border-red-200 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors shadow-md disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Update User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;