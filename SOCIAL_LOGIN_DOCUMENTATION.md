# 🔐 Social Login Implementation Documentation

## Overview
The Smart Rental System now supports social login using Google and Facebook OAuth2 strategies via Passport.js. Users can authenticate using their Google or Facebook accounts, with automatic user creation for new social login users.

## 🎯 Features Implemented

### Core Functionality:
- **Google OAuth2**: Complete Google authentication flow
- **Facebook OAuth2**: Complete Facebook authentication flow
- **Automatic User Creation**: New users are created with TENANT role
- **Existing User Lookup**: Users are found by email and authenticated
- **JWT Token Generation**: Secure token-based authentication
- **Frontend Integration**: Seamless redirect flow with token storage

### User Flow:
1. User clicks "Google" or "Facebook" button on login page
2. Redirected to OAuth provider for authentication
3. Provider redirects back to backend with user data
4. Backend creates/finds user and generates JWT token
5. User redirected to frontend with token in URL
6. Frontend stores token and logs user in
7. User redirected to dashboard

## 🛠️ Backend Implementation

### Dependencies Added:
```bash
npm install passport passport-google-oauth20 passport-facebook express-session
```

### Database Schema Updates:
```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String?  // Made optional for social login users
  role      UserRole @default(TENANT)
  googleId  String?  @unique  // New field
  facebookId String? @unique  // New field
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // ... relationships
}
```

### Key Files:

#### 1. **Passport Configuration** (`config/passport.js`)
- Google OAuth2 strategy setup
- Facebook OAuth2 strategy setup
- User lookup and creation logic
- JWT token generation
- Random password generation for social users

#### 2. **Social Auth Routes** (`routes/socialAuthRoutes.js`)
- `/api/auth/google` - Initiates Google OAuth
- `/api/auth/google/callback` - Handles Google OAuth callback
- `/api/auth/facebook` - Initiates Facebook OAuth
- `/api/auth/facebook/callback` - Handles Facebook OAuth callback

#### 3. **Server Integration** (`server.js`)
- Session middleware for Passport
- Passport initialization
- Social auth routes integration

#### 4. **Auth Controller Updates** (`controllers/authController.js`)
- Updated login function to handle users without passwords
- Social login user detection and appropriate error messages

## 🎨 Frontend Implementation

### Key Components:

#### 1. **LoginPage Updates** (`frontend/src/pages/LoginPage.jsx`)
- Added Google and Facebook login buttons
- Social login button styling with provider icons
- OAuth redirect handling

#### 2. **AuthCallback Component** (`frontend/src/pages/AuthCallback.jsx`)
- Handles OAuth redirects from backend
- Extracts token from URL parameters
- Calls `loginWithToken` function
- Shows loading state during authentication

#### 3. **AuthContext Updates** (`frontend/src/contexts/AuthContext.jsx`)
- Added `loginWithToken` function
- Token-based authentication support
- Seamless integration with existing auth flow

#### 4. **App.jsx Updates**
- Added `/auth/callback` route
- AuthCallback component integration

## 🔧 Configuration

### Environment Variables Required:
```bash
# Google OAuth2
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Facebook OAuth2
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here

# Session (for Passport.js)
SESSION_SECRET=your_session_secret_here

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:5173
```

### Google OAuth2 Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth2 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)

### Facebook OAuth2 Setup:
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth settings
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/facebook/callback` (development)
   - `https://yourdomain.com/api/auth/facebook/callback` (production)

## 🔄 Authentication Flow

### Google OAuth Flow:
1. **User clicks "Google" button**
   - Frontend redirects to `/api/auth/google`
   - Backend initiates Google OAuth

2. **Google authentication**
   - User authenticates with Google
   - Google redirects to `/api/auth/google/callback`

3. **Backend processing**
   - Passport.js processes Google user data
   - Looks up user by email
   - Creates new user if not found
   - Generates JWT token

4. **Frontend callback**
   - Backend redirects to frontend with token
   - Frontend stores token in localStorage
   - User logged in and redirected to dashboard

### Facebook OAuth Flow:
1. **User clicks "Facebook" button**
   - Frontend redirects to `/api/auth/facebook`
   - Backend initiates Facebook OAuth

2. **Facebook authentication**
   - User authenticates with Facebook
   - Facebook redirects to `/api/auth/facebook/callback`

3. **Backend processing**
   - Passport.js processes Facebook user data
   - Looks up user by email
   - Creates new user if not found
   - Generates JWT token

4. **Frontend callback**
   - Backend redirects to frontend with token
   - Frontend stores token in localStorage
   - User logged in and redirected to dashboard

## 🎨 UI/UX Features

### Login Page Enhancements:
- **Social Login Buttons**: Styled Google and Facebook buttons
- **Provider Icons**: Official Google and Facebook logos
- **Responsive Design**: Mobile-friendly button layout
- **Loading States**: Visual feedback during OAuth process

### AuthCallback Page:
- **Loading Spinner**: Animated loading indicator
- **Progress Messages**: Clear status updates
- **Error Handling**: Graceful error display
- **Automatic Redirect**: Seamless flow completion

### Visual Design:
- **Google Button**: Blue color scheme with Google logo
- **Facebook Button**: Blue color scheme with Facebook logo
- **Hover Effects**: Interactive button states
- **Consistent Styling**: Matches existing design system

## 🔒 Security Features

### Token Security:
- **JWT Tokens**: Secure token-based authentication
- **Token Expiration**: Configurable token lifetime
- **Secure Storage**: Tokens stored in localStorage
- **Token Verification**: Backend validates all tokens

