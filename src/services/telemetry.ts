import type { TelemetryData, DeviceState } from '../types';

export class TelemetryGenerator {
  private deviceState: DeviceState = {
    battery: 0.95,
    sessionActive: false,
    stepsTotal: 0,
  };

  private randomNormal(mu: number, sigma: number): number {
    const u = 1 - Math.random();
    const v = 1 - Math.random();
    return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  generateTelemetry(deviceId: string): TelemetryData {
    const active = Math.random() < 0.5;
    const stepsDelta = active ? Math.max(0, Math.round(this.randomNormal(3, 2))) : 0;
    this.deviceState.stepsTotal += stepsDelta;
    this.deviceState.battery = Math.max(
      0.05,
      this.deviceState.battery - (Math.random() * 0.0008 + 0.0002)
    );

    const heartRateBase = active ? 110 : 70;
    const heartRate = Math.max(
      60,
      Math.min(180, Math.round(heartRateBase + this.randomNormal(0, 10)))
    );

    return {
      deviceId,
      timestamp: new Date().toISOString(),
      messageId: crypto.randomUUID(),
      metrics: {
        heartRate,
        stepsDelta,
        caloriesDelta: +(stepsDelta * 0.04).toFixed(3),
        battery: +this.deviceState.battery.toFixed(3),
      },
      motion: {
        ax: +this.randomNormal(0, 0.05).toFixed(3),
        ay: +this.randomNormal(0, 0.06).toFixed(3),
        az: +this.randomNormal(0, 0.05).toFixed(3),
      },
    };
  }

  getDeviceState(): DeviceState {
    return { ...this.deviceState };
  }

  resetState(): void {
    this.deviceState = {
      battery: 0.95,
      sessionActive: false,
      stepsTotal: 0,
    };
  }
}

