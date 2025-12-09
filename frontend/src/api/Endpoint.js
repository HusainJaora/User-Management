    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    const ENDPOINTS = {
    ADMIN: {
        ADD_USER: `${BASE_URL}/admin/add-user`,
        USERS_LIST: `${BASE_URL}/admin/all-users`,
        DELETE_USER:`${BASE_URL}/admin/delete-user`,
        USER_DETAIL:`${BASE_URL}/admin/user`,
        EDIT_USER:`${BASE_URL}/admin/edit-user`,
    },
    PROJECTS: {
        PROJECT_LIST: `${BASE_URL}/admin/projects`,
    },
    AUTH: {
        LOGIN: `${BASE_URL}/auth/login`,
    },
    PROFILE: {
        USER_PROFILE: `${BASE_URL}/profile`,
    },

    
    };

    export default ENDPOINTS;