### OAuth Security:
- **Provider Verification**: OAuth providers verify user identity
- **Email Verification**: Users authenticated via verified email
- **Secure Redirects**: HTTPS redirects in production
- **Session Management**: Secure session handling

### User Data Protection:
- **Minimal Data Collection**: Only necessary user information
- **Password Security**: Social users get random passwords
- **Role Assignment**: Default TENANT role for social users
- **Data Privacy**: No sensitive data stored unnecessarily

## 🧪 Testing

### Manual Testing:
1. **Google Login Test**:
   - Click "Google" button on login page
   - Complete Google authentication
   - Verify redirect to dashboard
   - Check user data in database

2. **Facebook Login Test**:
   - Click "Facebook" button on login page
   - Complete Facebook authentication
   - Verify redirect to dashboard
   - Check user data in database

3. **Existing User Test**:
   - Login with social account
   - Logout and login again
   - Verify same user account used

### Error Testing:
1. **Invalid OAuth Credentials**:
   - Test with incorrect client IDs
   - Verify appropriate error messages

2. **Network Errors**:
   - Test with network interruptions
   - Verify graceful error handling

3. **Database Errors**:
   - Test with database connection issues
   - Verify error logging and user feedback

## 🚀 Deployment

### Development Setup:
1. **Install Dependencies**:
   ```bash
   npm install passport passport-google-oauth20 passport-facebook express-session
   ```

2. **Update Database Schema**:
   ```bash
   npx prisma db push
   ```

3. **Configure Environment Variables**:
   - Add OAuth credentials to `.env`
   - Set SESSION_SECRET
   - Configure FRONTEND_URL

4. **Start Development Server**:
   ```bash
   npm start
   ```

### Production Setup:
1. **Environment Variables**:
   - Use production OAuth credentials
   - Set secure SESSION_SECRET
   - Configure production FRONTEND_URL

2. **HTTPS Configuration**:
   - Enable HTTPS for OAuth redirects
   - Update OAuth provider settings

3. **Database Migration**:
   - Run production database migrations
   - Verify schema updates

## 🔧 Troubleshooting

### Common Issues:

#### 1. **OAuth Redirect Errors**
- **Problem**: Invalid redirect URI
- **Solution**: Update OAuth provider settings with correct redirect URIs

#### 2. **Token Storage Issues**
- **Problem**: Token not stored in localStorage
- **Solution**: Check browser console for errors, verify token format

#### 3. **User Creation Failures**
- **Problem**: Social users not created in database
- **Solution**: Check database connection, verify schema updates

#### 4. **Session Issues**
- **Problem**: Passport sessions not working
- **Solution**: Verify SESSION_SECRET is set, check session middleware

### Debug Commands:
```bash
# Check OAuth endpoints
curl http://localhost:3000/api/auth/google
curl http://localhost:3000/api/auth/facebook

# Check environment variables
echo $GOOGLE_CLIENT_ID
echo $FACEBOOK_APP_ID

# Test database connection
npx prisma db push
```

## 📊 Monitoring

### Logging:
- **OAuth Attempts**: Log all OAuth initiation attempts
- **User Creation**: Log new social user creation
- **Token Generation**: Log successful token generation
- **Error Tracking**: Log OAuth errors and failures

### Metrics:
- **Social Login Usage**: Track Google vs Facebook usage
- **User Creation Rate**: Monitor new user signups
- **Error Rates**: Track OAuth failure rates
- **Performance**: Monitor OAuth response times

## 🔮 Future Enhancements

### Potential Improvements:
1. **Additional Providers**: LinkedIn, Twitter, GitHub
2. **Profile Completion**: Social login user profile setup
3. **Account Linking**: Link multiple social accounts
4. **Advanced Permissions**: Request additional OAuth scopes
5. **Analytics Integration**: Track social login analytics
6. **A/B Testing**: Test different OAuth flows

### Security Enhancements:
1. **Two-Factor Authentication**: Add 2FA for social users
2. **Account Verification**: Email verification for social users
3. **Session Management**: Advanced session handling
4. **Rate Limiting**: OAuth endpoint rate limiting

## 📋 Implementation Checklist

### ✅ Completed Features:
- [x] Google OAuth2 integration
- [x] Facebook OAuth2 integration
- [x] User database schema updates
- [x] Passport.js configuration
- [x] Social auth routes
- [x] Frontend login buttons
- [x] AuthCallback component
- [x] Token-based authentication
- [x] Error handling
- [x] Loading states
- [x] Responsive design

### 🔄 Pending Tasks:
- [ ] Production OAuth credentials
- [ ] HTTPS configuration
- [ ] Advanced error handling
- [ ] User profile completion
- [ ] Analytics integration
- [ ] Performance optimization

## 🎯 Best Practices

### Security:
- Use HTTPS in production
- Implement proper session management
- Validate all OAuth data
- Secure token storage
- Regular security audits

### Performance:
- Optimize OAuth redirects
- Cache user data appropriately
- Monitor response times
- Implement rate limiting

### User Experience:
- Clear error messages
- Smooth loading states
- Consistent branding
- Mobile-friendly design
- Accessibility compliance

## 📚 Resources

### Documentation:
- [Passport.js Documentation](http://www.passportjs.org/)
- [Google OAuth2 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Facebook OAuth2 Guide](https://developers.facebook.com/docs/facebook-login)

### Tools:
- [Google Cloud Console](https://console.cloud.google.com/)
- [Facebook Developers](https://developers.facebook.com/)
- [OAuth 2.0 Playground](https://oauth2.thephpleague.com/)

The social login implementation is now complete and ready for use! 🎉 