import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { authService } from "../services/auth";
import { apiClient } from "../services/api";
import { TelemetryGenerator } from "../services/telemetry";
import { wsService } from "../services/websocket";
import { formatDate, formatTime } from "../utils/date";
import type { TelemetryData, Command } from "../types";

export const Route = createFileRoute("/devices/$deviceId")({
  beforeLoad: ({ location }) => {
    if (!authService.isAuthenticated()) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  loader: async ({ params }) => {
    const device = await apiClient.getDevice(params.deviceId);
    const myDevice = await apiClient.getMyDevice().catch(() => null);
    return { device, myDevice };
  },
  component: DeviceDetail,
});

function DeviceDetail() {
  const { device, myDevice } = Route.useLoaderData();
  const [isSimulating, setIsSimulating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [telemetryLog, setTelemetryLog] = useState<TelemetryData[]>([]);
  const [commandLog, setCommandLog] = useState<Command[]>([]);
  const [generator] = useState(() => new TelemetryGenerator());
  const [intervalMs, setIntervalMs] = useState(3000);

  const isMyDevice = myDevice?.id === device.id;
  const canSimulate = isMyDevice && myDevice?.secret;

  // Fetch and poll telemetry for viewing users
  useEffect(() => {
    if (!canSimulate) {
      // For viewing users, fetch telemetry from API
      const fetchTelemetry = () => {
        apiClient
          .getDeviceTelemetry(device.id, 20)
          .then((telemetry) => {
            setTelemetryLog(telemetry);
          })
          .catch(() => {
            // Silently fail - telemetry log will remain empty
          });
      };

      // Initial fetch
      fetchTelemetry();

      // Poll every 5 seconds for updates
      const interval = setInterval(fetchTelemetry, 5000);

      return () => clearInterval(interval);
    }
  }, [device.id, canSimulate]);

  useEffect(() => {
    // Connect if this is the user's device (can simulate)
    if (canSimulate) {
      wsService
        .connect(device.id, myDevice.secret)
        .then(() => {
          setIsConnected(true);
        })
        .catch(() => {
          setIsConnected(false);
        });
    }

    // Listen for telemetry broadcasts (works for both owners and viewers)
    const unsubscribeTelemetry = wsService.onTelemetry((telemetry) => {
      // Only add telemetry for the device we're viewing
      if (telemetry.deviceId === device.id) {
        setTelemetryLog((prev) => [telemetry, ...prev].slice(0, 20));
      }
    });

    // Listen for commands (only if connected as owner)
    const unsubscribeCommand = wsService.onCommand((cmd) => {
      setCommandLog((prev) => [cmd, ...prev].slice(0, 10));
    });

    return () => {
      unsubscribeTelemetry();
      unsubscribeCommand();
      if (canSimulate) {
        wsService.disconnect();
        setIsConnected(false);
      }
    };
  }, [device.id, canSimulate, myDevice?.secret]);

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const telemetry = generator.generateTelemetry(device.id);
      wsService.sendTelemetry(telemetry);
      setTelemetryLog((prev) => [telemetry, ...prev].slice(0, 20));
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isSimulating, intervalMs, device.id, generator]);

  const toggleSimulation = () => {
    if (!isSimulating) {
      generator.resetState();
      setTelemetryLog([]);
    }
    setIsSimulating(!isSimulating);
  };

  const deviceState = generator.getDeviceState();

  return (
    <div className="px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {device.name}
          </h1>
          <p className="text-gray-600">Device ID: {device.id}</p>
        </div>

        {!isMyDevice && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            <p className="font-medium">View-only mode</p>
            <p className="text-sm mt-1">
              This is not your device. You can view telemetry logs but cannot
              simulate. Telemetry updates when the device owner sends data.
            </p>
          </div>
        )}

        {/* Connection Status */}
        {canSimulate && (
          <div className="mb-6 bg-white shadow rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  WebSocket Connection
                </h2>
                <p className="text-sm text-gray-500">
                  Status: {isConnected ? "Connected" : "Disconnected"}
                </p>
              </div>
            </div>
          </div>
        )}

        {canSimulate ? (
          <div className="mb-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Telemetry Simulation
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleSimulation}
                  disabled={!isConnected}
                  className={`px-6 py-2 rounded-lg text-white font-medium ${
                    isSimulating
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSimulating ? "Stop Simulation" : "Start Simulation"}
                </button>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">
                    Interval (ms):
                  </label>
                  <input
                    type="number"
                    value={intervalMs}
                    onChange={(e) => setIntervalMs(Number(e.target.value))}
                    disabled={isSimulating}
                    className="w-24 px-2 py-1 border border-gray-300 rounded"
                    min="1000"
                    max="10000"
                    step="1000"
                  />
                </div>
              </div>
              {isSimulating && (
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Current State
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Battery:</span>{" "}
                      <span className="font-medium">
                        {(deviceState.battery * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Steps:</span>{" "}
                      <span className="font-medium">
                        {deviceState.stepsTotal}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Session:</span>{" "}
                      <span className="font-medium">
                        {deviceState.sessionActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Device Information
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Device ID:</span>
                <span className="font-mono">{device.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created:</span>
                <span>{formatDate(device.createdAt)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Telemetry Log ({telemetryLog.length})
            {canSimulate && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                (Live updates from device owner)
              </span>
            )}
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {telemetryLog.map((t) => (
              <div
                key={t.messageId}
                className="bg-gray-50 p-3 rounded text-sm font-mono"
              >
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">
                    {formatTime(t.timestamp)}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {t.messageId.slice(0, 8)}
                  </span>
                </div>
                {canSimulate ? (
                  <div className="grid grid-cols-4 gap-2">
                    <div>HR: {t.metrics.heartRate}</div>
                    <div>Steps: +{t.metrics.stepsDelta}</div>
                    <div>Cal: +{t.metrics.caloriesDelta.toFixed(3)}</div>
                    <div>
                      Batt:{" "}
                      {isNaN(t.metrics.battery)
                        ? "N/A"
                        : (t.metrics.battery * 100).toFixed(1)}
                      %
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>HR: {t.metrics.heartRate}</div>
                    <div>Steps: +{t.metrics.stepsDelta}</div>
                  </div>
                )}
              </div>
            ))}
            {telemetryLog.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                {canSimulate
                  ? "No telemetry sent yet. Start simulation to begin."
                  : "No telemetry received yet. Waiting for device owner to start simulation."}
              </p>
            )}
          </div>
        </div>

        {canSimulate && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Commands Received ({commandLog.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {commandLog.map((cmd, idx) => (
                <div key={idx} className="bg-blue-50 p-3 rounded text-sm">
                  <div className="font-medium text-blue-900">{cmd.name}</div>
                  {cmd.payload && (
                    <div className="text-blue-700 text-xs mt-1">
                      Payload: {JSON.stringify(cmd.payload)}
                    </div>
                  )}
                </div>
              ))}
              {commandLog.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No commands received yet
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
