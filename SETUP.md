# Cicero Frontend Setup Guide

## ✅ Prerequisites Completed

- [x] Node.js 18+ installed
- [x] Dependencies installed (`npm install`)
- [x] Environment file created (`.env`)

## 🔧 Environment Configuration

### 1. API Configuration

The frontend is configured to connect to:
- **Development**: `http://localhost:8000` (backend running locally)
- **Production**: `https://cicero-prod-bad7a3dceedc.herokuapp.com` (live backend)

To switch to production testing, uncomment these lines in `.env`:
```env
VITE_API_URL=https://cicero-prod-bad7a3dceedc.herokuapp.com
VITE_WS_URL=wss://cicero-prod-bad7a3dceedc.herokuapp.com
```

### 2. Google OAuth Setup (Optional)

For authentication to work, you'll need a Google OAuth client ID:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 Client ID credentials
5. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - Your production domain (when deployed)
6. Copy the Client ID to `.env`:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here
   ```

### 3. Stripe Setup (Optional)

For billing features, add your Stripe publishable key:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to Developers → API Keys
3. Copy the Publishable key (starts with `pk_`)
4. Add to `.env`:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_or_pk_live_key_here
   ```

## 🚀 Running the Frontend

### Development Mode
```bash
npm run dev
```
Opens at: http://localhost:3000

### Production Build
```bash
npm run build
npm run preview
```

### With Backend
```bash
# From project root directory
./dev.sh
```
This starts both backend (port 8000) and frontend (port 3000)

## 🔍 Testing the Setup

### 1. Basic Functionality
- Open http://localhost:3000
- You should see the login page with glassmorphism design
- Navigation should be responsive

### 2. API Connection
- Check browser console for any connection errors
- Try accessing protected routes (should redirect to login)

### 3. Authentication Flow
**Without Google OAuth configured:**
- Login/signup forms will appear but Google button won't work
- You can still test the UI and routing

**With Google OAuth configured:**
- Google Sign-In button should be functional
- Test login flow end-to-end

## 🐛 Troubleshooting

### Common Issues

**1. "Failed to fetch" errors**
- Ensure backend is running on port 8000
- Check CORS settings in backend
- Verify API URLs in `.env`

**2. Google Sign-In not working**
- Check `VITE_GOOGLE_CLIENT_ID` is correct
- Verify authorized origins in Google Cloud Console
- Check browser console for Google API errors

**3. Build errors**
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript/ESLint errors: `npm run lint`

**4. Styling issues**
- Ensure Tailwind CSS is processing correctly
- Check browser dev tools for CSS loading

### Debug Mode

To debug API calls, open browser dev tools:
1. Network tab to see API requests
2. Console tab for JavaScript errors
3. Application tab to check localStorage (auth tokens)

## 📝 Development Notes

### File Structure
```
src/
├── components/     # Reusable UI components
├── pages/         # Route pages
├── services/      # API and WebSocket services
├── context/       # React context (auth, etc.)
├── hooks/         # Custom React hooks
└── styles/        # Global CSS and design system
```

### Design System
- Based on Lawgiver Design System Guide
- Glassmorphism with dark theme
- Tailwind CSS for utility classes
- Custom CSS variables for consistency

### State Management
- React Context for authentication
- Local state for component data
- No external state management (Redux, Zustand) yet

## 🎯 Next Steps

1. **Implement Chat Interface**
   - Create chat components
   - Integrate WebSocket streaming
   - Add message history

2. **Billing Integration**
   - Stripe checkout flow
   - Subscription management
   - Usage tracking display

3. **Search Functionality**
   - Search input and filters
   - Results display
   - Pagination

See [TODO.md](./TODO.md) for comprehensive development roadmap.

## 🆘 Getting Help

- Check the main project [CLAUDE.md](../CLAUDE.md) for backend integration details
- Review component examples in the codebase
- Check browser console for detailed error messages