import axios, { AxiosError, type AxiosInstance } from "axios";
import type {
  AuthResponse,
  LoginDto,
  RegisterDto,
  User,
  Device,
  TelemetryData,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/auth/login";
        }
        return Promise.reject(error);
      }
    );
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      "/auth/register",
      data
    );
    return response.data;
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>("/auth/login", data);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.client.post<User>("/auth/profile");
    return response.data;
  }

  async getDevices(): Promise<Device[]> {
    const response = await this.client.get<Device[]>("/devices");
    return response.data;
  }

  async getMyDevice(): Promise<Device> {
    const response = await this.client.get<Device>("/devices/my-device");
    return response.data;
  }

  async getDevice(id: string): Promise<Device> {
    const response = await this.client.get<Device>(`/devices/${id}`);
    return response.data;
  }

  async getDeviceTelemetry(
    deviceId: string,
    limit = 20
  ): Promise<TelemetryData[]> {
    interface TelemetryResponse {
      id: number | string; // BigInt may serialize as string
      deviceId: string;
      tsDevice: string | Date; // DateTime serializes as ISO string
      tsServer: string | Date; // DateTime serializes as ISO string
      messageId?: string | null;
      heartRate?: number | null;
      stepsDelta?: number | null;
      caloriesDelta?:
        | string
        | number
        | { s: number; e: number; d: number[] }
        | null; // Prisma Decimal serializes as object
      battery?: string | number | { s: number; e: number; d: number[] } | null; // Prisma Decimal serializes as object
      ax?: string | number | { s: number; e: number; d: number[] } | null; // Prisma Decimal serializes as object
      ay?: string | number | { s: number; e: number; d: number[] } | null; // Prisma Decimal serializes as object
      az?: string | number | { s: number; e: number; d: number[] } | null; // Prisma Decimal serializes as object
      device?: unknown; // Included relation, not needed
      session?: unknown; // Included relation, not needed
    }
    const response = await this.client.get<TelemetryResponse[]>(
      `/telemetry/device/${deviceId}`,
      { params: { limit } }
    );

    // Helper function to safely parse numbers (handles Prisma Decimal objects and strings)
    const parseNumber = (
      value:
        | string
        | number
        | { s: number; e: number; d: number[] }
        | null
        | undefined,
      defaultValue = 0
    ): number => {
      if (value === null || value === undefined) {
        return defaultValue;
      }
      if (typeof value === "number") {
        return isNaN(value) ? defaultValue : value;
      }
      // Handle Prisma Decimal object format: {s: sign, e: exponent, d: digits}
      if (
        typeof value === "object" &&
        "s" in value &&
        "e" in value &&
        "d" in value
      ) {
        const decimal = value as { s: number; e: number; d: number[] };
        // Reconstruct number from Decimal.js format
        // sign * (digits as number) * 10^exponent
        const digitsStr = decimal.d.join("");
        const digitsNum = parseFloat(digitsStr);
        const result = decimal.s * digitsNum * Math.pow(10, decimal.e);
        return isNaN(result) ? defaultValue : result;
      }
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "" || trimmed === "null" || trimmed === "undefined") {
          return defaultValue;
        }
        // Use parseFloat for better decimal handling
        const parsed = parseFloat(trimmed);
        return isNaN(parsed) ? defaultValue : parsed;
      }
      return defaultValue;
    };

    // Helper to parse DateTime (handles both Date objects and ISO strings)
    const parseTimestamp = (
      tsDevice: string | Date | null | undefined,
      tsServer: string | Date | null | undefined
    ): string | null => {
      if (tsDevice) {
        if (tsDevice instanceof Date) {
          return tsDevice.toISOString();
        }
        if (typeof tsDevice === "string" && tsDevice.trim()) {
          return tsDevice;
        }
      }
      if (tsServer) {
        if (tsServer instanceof Date) {
          return tsServer.toISOString();
        }
        if (typeof tsServer === "string" && tsServer.trim()) {
          return tsServer;
        }
      }
      return null;
    };

    // Transform API response to match TelemetryData format
    return response.data.map((t) => {
      const timestamp = parseTimestamp(t.tsDevice, t.tsServer);
      return {
        deviceId: t.deviceId,
        timestamp: timestamp || new Date().toISOString(),
        messageId: t.messageId || `api-${String(t.id)}`,
        metrics: {
          heartRate: parseNumber(t.heartRate, 0),
          stepsDelta: parseNumber(t.stepsDelta, 0),
          caloriesDelta: parseNumber(t.caloriesDelta, 0),
          battery: parseNumber(t.battery, 0),
        },
        motion:
          t.ax !== null || t.ay !== null || t.az !== null
            ? {
                ax:
                  t.ax !== null && t.ax !== undefined
                    ? parseNumber(t.ax)
                    : undefined,
                ay:
                  t.ay !== null && t.ay !== undefined
                    ? parseNumber(t.ay)
                    : undefined,
                az:
                  t.az !== null && t.az !== undefined
                    ? parseNumber(t.az)
                    : undefined,
              }
            : undefined,
      };
    });
  }
}

export const apiClient = new ApiClient();
