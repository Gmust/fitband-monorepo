export type User = {
  id: string;
  email: string;
  deviceId: string;
  createdAt: string;
  updatedAt: string;
};

export type Device = {
  id: string;
  name: string;
  userId: string;
  secret: string;
  createdAt: string;
  updatedAt: string;
};

export type LoginDto = {
  email: string;
  password: string;
};

export type RegisterDto = {
  email: string;
  password: string;
};

export type AuthResponse = {
  access_token: string;
  user: User;
};

export type TelemetryData = {
  deviceId: string;
  timestamp: string;
  messageId: string;
  metrics: {
    heartRate: number;
    stepsDelta: number;
    caloriesDelta: number;
    battery: number;
  };
  motion?: {
    ax?: number;
    ay?: number;
    az?: number;
  };
};

export type DeviceState = {
  battery: number;
  sessionActive: boolean;
  stepsTotal: number;
};

export const Commands = {
  StartSession: "startSession",
  StopSession: "stopSession",
  Vibrate: "vibrate",
} as const;

export type CommandName = typeof Commands[keyof typeof Commands];

export type Command = {
  name: CommandName;
  payload?: Record<string, unknown>;
};

