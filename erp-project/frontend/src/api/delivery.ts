import { api } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  DeliveryAgent,
  DeliveryAgentFormData,
  DeliveryAssignment,
  DeliveryFilters,
  DeliveryStatus,
  DeliveryStats,
  DeliveryStatusLog,
  DeliveryProof,
  Coordinates,
} from '@/types';

interface AgentFilters {
  status?: string;
  is_available?: boolean;
  vendor?: number;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// Delivery Agents API
export const deliveryAgentsApi = {
  // List delivery agents
  list: (params?: AgentFilters) =>
    api.get<PaginatedResponse<DeliveryAgent>>(
      '/delivery-agents/',
      params as Record<string, unknown>
    ),

  // Get delivery agent by ID
  getById: (id: number) => api.get<ApiResponse<DeliveryAgent>>(`/delivery-agents/${id}/`),

  // Create delivery agent
  create: (data: DeliveryAgentFormData) =>
    api.post<ApiResponse<DeliveryAgent>>('/delivery-agents/', data),

  // Update delivery agent
  update: (id: number, data: Partial<DeliveryAgentFormData>) =>
    api.patch<ApiResponse<DeliveryAgent>>(`/delivery-agents/${id}/`, data),

  // Delete delivery agent
  delete: (id: number) => api.delete<ApiResponse<null>>(`/delivery-agents/${id}/`),

  // Get own profile (for delivery agents)
  getMyProfile: () => api.get<ApiResponse<DeliveryAgent>>('/delivery-agents/me/'),

  // Update own profile
  updateMyProfile: (data: Partial<DeliveryAgentFormData>) =>
    api.patch<ApiResponse<DeliveryAgent>>('/delivery-agents/me/', data),

  // Approve delivery agent (Admin only)
  approve: (id: number) =>
    api.post<ApiResponse<DeliveryAgent>>(`/delivery-agents/${id}/approve/`),

  // Reject delivery agent
  reject: (id: number, reason: string) =>
    api.post<ApiResponse<DeliveryAgent>>(`/delivery-agents/${id}/reject/`, { reason }),

  // Suspend delivery agent
  suspend: (id: number) =>
    api.post<ApiResponse<DeliveryAgent>>(`/delivery-agents/${id}/suspend/`),

  // Activate delivery agent
  activate: (id: number) =>
    api.post<ApiResponse<DeliveryAgent>>(`/delivery-agents/${id}/activate/`),

  // Update availability
  updateAvailability: (isAvailable: boolean) =>
    api.post<ApiResponse<DeliveryAgent>>('/delivery-agents/me/availability/', {
      is_available: isAvailable,
    }),

  // Update location
  updateLocation: (location: Coordinates) =>
    api.post<ApiResponse<DeliveryAgent>>('/delivery-agents/me/location/', location),

  // Get statistics
  getStats: () => api.get<ApiResponse<DeliveryStats>>('/delivery-agents/me/stats/'),

  // Get available agents
  getAvailable: () =>
    api.get<ApiResponse<DeliveryAgent[]>>('/delivery-agents/available/'),
};

// Deliveries API
export const deliveriesApi = {
  // List delivery assignments
  list: (params?: DeliveryFilters) =>
    api.get<PaginatedResponse<DeliveryAssignment>>(
      '/deliveries/',
      params as Record<string, unknown>
    ),

  // Get delivery by ID
  getById: (id: number) => api.get<ApiResponse<DeliveryAssignment>>(`/deliveries/${id}/`),

  // Get my assigned deliveries (for delivery agents)
  getMyDeliveries: (params?: { status?: DeliveryStatus }) =>
    api.get<PaginatedResponse<DeliveryAssignment>>(
      '/deliveries/my/',
      params as Record<string, unknown>
    ),

  // Accept delivery assignment
  accept: (id: number) =>
    api.post<ApiResponse<DeliveryAssignment>>(`/deliveries/${id}/accept/`),

  // Reject delivery assignment
  reject: (id: number, reason: string) =>
    api.post<ApiResponse<DeliveryAssignment>>(`/deliveries/${id}/reject/`, { reason }),

  // Update delivery status
  updateStatus: (id: number, status: DeliveryStatus, notes?: string, location?: Coordinates) =>
    api.post<ApiResponse<DeliveryAssignment>>(`/deliveries/${id}/update-status/`, {
      status,
      notes,
      location,
    }),

  // Mark as picked up
  pickup: (id: number, location?: Coordinates) =>
    api.post<ApiResponse<DeliveryAssignment>>(`/deliveries/${id}/pickup/`, { location }),

  // Mark as in transit
  inTransit: (id: number, location?: Coordinates) =>
    api.post<ApiResponse<DeliveryAssignment>>(`/deliveries/${id}/in-transit/`, { location }),

  // Mark as out for delivery
  outForDelivery: (id: number, location?: Coordinates) =>
    api.post<ApiResponse<DeliveryAssignment>>(`/deliveries/${id}/out-for-delivery/`, {
      location,
    }),

  // Complete delivery
  complete: (id: number, proof: Partial<DeliveryProof>) =>
    api.post<ApiResponse<DeliveryAssignment>>(`/deliveries/${id}/complete/`, proof),

  // Mark delivery as failed
  fail: (id: number, reason: string, location?: Coordinates) =>
    api.post<ApiResponse<DeliveryAssignment>>(`/deliveries/${id}/fail/`, {
      reason,
      location,
    }),

  // Collect COD
  collectCOD: (id: number, amount: number) =>
    api.post<ApiResponse<DeliveryAssignment>>(`/deliveries/${id}/collect-cod/`, { amount }),

  // Get status logs
  getStatusLogs: (id: number) =>
    api.get<ApiResponse<DeliveryStatusLog[]>>(`/deliveries/${id}/status-logs/`),

  // Upload proof
  uploadProof: (id: number, formData: FormData) =>
    api.upload<ApiResponse<DeliveryProof>>(`/deliveries/${id}/proof/`, formData),

  // Get delivery proofs
  getProofs: (id: number) =>
    api.get<ApiResponse<DeliveryProof[]>>(`/deliveries/${id}/proofs/`),

  // Reassign delivery
  reassign: (id: number, agentId: number) =>
    api.post<ApiResponse<DeliveryAssignment>>(`/deliveries/${id}/reassign/`, {
      agent_id: agentId,
    }),
};

export default deliveriesApi;
