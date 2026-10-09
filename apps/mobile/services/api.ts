import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";
import type { DriverProfile, Ride, RideStatus } from "@/lib/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://confident-insight-production-b1f6.up.railway.app/api/v1";

const client = axios.create({ baseURL: API_URL, timeout: 15000 });

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface MessageOut {
  id: string;
  driver_id: string;
  sender_role: "admin" | "driver";
  content: string;
  is_read: boolean;
  created_at: string;
}

export type IncidentReason = "retard" | "probleme_vehicule" | "comportement_enfant" | "accident" | "autre";

export interface IncidentOut {
  id: string;
  ride_id: string;
  driver_id: string;
  reason: IncidentReason;
  description: string | null;
  status: "nouveau" | "traite";
  created_at: string;
}

export const api = {
  login: async (email: string, password: string) => {
    const { data } = await client.post<{ access_token: string; refresh_token: string }>(
      "/auth/login",
      { email, password },
    );
    return data;
  },

  // GET /auth/me renvoie le compte UTILISATEUR (users.id) — jamais utilisé
  // pour peupler le profil chauffeur affiché dans l'app, uniquement pour
  // des besoins d'affichage du compte lui-même si nécessaire un jour.
  me: async () => {
    const { data } = await client.get("/auth/me");
    return data;
  },

  // GET /drivers/me renvoie le vrai profil CHAUFFEUR (drivers.id) — c'est
  // CELUI-CI qu'il faut utiliser pour peupler le store après connexion,
  // car c'est ce driver_id qui est attendu partout ailleurs (courses,
  // messages, position GPS). Utiliser /auth/me à la place envoie l'ID du
  // compte utilisateur, qui ne correspond à rien dans la table drivers et
  // fait échouer silencieusement (ou en 500/404) tout le reste.
  meDriver: async () => {
    const { data } = await client.get<DriverProfile>("/drivers/me");
    return data;
  },

  myRides: async (driverId: string) => {
    const { data } = await client.get<Ride[]>("/rides", { params: { driver_id: driverId } });
    return data;
  },

  ride: async (rideId: string) => {
    const { data } = await client.get<Ride>(`/rides/${rideId}`);
    return data;
  },

  updateRideStatus: async (rideId: string, status: RideStatus) => {
    const { data } = await client.post<Ride>(`/rides/${rideId}/status`, { status });
    return data;
  },

  updatePosition: async (driverId: string, latitude: number, longitude: number) => {
    const { data } = await client.post(`/drivers/${driverId}/position`, { latitude, longitude });
    return data;
  },

  markOffline: async (driverId: string) => {
    const { data } = await client.post(`/drivers/${driverId}/offline`);
    return data;
  },

  registerPushToken: async (driverId: string, pushToken: string) => {
    const { data } = await client.post(`/drivers/${driverId}/push-token`, { push_token: pushToken });
    return data;
  },

  getConversation: async (driverId: string) => {
    const { data } = await client.get<MessageOut[]>(`/messages/${driverId}`);
    return data;
  },
  sendMessage: async (driverId: string, content: string) => {
    const { data } = await client.post<MessageOut>(`/messages/${driverId}`, { content });
    return data;
  },

  // driver_id n'est volontairement pas envoyé ici : le backend le retrouve
  // via la course (ride_id), pour ne pas faire confiance à un driver_id
  // fourni par le client.
  reportIncident: async (rideId: string, reason: IncidentReason, description?: string) => {
    const { data } = await client.post<IncidentOut>("/incidents", {
      ride_id: rideId,
      reason,
      description: description ?? null,
    });
    return data;
  },
};

export const API_BASE_URL = API_URL;