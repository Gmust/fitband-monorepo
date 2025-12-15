# Fitband Monorepo

A monorepo containing all Fitband IoT project components: frontend, backend API, MQTT broker, and infrastructure setup.

## Repository Structure

**Note:** This monorepo uses git submodules. All components are separate repositories linked as submodules.

```
fitband-monorepo/
├── frontend/                 # Frontend React application (git submodule)
│   ├── src/                 # Frontend source code
│   ├── public/              # Frontend static assets
│   └── package.json         # Frontend dependencies
├── backend-api/             # NestJS REST API (git submodule)
│   ├── src/                 # API source code
│   ├── prisma/              # Database schema
│   ├── scripts/              # Deployment scripts
│   └── docs/                # API documentation
├── mqtt-broker/             # MQTT/WebSocket broker (git submodule)
└── postgres-vm/             # PostgreSQL VM setup (git submodule)
```

## Components

### 1. Frontend (`frontend/`)

React + TypeScript frontend application for monitoring and simulating IoT fitness band devices.

**Repository:** [mock-device-front](https://github.com/Gmust/mock-device-front)

**Tech Stack:**

- React 19
- TypeScript
- TanStack Router
- Vite
- Tailwind CSS

**Quick Start:**

```bash
cd frontend
npm install
npm run dev
```

See `frontend/README.md` for detailed frontend documentation.

### 2. Backend API (`backend-api/`)

NestJS-based REST API for IoT fitness band telemetry data management.

**Repository:** [fitband-api](https://github.com/Gmust/fitband-api)

**Tech Stack:**

- NestJS
- PostgreSQL with Prisma ORM
- Docker
- Swagger/OpenAPI

**Quick Start:**

```bash
cd backend-api
npm install
npm run start:dev
```

See `backend-api/README.md` for detailed API documentation.

### 3. MQTT Broker (`mqtt-broker/`)

MQTT broker and WebSocket server for real-time device communication.

**Repository:** [fitband-mqtt-broker](https://github.com/Kushlak/fitband-mqtt-broker)

**Tech Stack:**

- NestJS
- MQTT
- WebSocket
- Docker

**Quick Start:**

```bash
cd mqtt-broker
npm install
npm run start:dev
```

See `mqtt-broker/README.md` for detailed documentation.

### 4. PostgreSQL VM (`postgres-vm/`)

Infrastructure setup scripts for PostgreSQL database on VM.

**Repository:** [fitband-postrges-vm](https://github.com/Gmust/fitband-postrges-vm)

**Quick Start:**

```bash
cd postgres-vm
./setup.sh
```

See `postgres-vm/README.md` for detailed documentation.

## Development Workflow

### Initial Setup

1. **Clone the repository with submodules:**

   ```bash
   git clone --recurse-submodules <monorepo-url>
   cd fitband-monorepo
   ```

   Or if you already cloned without submodules:

   ```bash
   git submodule update --init --recursive
   ```

2. **Setup Frontend:**

   ```bash
   cd frontend
   npm install
   cp .env.example .env  # if .env.example exists
   ```

3. **Setup Backend API:**

   ```bash
   cd backend-api
   npm install
   cp env.example .env
   npm run migrate:dev
   ```

4. **Setup MQTT Broker:**
   ```bash
   cd infrastructure/mqtt-broker
   npm install
   cp env.example .env
   ```

### Running All Services

**Terminal 1 - Frontend:**

```bash
cd frontend
npm run dev
```

**Terminal 2 - Backend API:**

```bash
cd backend-api
npm run start:dev
```

**Terminal 3 - MQTT Broker:**

```bash
cd mqtt-broker
npm run start:dev
```

## Environment Variables

Each component has its own `.env` file. Copy the example files:

- `frontend/.env.example` → `frontend/.env` (if exists)
- `backend-api/env.example` → `backend-api/.env`
- `mqtt-broker/env.example` → `mqtt-broker/.env`
- `postgres-vm/env.example` → `postgres-vm/.env`

## Docker Development

Each component can be run with Docker:

```bash
# Backend API
cd backend-api
docker-compose up -d

# MQTT Broker
cd infrastructure/mqtt-broker
docker-compose up -d
```

## Project Links

- **Frontend**: [mock-device-front](https://github.com/Gmust/mock-device-front)
- **Backend API**: [fitband-api](https://github.com/Gmust/fitband-api)
- **MQTT Broker**: [fitband-mqtt-broker](https://github.com/Kushlak/fitband-mqtt-broker)
- **PostgreSQL VM**: [fitband-postrges-vm](https://github.com/Gmust/fitband-postrges-vm)

## License

MIT
