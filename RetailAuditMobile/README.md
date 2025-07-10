# Retail Audit Mobile App

A React Native mobile application for retail execution audits, built with Expo and Supabase.

## Features

- **Authentication**: Secure login/signup with Supabase Auth
- **Offline Support**: Continue audits without internet connection
- **Camera Integration**: Take photos for audit evidence
- **Location Services**: GPS tracking for store visits
- **Real-time Sync**: Automatic data synchronization
- **Conditional Logic**: Smart question flows based on responses
- **Professional UI**: Modern, intuitive interface

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm start
```

### 4. Run on Android

```bash
npm run android
```

## Project Structure

```
src/
├── contexts/          # React contexts (Auth, etc.)
├── lib/              # Supabase client and utilities
├── navigation/       # Navigation configuration
├── screens/          # App screens
└── components/       # Reusable components
```

## Key Features

### Authentication
- Secure authentication with Supabase
- Persistent sessions with Expo SecureStore
- Role-based access control

### Audit Execution
- Step-by-step audit workflow
- Multiple question types (text, numeric, single choice, file upload)
- Photo capture and upload
- Progress saving and resumption
- Offline capability

### Data Management
- Real-time synchronization with Supabase
- Offline data storage
- Automatic conflict resolution

### UI/UX
- Material Design principles
- Responsive layouts
- Smooth animations
- Accessibility support

## Building for Production

### Android APK

```bash
npm run build:android
```

### Publishing to Google Play Store

```bash
npm run submit:android
```

## Configuration

### Permissions

The app requires the following permissions:
- Camera (for audit photos)
- Location (for store tracking)
- Storage (for offline data)

### Supabase Setup

Ensure your Supabase project has:
1. Authentication enabled
2. Row Level Security (RLS) configured
3. Database schema matching the web application

## Development

### Adding New Screens

1. Create screen component in `src/screens/`
2. Add navigation route in `src/navigation/AppNavigator.tsx`
3. Update tab bar configuration if needed

### Extending Functionality

- Add new question types in `AuditExecutionScreen.tsx`
- Implement additional data sync in `src/lib/supabase.ts`
- Create new contexts for state management

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx expo start --clear`
2. **Android build errors**: Check Java/Android SDK versions
3. **Supabase connection**: Verify environment variables

### Performance Optimization

- Use FlatList for large data sets
- Implement image compression for uploads
- Cache frequently accessed data
- Use React.memo for expensive components

## Contributing

1. Follow React Native best practices
2. Use TypeScript for type safety
3. Test on both Android and iOS
4. Update documentation for new features