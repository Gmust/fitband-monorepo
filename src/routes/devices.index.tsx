import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { authService } from "../services/auth";
import { apiClient } from "../services/api";
import { formatDate } from "../utils/date";

export const Route = createFileRoute("/devices/")({
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
    const devices = await apiClient.getDevices();
    const myDevice = await apiClient.getMyDevice().catch(() => null);
    return { devices, myDevice };
  },
  component: DevicesList,
});

function DevicesList() {
  const data = Route.useLoaderData();
  const { devices, myDevice } = data;

  return (
    <div className="px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Devices</h1>
          {myDevice && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
              <p className="font-medium">Your device: {myDevice.name}</p>
              <Link
                to="/devices/$deviceId"
                params={{ deviceId: myDevice.id }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View details and simulate telemetry →
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {devices.map((device: { id: string; name: string; createdAt: string }) => (
              <li key={device.id}>
                <Link
                  to="/devices/$deviceId"
                  params={{ deviceId: device.id }}
                  className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-600">
                        {device.name}
                      </p>
                      <p className="text-sm text-gray-500">ID: {device.id}</p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      {device.id === myDevice?.id && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Your device
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Created: {formatDate(device.createdAt)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
