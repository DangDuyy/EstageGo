import authorizeAxiosInstance from '@/utils/authorizeAxios';
import { API_ROOT } from '@/utils/constants';

// ===== DASHBOARD =====
export const getDashboardStatsAPI = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/V1/admin/dashboard/stats`);
  return response.data;
};

// ===== PROPERTIES MANAGEMENT =====
export const getAdminPropertiesAPI = async (params) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/V1/admin/properties`, { params });
  return response.data;
};

export const updatePropertyStatusAPI = async (propertyId, status) => {
  const response = await authorizeAxiosInstance.patch(
    `${API_ROOT}/V1/admin/properties/${propertyId}/status`,
    { status }
  );
  return response.data;
};

export const deletePropertyAPI = async (propertyId) => {
  const response = await authorizeAxiosInstance.delete(
    `${API_ROOT}/V1/admin/properties/${propertyId}`
  );
  return response.data;
};

// ===== AGENT REQUESTS =====
export const getAgentRequestsAPI = async (params) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/V1/admin/agent-requests`, { params });
  return response.data;
};

export const approveAgentRequestAPI = async (requestId, adminNotes) => {
  const response = await authorizeAxiosInstance.patch(
    `${API_ROOT}/V1/admin/agent-requests/${requestId}/approve`,
    { adminNotes }
  );
  return response.data;
};

export const rejectAgentRequestAPI = async (requestId, adminNotes) => {
  const response = await authorizeAxiosInstance.patch(
    `${API_ROOT}/V1/admin/agent-requests/${requestId}/reject`,
    { adminNotes }
  );
  return response.data;
};

// ===== USERS MANAGEMENT =====
export const getAdminUsersAPI = async (params) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/V1/admin/users`, { params });
  return response.data;
};

export const updateUserRoleAPI = async (userId, role) => {
  const response = await authorizeAxiosInstance.patch(
    `${API_ROOT}/V1/admin/users/${userId}/role`,
    { role }
  );
  return response.data;
};

export const toggleUserStatusAPI = async (userId) => {
  const response = await authorizeAxiosInstance.patch(
    `${API_ROOT}/V1/admin/users/${userId}/toggle-status`
  );
  return response.data;
};
