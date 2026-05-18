# CloudGallery - Personal Cloud Storage Platform

A modern cloud gallery platform where users authenticate with Google, store files directly in their own Google Drive, and generate API keys for external integrations.

## Features

- **Google Authentication** - Login/register with Google OAuth 2.0
- **Google Drive Storage** - All files stored in user's own Google Drive (no server storage)
- **Gallery UI** - Grid/list view, search, filter by file type, preview, rename, delete
- **API Key System** - Generate unique API keys for external app integrations
- **Developer Dashboard** - View API key, usage stats, storage info, file breakdown
- **API Documentation** - Complete docs with code examples in JavaScript, PHP, and Node.js
- **Dark Mode** - Full dark/light theme support
- **Mobile Responsive** - Works on all screen sizes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | Firebase Firestore |
| Storage | Google Drive API |
| Auth | Google OAuth 2.0 |
| Security | Helmet, JWT, Rate Limiting |

## Project Structure

```
cloud-gallery/
├── server/                    # Backend API
│   ├── src/
│   │   ├── index.js           # Express entry point
│   │   ├── config/            # Firebase & Google OAuth config
│   │   ├── middleware/        # Auth, rate limiting, file validation
│   │   ├── routes/            # API routes (auth, drive, keys, external)
│   │   ├── services/          # Drive & API key services
│   │   └── utils/             # Helpers & in-memory store
│   ├── package.json
│   └── .env.example
├── client/                    # Frontend React app
│   ├── src/
│   │   ├── App.jsx            # Router & layout
│   │   ├── components/        # Layout, FileCard, Modals
│   │   ├── pages/             # Landing, Login, Gallery, Dashboard, ApiDocs, Settings
│   │   ├── context/           # Auth & Theme contexts
│   │   ├── services/          # API client
│   │   └── utils/             # File helpers
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Setup

### Prerequisites

- Node.js 18+
- Google Cloud Console project
- Firebase project (optional - works with in-memory store for development)

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Drive API**
4. Go to **APIs & Services > Credentials**
5. Create an **OAuth 2.0 Client ID** (Web application)
   - Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy the Client ID and Client Secret

### 2. Firebase Setup (Optional)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Firestore Database**
4. Go to **Project Settings > Service Accounts**
5. Generate a new private key (JSON file)
6. Save as `firebase-service-account.json` in the `server/` directory

### 3. Backend Setup

```bash
cd cloud-gallery/server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
# GOOGLE_CLIENT_ID=your_client_id
# GOOGLE_CLIENT_SECRET=your_client_secret
# JWT_SECRET=your_random_secret
# FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Start the server
npm run dev
```

The server runs on `http://localhost:5000`.

### 4. Frontend Setup

```bash
cd cloud-gallery/client

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend runs on `http://localhost:5173` with API proxying to the backend.

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Get Google OAuth URL |
| GET | `/api/auth/google/callback` | OAuth callback handler |
| GET | `/api/auth/me` | Get current user profile |

### Google Drive
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/drive/upload` | Upload file to Drive |
| GET | `/api/drive/files` | List files |
| GET | `/api/drive/files/:id` | Get file details |
| DELETE | `/api/drive/files/:id` | Delete file |
| PATCH | `/api/drive/files/:id/rename` | Rename file |
| GET | `/api/drive/storage` | Get storage usage |

### API Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/keys` | Get API key info |
| POST | `/api/keys/regenerate` | Regenerate API key |

### External API (using API key)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/external/upload` | Upload via API key |
| GET | `/api/external/files` | List files via API key |

## Security

- JWT-based session tokens (7-day expiry)
- API key authentication for external access
- Rate limiting (100 req/15min general, 50 uploads/hour)
- File type validation
- Helmet security headers
- CORS protection

## License

MIT
