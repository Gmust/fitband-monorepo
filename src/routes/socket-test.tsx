import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { wsService } from "../services/websocket";
import { TelemetryGenerator } from "../services/telemetry";
import { authService } from "../services/auth";
import { apiClient } from "../services/api";
import type { Command, TelemetryData, DeviceState } from "../types";

export const Route = createFileRoute("/socket-test")({
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
  loader: async () => {
    try {
      const device = await apiClient.getMyDevice();
      return { device, error: null };
    } catch {
      return { device: null, error: "No device found" };
    }
  },
  component: SocketTest,
});

function SocketTest() {
  const { device, error: loadError } = Route.useLoaderData();
  const [deviceId, setDeviceId] = useState(device?.id || "test-device-123");
  const [deviceSecret, setDeviceSecret] = useState(device?.secret || "");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionLog, setConnectionLog] = useState<string[]>([]);
  const [telemetryLog, setTelemetryLog] = useState<TelemetryData[]>([]);
  const [commandLog, setCommandLog] = useState<Command[]>([]);
  const [autoSend, setAutoSend] = useState(false);
  const [intervalMs, setIntervalMs] = useState(3000);
  const [deviceState, setDeviceState] = useState<DeviceState>({
    battery: 0.95,
    sessionActive: false,
    stepsTotal: 0,
  });
  const generatorRef = useRef(new TelemetryGenerator());
  const intervalRef = useRef<number>(0);

  const addLog = (message: string) => {
    setConnectionLog((prev) => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev.slice(0, 19),
    ]);
  };

  const sendTelemetry = useCallback(() => {
    if (!isConnected) {
      addLog("ERROR: Not connected");
      return;
    }

    const telemetry = generatorRef.current.generateTelemetry(deviceId);
    wsService.sendTelemetry(telemetry);
    setTelemetryLog((prev) => [telemetry, ...prev.slice(0, 9)]);
    setDeviceState(generatorRef.current.getDeviceState());
    addLog(
      `Sent telemetry: HR=${telemetry.metrics.heartRate} steps=${telemetry.metrics.stepsDelta}`
    );
  }, [isConnected, deviceId]);


  useEffect(() => {
    if (autoSend && isConnected) {
      intervalRef.current = window.setInterval(() => {
        sendTelemetry();
      }, intervalMs);
    } else {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [autoSend, isConnected, intervalMs, sendTelemetry]);

  const handleConnect = async () => {
    if (!deviceId) {
      addLog("ERROR: Please enter a device ID");
      return;
    }

    if (!deviceSecret) {
      addLog("ERROR: Please enter device secret");
      return;
    }

    try {
      await wsService.connect(deviceId, deviceSecret);
      setIsConnected(true);
      addLog(`Connecting to device: ${deviceId} with HMAC signature`);

      const unsubscribe = wsService.onCommand((cmd) => {
        addLog(`Received command: ${cmd.name}`);
        setCommandLog((prev) => [cmd, ...prev.slice(0, 9)]);
      });

      return () => unsubscribe();
    } catch (error) {
      setIsConnected(false);
      addLog(`ERROR: Connection error: ${error}`);
    }
  };

  const handleDisconnect = () => {
    wsService.disconnect();
    setIsConnected(false);
    addLog("Disconnected");
  };

  const clearLogs = () => {
    setConnectionLog([]);
    setTelemetryLog([]);
    setCommandLog([]);
    generatorRef.current.resetState();
    setDeviceState({
      battery: 0.95,
      sessionActive: false,
      stepsTotal: 0,
    });
    addLog("Logs cleared");
  };

  return (
    <div className="px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          WebSocket Test Console
        </h1>

        {loadError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
            {loadError}
          </div>
        )}

        {device && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
            <p className="font-medium">Device: {device.name}</p>
            <p className="text-sm font-mono">ID: {device.id}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Connection</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device ID{" "}
                {device && (
                  <span className="text-gray-500 font-normal">
                    (from /devices/my-device)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                disabled={isConnected || !!device}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter device ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Secret{" "}
                {device && (
                  <span className="text-gray-500 font-normal">
                    (HMAC signature key)
                  </span>
                )}
              </label>
              <input
                type="password"
                value={deviceSecret}
                onChange={(e) => setDeviceSecret(e.target.value)}
                disabled={isConnected || !!device}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Enter device secret"
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleConnect}
                disabled={isConnected}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect
              </button>
              <button
                onClick={handleDisconnect}
                disabled={!isConnected}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Disconnect
              </button>
              <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isConnected
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
            </div>
          </div>
        </div>

        {/* Telemetry Control */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Telemetry Control
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={sendTelemetry}
                disabled={!isConnected}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Telemetry
              </button>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoSend}
                  onChange={(e) => setAutoSend(e.target.checked)}
                  disabled={!isConnected}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Auto-send</span>
              </label>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Interval (ms):</label>
                <input
                  type="number"
                  value={intervalMs}
                  onChange={(e) => setIntervalMs(Number(e.target.value))}
                  disabled={autoSend}
                  className="w-24 px-2 py-1 border border-gray-300 rounded"
                  min="1000"
                  max="10000"
                  step="1000"
                />
              </div>
            </div>

            {autoSend && (
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-medium text-blue-900 mb-2">Device State</h3>
                <div className="grid grid-cols-3 gap-4 text-sm text-blue-800">
                  <div>
                    <span className="font-medium">Battery:</span>{" "}
                    {(deviceState.battery * 100).toFixed(1)}%
                  </div>
                  <div>
                    <span className="font-medium">Total Steps:</span>{" "}
                    {deviceState.stepsTotal}
                  </div>
                  <div>
                    <span className="font-medium">Session:</span>{" "}
                    {deviceState.sessionActive ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connection Log */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Connection Log
              </h2>
              <button
                onClick={clearLogs}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {connectionLog.length === 0 ? (
                <p className="text-sm text-gray-500">No events yet</p>
              ) : (
                connectionLog.map((log, idx) => (
                  <div
                    key={idx}
                    className="text-xs font-mono bg-gray-50 p-2 rounded"
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Telemetry Log */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Telemetry Sent ({telemetryLog.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {telemetryLog.length === 0 ? (
                <p className="text-sm text-gray-500">No telemetry sent</p>
              ) : (
                telemetryLog.map((t) => (
                  <div
                    key={t.messageId}
                    className="bg-blue-50 p-2 rounded text-xs"
                  >
                    <div className="text-gray-500 mb-1">
                      {new Date(t.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-blue-900">
                      <div>HR: {t.metrics.heartRate}</div>
                      <div>Steps: +{t.metrics.stepsDelta}</div>
                      <div>Cal: +{t.metrics.caloriesDelta}</div>
                      <div>Batt: {(t.metrics.battery * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Command Log */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Commands Received ({commandLog.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {commandLog.length === 0 ? (
                <p className="text-sm text-gray-500">No commands received</p>
              ) : (
                commandLog.map((cmd, idx) => (
                  <div key={idx} className="bg-green-50 p-2 rounded text-xs">
                    <div className="font-medium text-green-900">{cmd.name}</div>
                    {cmd.payload && (
                      <div className="text-green-700 mt-1">
                        {JSON.stringify(cmd.payload)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
