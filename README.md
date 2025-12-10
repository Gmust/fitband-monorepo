# Mock Fitband Device Frontend

A React + TypeScript frontend application for monitoring and simulating IoT fitness band devices.

## Features

- **Authentication**: User registration and login with JWT tokens
- **Device Management**: View all devices and your personal device
- **Telemetry Simulation**: Generate and send simulated telemetry data via WebSocket
- **Real-time Communication**: WebSocket connection for bidirectional device communication
- **Protected Routes**: Automatic redirect to login for unauthorized access

## Tech Stack

- **React 19**: UI framework
- **TypeScript**: Type safety
- **TanStack Router**: File-based routing with type-safe navigation
- **Axios**: HTTP client
- **Socket.IO Client**: WebSocket communication
- **Tailwind CSS**: Styling
- **Vite**: Build tool

## Prerequisites

- Node.js 18+
- Running instance of mock-fitband-api (backend)
- Optional: Running instance of fitband-mqtt-broker (for WebSocket)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your API endpoints:

**Development:**

```
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3001
```

**Production:**

```
VITE_API_BASE_URL=https://fitband-broker.duckdns.org
VITE_WS_URL=https://fitband-broker.duckdns.org
```

**Note:** For production, ensure your server has a valid SSL certificate. The domain must be properly configured in DNS.

### 3. Start development server

```bash
npm run dev
```

The app will be available at http://localhost:5173

## Project Structure

```
src/
├── routes/                 # TanStack Router pages
│   ├── __root.tsx         # Root layout with navigation
│   ├── index.tsx          # Home page
│   ├── auth.login.tsx     # Login page
│   ├── auth.register.tsx  # Register page
│   ├── profile.tsx        # User profile (protected)
│   ├── devices.index.tsx  # Devices list (protected)
│   └── devices.$deviceId.tsx # Device detail with simulation (protected)
├── services/              # API and business logic
│   ├── api.ts            # HTTP client and API endpoints
│   ├── auth.ts           # Authentication service
│   ├── telemetry.ts      # Telemetry data generator
│   └── websocket.ts      # WebSocket service
├── types/                # TypeScript type definitions
│   └── index.ts
└── main.tsx              # Application entry point
```

## Features in Detail

### Authentication

- **Register**: Create a new user account
- **Login**: Sign in with email and password
- **Token Management**: JWT token stored in localStorage
- **Auto-redirect**: Unauthenticated users redirected to login

### Device Simulation

The device detail page (`/devices/:deviceId`) provides:

- **WebSocket Connection**: Real-time bidirectional communication
- **Telemetry Generation**: Simulated sensor data (heart rate, steps, battery, motion)
- **Configurable Interval**: Adjust telemetry sending frequency
- **Live Logs**: View sent telemetry and received commands
- **Device State**: Monitor battery, steps, and session status

### Telemetry Data Structure

```typescript
{
  deviceId: string;
  timestamp: string;
  messageId: string;
  metrics: {
    heartRate: number; // 60-180 bpm
    stepsDelta: number; // 0-10 steps per reading
    caloriesDelta: number; // calculated from steps
    battery: number; // 0.05-0.95 (5%-95%)
  }
  motion: {
    ax: number; // accelerometer x
    ay: number; // accelerometer y
    az: number; // accelerometer z
  }
}
```

### Commands

The device can receive commands from the backend:

- `startSession`: Begin activity tracking session
- `stopSession`: End activity tracking session
- `vibrate`: Trigger device vibration (with duration)

## API Integration

### REST API Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/profile` - Get user profile (requires auth)
- `GET /devices` - List all devices
- `GET /devices/my-device` - Get current user's device (requires auth)
- `GET /devices/:id` - Get specific device

### WebSocket Events

**Emit:**

- `join`: Join device room with device ID
- `telemetry`: Send telemetry data

**Listen:**

- `connect`: Connection established
- `disconnect`: Connection closed
- `command`: Receive command from backend

## Development

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint code

```bash
npm run lint
```

## Environment Variables

| Variable            | Description          | Default                 |
| ------------------- | -------------------- | ----------------------- |
| `VITE_API_BASE_URL` | Backend REST API URL | `http://localhost:3000` |
| `VITE_WS_URL`       | WebSocket server URL | `http://localhost:3001` |

## Troubleshooting

### "Network Error" on API calls

- Ensure backend API is running on the configured port
- Check CORS settings in backend
- Verify `VITE_API_BASE_URL` in `.env`

### WebSocket not connecting

- Ensure MQTT broker is running on the configured port
- Check `VITE_WS_URL` in `.env`
- Verify WebSocket path is `/ws` in backend
- For HTTPS/WSS connections, ensure SSL certificate is valid
- Check browser console for detailed connection errors
- Verify DNS resolution if using domain name (e.g., `fitband-broker.duckdns.org`)

### Protected routes redirecting to login

- This is expected behavior when not authenticated
- Login to access protected pages
- Check browser localStorage for `token` and `user` keys

## Related Projects

- [mock-fitband-api](../mock-fitband-api) - Backend REST API
- [fitband-mqtt-broker](../fitband-mqtt-broker) - WebSocket/MQTT broker
- [mock-fitband-simulator](../mock-fitband-simulator) - CLI device simulator

## License

MIT
