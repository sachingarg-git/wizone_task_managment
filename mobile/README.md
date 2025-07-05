# Wizone IT Support Portal - Mobile App

A comprehensive React Native mobile application for the Wizone IT Support Portal, providing full task management and customer support functionality on mobile devices.

## Features

### 🔐 Authentication
- Secure username/password login system
- Session-based authentication with backend integration
- Auto-login with stored credentials
- Demo credentials support for quick testing

### 📊 Dashboard
- Real-time performance statistics
- Task overview with visual status indicators
- Recent tasks display with detailed information
- Responsive grid layout optimized for mobile

### ✅ Task Management
- Complete task listing with search and filtering
- Task details with status, priority, and assignment info
- Field engineer assignment tracking
- Customer information integration
- Pull-to-refresh functionality

### 👥 Customer Management
- Customer database with contact information
- Company and service type tracking
- Direct call and email integration
- Address and location information
- Advanced search capabilities

### 👤 User Management (Admin Only)
- User listing with role-based access control
- Performance metrics integration
- Role and department filtering
- Detailed user profiles with contact info

### 🔧 Profile & Settings
- Personal profile management
- Performance statistics overview
- Account settings and preferences
- Secure logout functionality

## Technology Stack

### Frontend
- **React Native** with Expo framework
- **TypeScript** for type safety
- **React Native Paper** for Material Design components
- **React Navigation** for screen navigation
- **TanStack Query** for server state management
- **React Native Vector Icons** for consistent iconography

### Backend Integration
- Connects to existing Express.js backend
- RESTful API integration
- Session-based authentication
- Real-time data synchronization

### State Management
- Context API for authentication state
- TanStack Query for server state caching
- AsyncStorage for local data persistence

## Architecture

```
mobile/
├── src/
│   ├── context/          # React Context providers
│   │   └── AuthContext.tsx
│   ├── screens/          # Main app screens
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── TasksScreen.tsx
│   │   ├── CustomersScreen.tsx
│   │   ├── UsersScreen.tsx
│   │   └── ProfileScreen.tsx
│   └── utils/            # Utility functions
│       └── api.ts        # API integration layer
├── App.tsx               # Main app component with navigation
├── app.json              # Expo configuration
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Setup Instructions

### Prerequisites
- Node.js 16+ installed
- Expo CLI installed globally: `npm install -g @expo/cli`
- iOS Simulator (for iOS) or Android emulator (for Android)

### Installation

1. **Navigate to mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure backend URL:**
   - Edit `src/utils/api.ts`
   - Update `API_BASE_URL` to match your backend server
   ```typescript
   const API_BASE_URL = 'http://your-backend-url:5000';
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Run on device/simulator:**
   - For iOS: Press `i` in terminal or use Expo Go app
   - For Android: Press `a` in terminal or use Expo Go app
   - For web: Press `w` in terminal

## Configuration

### API Configuration
The mobile app connects to the same backend as the web application. Update the API base URL in `src/utils/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:5000'; // Development
// const API_BASE_URL = 'https://your-production-api.com'; // Production
```

### Authentication
The app uses the same authentication system as the web version:
- Username/password login
- Session-based authentication
- Secure credential storage with AsyncStorage

### Demo Credentials
- Username: `manpreet`
- Password: `admin123`

## Features by Screen

### Login Screen
- Clean, professional login interface
- Demo credentials quick-fill button
- Password visibility toggle
- Error handling with user-friendly messages

### Dashboard
- 6 key performance metric cards
- Recent tasks list with status indicators
- Pull-to-refresh functionality
- Role-based welcome message

### Tasks Screen
- Comprehensive task listing
- Search and filter capabilities
- Status and priority indicators
- Task details modal with full information
- Field engineer assignment display

### Customers Screen
- Customer database with contact info
- Direct call and email integration
- Company and service type display
- Address information with formatting
- Search functionality across all fields

### Users Screen (Admin Only)
- Admin-only access control
- User listing with role indicators
- Performance metrics integration
- Role-based filtering
- Detailed user information

### Profile Screen
- Personal information display
- Performance statistics overview
- Account settings access
- Secure logout functionality
- App version and build information

## Development

### Code Structure
- **Screens**: Individual app screens with business logic
- **Components**: Reusable UI components
- **Context**: Global state management
- **Utils**: Helper functions and API integration
- **Types**: TypeScript type definitions

### Styling
- React Native Paper for consistent Material Design
- Custom styles with responsive design
- Wizone brand colors and theme integration
- Accessible design with proper contrast ratios

### Data Flow
1. User interaction triggers API call
2. TanStack Query manages request state
3. Data flows through React components
4. UI updates reflect current state
5. Background sync keeps data fresh

## Build & Deployment

### Development Build
```bash
npm run start
```

### Production Build
```bash
# For iOS
expo build:ios

# For Android
expo build:android
```

### Publishing Updates
```bash
expo publish
```

## Security

### Authentication
- Secure credential storage
- Session-based authentication
- Automatic token refresh
- Secure logout with credential cleanup

### Data Protection
- HTTPS enforcement for API calls
- Input validation and sanitization
- Role-based access control
- Secure error handling

## Performance

### Optimization Features
- Image lazy loading
- Efficient list rendering with FlatList
- Query caching with TanStack Query
- Optimistic updates for better UX
- Background data synchronization

### Monitoring
- Error boundary implementation
- Performance tracking
- User interaction analytics
- Crash reporting integration

## Support

For technical support or questions:
- Check the main web application documentation
- Review API documentation
- Contact the development team

## Version History

- **v1.0.0** - Initial mobile app release
  - Complete feature parity with web version
  - Native mobile UI/UX optimization
  - Offline capability preparation
  - Performance optimization

---

© 2025 Wizone IT Support Portal - Mobile Application