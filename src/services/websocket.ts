import { io, Socket } from "socket.io-client";
import type { TelemetryData, Command } from "../types";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

export class WebSocketService {
  private socket: Socket | null = null;
  private commandCallbacks: Array<(cmd: Command) => void> = [];
  private telemetryCallbacks: Array<(data: TelemetryData) => void> = [];

  private async generateJoinPayload(
    deviceId: string,
    secret: string
  ): Promise<{ deviceId: string; timestamp: string; signature: string }> {
    const timestamp = new Date().toISOString();
    const message = `${deviceId}:${timestamp}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      messageData
    );
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return { deviceId, timestamp, signature };
  }

  async connect(deviceId: string, secret: string): Promise<void> {
    if (this.socket?.connected) {
      this.disconnect();
    }

    return new Promise((resolve, reject) => {
      // Set connection timeout
      const timeout = setTimeout(() => {
        if (!this.socket?.connected) {
          this.socket?.disconnect();
          reject(new Error("Connection timeout"));
        }
      }, 10000);

      this.socket = io(WS_URL, {
        path: "/ws",
        transports: ["websocket", "polling"],
        reconnection: false, // Disable auto-reconnect to avoid spam
        timeout: 10000,
        forceNew: true,
      });

      this.socket.on("connect", async () => {
        clearTimeout(timeout);

        try {
          const joinPayload = await this.generateJoinPayload(deviceId, secret);
          this.socket?.emit("join", joinPayload);
        } catch (error) {
          reject(error);
        }
      });

      this.socket.on("joined", () => {
        resolve();
      });

      this.socket.on("command", (cmd: Command) => {
        this.commandCallbacks.forEach((cb) => cb(cmd));
      });

      this.socket.on(
        "telemetry:new",
        (data: { deviceId: string; telemetry: TelemetryData }) => {
          this.telemetryCallbacks.forEach((cb) => cb(data.telemetry));
        }
      );

      this.socket.on("disconnect", () => {
        clearTimeout(timeout);
      });

      this.socket.on("connect_error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.socket.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.commandCallbacks = [];
  }

  sendTelemetry(data: TelemetryData): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit("telemetry", data);
  }

  onCommand(callback: (cmd: Command) => void): () => void {
    this.commandCallbacks.push(callback);
    return () => {
      this.commandCallbacks = this.commandCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onTelemetry(callback: (data: TelemetryData) => void): () => void {
    this.telemetryCallbacks.push(callback);
    return () => {
      this.telemetryCallbacks = this.telemetryCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const wsService = new WebSocketService();
