import React, { useState, useEffect } from 'react';
import ENDPOINTS from '../api/Endpoint';

const AddUserForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    mobile: '',
    role: '',
    password: '',
    retypePassword: ''
  });

  const [availableProjects, setAvailableProjects] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState({
    project_id: '',
    support_type: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const supportTypes = [
    'Project Incharge',
    'Project Support',
    'Technical Support',
    'Customer Support'
  ];

  const roles = ['Admin', 'Developer', 'Tester', 'Customer Support'];

  // Auto-clear field errors after 3 seconds
  useEffect(() => {
    if (Object.keys(fieldErrors).length > 0) {
      const timer = setTimeout(() => {
        setFieldErrors({});
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [fieldErrors]);

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setFieldErrors({ general: 'Authentication required. Please login again.' });
        return;
      }

      const response = await fetch(ENDPOINTS.PROJECTS.PROJECT_LIST, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setAvailableProjects(data.projects || data.data || data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setFieldErrors({ general: 'Failed to load projects. Please refresh the page.' });
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleProjectChange = (e) => {
    const { name, value } = e.target;
    setCurrentProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addProject = () => {
    if (!currentProject.project_id || !currentProject.support_type) {
      setFieldErrors({ projects: 'Please select both project and support type' });
      return;
    }

    const exists = projects.find(p => p.project_id === parseInt(currentProject.project_id));
    if (exists) {
      setFieldErrors({ projects: 'This project is already added' });
      return;
    }

    const projectDetails = availableProjects.find(p => p.project_id === parseInt(currentProject.project_id));
    
    if (!projectDetails) {
      setFieldErrors({ projects: 'Selected project not found' });
      return;
    }

    setProjects(prev => [...prev, {
      project_id: parseInt(currentProject.project_id),
      project_name: projectDetails.project_name,
      support_type: currentProject.support_type
    }]);

    setCurrentProject({ project_id: '', support_type: '' });
    setFieldErrors({});
  };

  const removeProject = (index) => {
    setProjects(prev => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setFormData({
      username: '',
      full_name: '',
      email: '',
      mobile: '',
      role: '',
      password: '',
      retypePassword: ''
    });
    setProjects([]);
    setCurrentProject({ project_id: '', support_type: '' });
    setFieldErrors({});
    setSuccessMessage('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 3) {
      newErrors.full_name = 'Full name must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobile.trim())) {
      newErrors.mobile = 'Mobile number must be exactly 10 digits';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.retypePassword) {
      newErrors.retypePassword = 'Please re-type password';
    } else if (formData.password !== formData.retypePassword) {
      newErrors.retypePassword = 'Passwords do not match';
    }

    if (projects.length === 0) {
      newErrors.projects = 'Please add at least one project';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setSuccessMessage('');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setFieldErrors({ general: 'Authentication required. Please login again.' });
        setLoading(false);
        return;
      }

      const payload = {
        username: formData.username.trim(),
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        role: formData.role,
        password: formData.password,
        projects: projects.map(p => ({
          project_id: p.project_id,
          support_type: p.support_type
        }))
      };

      const response = await fetch(ENDPOINTS.ADMIN.ADD_USER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setFieldErrors({ general: data.errors.join(', ') });
        } else if (data.message) {
          setFieldErrors({ general: data.message });
        } else {
          setFieldErrors({ general: 'Failed to create user. Please try again.' });
        }
        return;
      }

      setSuccessMessage(data.message || 'User created successfully!');
      handleReset();

    } catch (error) {
      console.error('Add user error:', error);
      setFieldErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="  p-5">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-8">
        
        {/* General Error Message */}
        {fieldErrors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-600 text-sm">{fieldErrors.general}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-600 text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        <div>
          {/* Form Fields - 2 Columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-8">
            {/* Username */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                <span className="text-red-500">* </span>Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 ${
                  fieldErrors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder=""
                disabled={loading}
              />
              {fieldErrors.username && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                <span className="text-red-500">* </span>Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 ${
                  fieldErrors.full_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder=""
                disabled={loading}
              />
              {fieldErrors.full_name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.full_name}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                <span className="text-red-500">* </span>Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 ${
                  fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Re-type Password */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                <span className="text-red-500">* </span>Re-type Password
              </label>
              <input
                type="password"
                name="retypePassword"
                value={formData.retypePassword}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 ${
                  fieldErrors.retypePassword ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {fieldErrors.retypePassword && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.retypePassword}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                <span className="text-red-500">* </span>Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 ${
                  fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder=""
                disabled={loading}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                <span className="text-red-500">* </span>Mobile
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 ${
                  fieldErrors.mobile ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder=""
                maxLength="10"
                disabled={loading}
              />
              {fieldErrors.mobile && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.mobile}</p>
              )}
            </div>

            {/* Role - 50% Width */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                <span className="text-red-500">* </span>Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 bg-white ${
                  fieldErrors.role ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value="">Select Role</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              {fieldErrors.role && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.role}</p>
              )}
            </div>
          </div>

          {/* Project Assignment Section */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <div className="flex items-end gap-4 mb-6">
              {/* Project Dropdown */}
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-2">Project</label>
                <select
                  name="project_id"
                  value={currentProject.project_id}
                  onChange={handleProjectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                  disabled={projectsLoading || loading}
                >
                  <option value="">
                    {projectsLoading ? 'Loading projects...' : 'Select Project'}
                  </option>
                  {availableProjects.map(project => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Support Type Dropdown */}
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-2">Support Type</label>
                <select
                  name="support_type"
                  value={currentProject.support_type}
                  onChange={handleProjectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                  disabled={loading}
                >
                  <option value="">Select Support Type</option>
                  {supportTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Add Button */}
              <div>
                <button
                  type="button"
                  onClick={addProject}
                  className="px-8 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Project Error */}
            {fieldErrors.projects && (
              <p className="mb-4 text-sm text-red-600">{fieldErrors.projects}</p>
            )}

            {/* Projects Table */}
            {projects.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sr.</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Project</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Support Type</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{index + 1}.</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{project.project_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{project.support_type}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeProject(index)}
                            className="text-blue-500 hover:text-blue-700 inline-flex items-center justify-center disabled:opacity-50"
                            disabled={loading}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-cyan-400 hover:bg-cyan-500 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              disabled={loading}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default AddUserForm;


// import React, { useState, useEffect } from 'react';
// import ENDPOINTS from '../api/Endpoint';

// const AddUserForm = () => {
//   const [formData, setFormData] = useState({
//     username: '',
//     full_name: '',
//     email: '',
//     mobile: '',
//     role: '',
//     password: '',
//     retypePassword: ''
//   });

//   const [availableProjects, setAvailableProjects] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [currentProject, setCurrentProject] = useState({
//     project_id: '',
//     support_type: ''
//   });

//   const [fieldErrors, setFieldErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [projectsLoading, setProjectsLoading] = useState(true);
//   const [successMessage, setSuccessMessage] = useState('');

//   const supportTypes = [
//     'Project Incharge',
//     'Project Support',
//     'Technical Support',
//     'Customer Support'
//   ];

//   const roles = ['Admin', 'Developer', 'Tester', 'Customer Support'];

//   // Auto-clear field errors after 3 seconds
//   useEffect(() => {
//     if (Object.keys(fieldErrors).length > 0) {
//       const timer = setTimeout(() => {
//         setFieldErrors({});
//       }, 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [fieldErrors]);

//   // Auto-clear success message after 5 seconds
//   useEffect(() => {
//     if (successMessage) {
//       const timer = setTimeout(() => {
//         setSuccessMessage('');
//       }, 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [successMessage]);

//   // Fetch projects on component mount
//   useEffect(() => {
//     fetchProjects();
//   }, []);

//   const fetchProjects = async () => {
//     setProjectsLoading(true);
//     try {
//       const token = localStorage.getItem('accessToken');
      
//       if (!token) {
//         setFieldErrors({ general: 'Authentication required. Please login again.' });
//         return;
//       }

//       const response = await fetch(ENDPOINTS.PROJECTS.PROJECT_LIST, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.status === 401) {
//         localStorage.removeItem('accessToken');
//         window.location.href = '/login';
//         return;
//       }

//       if (!response.ok) {
//         throw new Error('Failed to fetch projects');
//       }

//       const data = await response.json();
//       setAvailableProjects(data.projects || data.data || data);
//     } catch (error) {
//       console.error('Failed to fetch projects:', error);
//       setFieldErrors({ general: 'Failed to load projects. Please refresh the page.' });
//     } finally {
//       setProjectsLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
    
//     // Clear field error when user starts typing
//     if (fieldErrors[name]) {
//       setFieldErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors[name];
//         return newErrors;
//       });
//     }
//   };

//   const handleProjectChange = (e) => {
//     const { name, value } = e.target;
//     setCurrentProject(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const addProject = () => {
//     if (!currentProject.project_id || !currentProject.support_type) {
//       setFieldErrors({ projects: 'Please select both project and support type' });
//       return;
//     }

//     const exists = projects.find(p => p.project_id === parseInt(currentProject.project_id));
//     if (exists) {
//       setFieldErrors({ projects: 'This project is already added' });
//       return;
//     }

//     const projectDetails = availableProjects.find(p => p.project_id === parseInt(currentProject.project_id));
    
//     if (!projectDetails) {
//       setFieldErrors({ projects: 'Selected project not found' });
//       return;
//     }

//     setProjects(prev => [...prev, {
//       project_id: parseInt(currentProject.project_id),
//       project_name: projectDetails.project_name,
//       support_type: currentProject.support_type
//     }]);

//     setCurrentProject({ project_id: '', support_type: '' });
//     setFieldErrors({});
//   };

//   const removeProject = (index) => {
//     setProjects(prev => prev.filter((_, i) => i !== index));
//   };

//   const handleReset = () => {
//     setFormData({
//       username: '',
//       full_name: '',
//       email: '',
//       mobile: '',
//       role: '',
//       password: '',
//       retypePassword: ''
//     });
//     setProjects([]);
//     setCurrentProject({ project_id: '', support_type: '' });
//     setFieldErrors({});
//     setSuccessMessage('');
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     if (!formData.username.trim()) {
//       newErrors.username = 'Username is required';
//     } else if (formData.username.trim().length < 3) {
//       newErrors.username = 'Username must be at least 3 characters';
//     }

//     if (!formData.full_name.trim()) {
//       newErrors.full_name = 'Full name is required';
//     } else if (formData.full_name.trim().length < 3) {
//       newErrors.full_name = 'Full name must be at least 3 characters';
//     }

//     if (!formData.email.trim()) {
//       newErrors.email = 'Email is required';
//     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
//       newErrors.email = 'Please enter a valid email address';
//     }

//     if (!formData.mobile.trim()) {
//       newErrors.mobile = 'Mobile number is required';
//     } else if (!/^[0-9]{10}$/.test(formData.mobile.trim())) {
//       newErrors.mobile = 'Mobile number must be exactly 10 digits';
//     }

//     if (!formData.role) {
//       newErrors.role = 'Role is required';
//     }

//     if (!formData.password) {
//       newErrors.password = 'Password is required';
//     } else if (formData.password.length < 6) {
//       newErrors.password = 'Password must be at least 6 characters';
//     }

//     if (!formData.retypePassword) {
//       newErrors.retypePassword = 'Please re-type password';
//     } else if (formData.password !== formData.retypePassword) {
//       newErrors.retypePassword = 'Passwords do not match';
//     }

//     if (projects.length === 0) {
//       newErrors.projects = 'Please add at least one project';
//     }

//     return newErrors;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setFieldErrors({});
//     setSuccessMessage('');

//     const validationErrors = validateForm();
//     if (Object.keys(validationErrors).length > 0) {
//       setFieldErrors(validationErrors);
//       return;
//     }

//     setLoading(true);

//     try {
//       const token = localStorage.getItem('accessToken');
      
//       if (!token) {
//         setFieldErrors({ general: 'Authentication required. Please login again.' });
//         setLoading(false);
//         return;
//       }

//       const payload = {
//         username: formData.username.trim(),
//         full_name: formData.full_name.trim(),
//         email: formData.email.trim().toLowerCase(),
//         mobile: formData.mobile.trim(),
//         role: formData.role,
//         password: formData.password,
//         projects: projects.map(p => ({
//           project_id: p.project_id,
//           support_type: p.support_type
//         }))
//       };

//       const response = await fetch(ENDPOINTS.ADMIN.ADD_USER, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify(payload)
//       });

//       const data = await response.json();

//       if (response.status === 401) {
//         localStorage.removeItem('accessToken');
//         window.location.href = '/login';
//         return;
//       }

//       if (!response.ok) {
//         if (data.errors && Array.isArray(data.errors)) {
//           setFieldErrors({ general: data.errors.join(', ') });
//         } else if (data.message) {
//           setFieldErrors({ general: data.message });
//         } else {
//           setFieldErrors({ general: 'Failed to create user. Please try again.' });
//         }
//         return;
//       }

//       // Show success message
//       setSuccessMessage('User Added Successfully!');
      
//       // Reset form after a delay to allow user to see success message
//       setTimeout(() => {
//         handleReset();
//       }, 2000);

//     } catch (error) {
//       console.error('Add user error:', error);
//       setFieldErrors({ general: 'Network error. Please check your connection and try again.' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-5">
//       <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-8">
        
//         {/* General Error Message */}
//         {fieldErrors.general && (
//           <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
//             <div className="flex items-start">
//               <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//               </svg>
//               <p className="text-red-600 text-sm">{fieldErrors.general}</p>
//             </div>
//           </div>
//         )}

//         {/* Success Message */}
//         {successMessage && (
//           <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 animate-pulse">
//             <div className="flex items-start">
//               <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//               </svg>
//               <p className="text-green-600 text-sm font-medium">{successMessage}</p>
//             </div>
//           </div>
//         )}

//         <div>
//           {/* Form Fields - 2 Columns */}
//           <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-8">
//             {/* Username */}
//             <div>
//               <label className="block text-sm text-gray-700 mb-2">
//                 <span className="text-red-500">* </span>Username
//               </label>
//               <input
//                 type="text"
//                 name="username"
//                 value={formData.username}
//                 onChange={handleInputChange}
//                 className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 ${
//                   fieldErrors.username ? 'border-red-500' : 'border-gray-300'
//                 }`}
//                 placeholder=""
//                 disabled={loading}
//               />
//               {fieldErrors.username && (
//                 <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
//               )}
//             </div>

//             {/* Full Name */}
//             <div>
//               <label className="block text-sm text-gray-700 mb-2">
//                 <span className="text-red-500">* </span>Full Name
//               </label>
//               <input
//                 type="text"
//                 name="full_name"
//                 value={formData.full_name}
//                 onChange={handleInputChange}
//                 className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 ${
//                   fieldErrors.full_name ? 'border-red-500' : 'border-gray-300'
//                 }`}
//                 placeholder=""
//                 disabled={loading}
//               />
//               {fieldErrors.full_name && (
//                 <p className="mt-1 text-sm text-red-600">{fieldErrors.full_name}</p>
//               )}
//             </div>

//             {/* Password */}
//             <div>
//               <label className="block text-sm text-gray-700 mb-2">
//                 <span className="text-red-500">* </span>Password
//               </label>
//               <input
//                 type="password"
//                 name="password"
//                 value={formData.password}
//                 onChange={handleInputChange}
//                 className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 ${
//                   fieldErrors.password ? 'border-red-500' : 'border-gray-300'
//                 }`}
//                 disabled={loading}
//               />
//               {fieldErrors.password && (
//                 <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
//               )}
//             </div>

//             {/* Re-type Password */}
//             <div>
//               <label className="block text-sm text-gray-700 mb-2">
//                 <span className="text-red-500">* </span>Re-type Password
//               </label>
//               <input
//                 type="password"
//                 name="retypePassword"
//                 value={formData.retypePassword}
//                 onChange={handleInputChange}
//                 className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 ${
//                   fieldErrors.retypePassword ? 'border-red-500' : 'border-gray-300'
//                 }`}
//                 disabled={loading}
//               />
//               {fieldErrors.retypePassword && (
//                 <p className="mt-1 text-sm text-red-600">{fieldErrors.retypePassword}</p>
//               )}
//             </div>

//             {/* Email */}
//             <div>
//               <label className="block text-sm text-gray-700 mb-2">
//                 <span className="text-red-500">* </span>Email
//               </label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleInputChange}
//                 className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 ${
//                   fieldErrors.email ? 'border-red-500' : 'border-gray-300'
//                 }`}
//                 placeholder=""
//                 disabled={loading}
//               />
//               {fieldErrors.email && (
//                 <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
//               )}
//             </div>

//             {/* Mobile */}
//             <div>
//               <label className="block text-sm text-gray-700 mb-2">
//                 <span className="text-red-500">* </span>Mobile
//               </label>
//               <input
//                 type="tel"
//                 name="mobile"
//                 value={formData.mobile}
//                 onChange={handleInputChange}
//                 className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 ${
//                   fieldErrors.mobile ? 'border-red-500' : 'border-gray-300'
//                 }`}
//                 placeholder=""
//                 maxLength="10"
//                 disabled={loading}
//               />
//               {fieldErrors.mobile && (
//                 <p className="mt-1 text-sm text-red-600">{fieldErrors.mobile}</p>
//               )}
//             </div>

//             {/* Role - 50% Width */}
//             <div>
//               <label className="block text-sm text-gray-700 mb-2">
//                 <span className="text-red-500">* </span>Role
//               </label>
//               <select
//                 name="role"
//                 value={formData.role}
//                 onChange={handleInputChange}
//                 className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 bg-white ${
//                   fieldErrors.role ? 'border-red-500' : 'border-gray-300'
//                 }`}
//                 disabled={loading}
//               >
//                 <option value="">Select Role</option>
//                 {roles.map(role => (
//                   <option key={role} value={role}>{role}</option>
//                 ))}
//               </select>
//               {fieldErrors.role && (
//                 <p className="mt-1 text-sm text-red-600">{fieldErrors.role}</p>
//               )}
//             </div>
//           </div>

//           {/* Project Assignment Section */}
//           <div className="border-t border-gray-200 pt-6 mb-6">
//             <div className="flex items-end gap-4 mb-6">
//               {/* Project Dropdown */}
//               <div className="flex-1">
//                 <label className="block text-sm text-gray-700 mb-2">Project</label>
//                 <select
//                   name="project_id"
//                   value={currentProject.project_id}
//                   onChange={handleProjectChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
//                   disabled={projectsLoading || loading}
//                 >
//                   <option value="">
//                     {projectsLoading ? 'Loading projects...' : 'Select Project'}
//                   </option>
//                   {availableProjects.map(project => (
//                     <option key={project.project_id} value={project.project_id}>
//                       {project.project_name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Support Type Dropdown */}
//               <div className="flex-1">
//                 <label className="block text-sm text-gray-700 mb-2">Support Type</label>
//                 <select
//                   name="support_type"
//                   value={currentProject.support_type}
//                   onChange={handleProjectChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
//                   disabled={loading}
//                 >
//                   <option value="">Select Support Type</option>
//                   {supportTypes.map(type => (
//                     <option key={type} value={type}>{type}</option>
//                   ))}
//                 </select>
//               </div>

//               {/* Add Button */}
//               <div>
//                 <button
//                   type="button"
//                   onClick={addProject}
//                   className="px-8 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                   disabled={loading}
//                 >
//                   Add
//                 </button>
//               </div>
//             </div>

//             {/* Project Error */}
//             {fieldErrors.projects && (
//               <p className="mb-4 text-sm text-red-600">{fieldErrors.projects}</p>
//             )}

//             {/* Projects Table */}
//             {projects.length > 0 && (
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead>
//                     <tr className="bg-gray-50 border-b border-gray-200">
//                       <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sr.</th>
//                       <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Project</th>
//                       <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Support Type</th>
//                       <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Delete</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {projects.map((project, index) => (
//                       <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
//                         <td className="px-4 py-3 text-sm text-gray-600">{index + 1}.</td>
//                         <td className="px-4 py-3 text-sm text-gray-800">{project.project_name}</td>
//                         <td className="px-4 py-3 text-sm text-gray-600">{project.support_type}</td>
//                         <td className="px-4 py-3 text-center">
//                           <button
//                             type="button"
//                             onClick={() => removeProject(index)}
//                             className="text-blue-500 hover:text-blue-700 inline-flex items-center justify-center disabled:opacity-50"
//                             disabled={loading}
//                           >
//                             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                               <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
//                             </svg>
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>

//           {/* Action Buttons */}
//           <div className="flex gap-4">
//             <button
//               type="button"
//               onClick={handleSubmit}
//               disabled={loading}
//               className="flex-1 py-3 bg-cyan-400 hover:bg-cyan-500 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {loading ? 'Saving...' : 'Save'}
//             </button>
//             <button
//               type="button"
//               onClick={handleReset}
//               disabled={loading}
//               className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               Reset
//             </button>
//             <button
//               type="button"
//               onClick={() => window.history.back()}
//               disabled={loading}
//               className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               Back
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddUserForm;