# Hololex Frontend

React-based web interface for the Hololex legislative intelligence platform, featuring a modern glassmorphism design system.

## 🚀 Features

- **Modern UI**: Glassmorphism design with dark theme
- **Authentication**: Email/password and Google OAuth integration
- **Real-time Chat**: WebSocket-based streaming responses
- **Subscription Management**: Stripe integration for billing
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type-safe**: React 18.3 with modern JavaScript

## 🛠️ Tech Stack

- **React 18.3**: UI library
- **Vite**: Build tool and dev server
- **React Router 6**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Axios**: HTTP client
- **Stripe.js**: Payment processing

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys and URLs
```

## 🔧 Environment Variables

Create a `.env` file with:

```env
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Production URLs
# VITE_API_URL=https://hololex-prod-bad7a3dceedc.herokuapp.com
# VITE_WS_URL=wss://hololex-prod-bad7a3dceedc.herokuapp.com

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## 💻 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 🎨 Design System

The app follows the Lawgiver design system with:
- Glassmorphism containers and effects
- Dark theme with subtle transparency
- Consistent color palette and typography
- Smooth animations and transitions
- Responsive layout patterns

See [DESIGN_SYSTEM_GUIDE.md](./DESIGN_SYSTEM_GUIDE.md) for detailed guidelines.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── shared/         # Shared components (GlassCard, etc.)
│   ├── layout/         # Layout components (Navigation, etc.)
│   ├── ui/             # Basic UI elements (Button, Input, etc.)
│   └── auth/           # Authentication components
├── pages/              # Route pages
├── hooks/              # Custom React hooks
├── services/           # API and WebSocket services
├── context/            # React context providers
├── styles/             # Global styles and CSS
└── utils/              # Utility functions
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push to main

### Manual Deployment

```bash
# Build the app
npm run build

# Deploy the 'dist' folder to your hosting service
```

## 🔌 API Integration

The frontend connects to the Hololex backend API:
- REST endpoints for authentication and data
- WebSocket for real-time chat streaming
- Automatic token management and refresh
- Request/response interceptors for error handling

## 🎯 Roadmap

- [x] Basic authentication flow
- [x] Glassmorphism design system
- [x] Navigation and routing
- [ ] Chat interface with streaming
- [ ] Billing and subscription management
- [ ] Search functionality
- [ ] User account management
- [ ] Settings and preferences

## 🤝 Contributing

This is part of the larger Hololex project. See the main README for contribution guidelines.

## 📄 License

Part of the Hololex Legislative Intelligence Platform.