# 🧪 Frontend-Backend Integration Test Guide

## 🎯 Testing Overview

This guide provides comprehensive testing steps for the secure frontend-backend integration of the CoreV4 Mental Health Platform.

---

## 🚀 Quick Start Testing

### Prerequisites
1. **Node.js 18+** installed
2. **PostgreSQL** database running (optional for basic testing)
3. **Redis** server running (optional for session management)

### Start Backend Server
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run build
npm start
```

Backend should be running on: `http://localhost:3001`

### Start Frontend Development Server
```bash
# In main project directory
cp .env.example .env.local
# Edit .env.local with encryption key
npm install
npm run dev
```

Frontend should be running on: `http://localhost:5173`

---

## 🔐 Security Integration Tests

### 1. **Secure Storage Migration Test**
Test that localStorage usage has been migrated to secure storage:

```bash
# Run migration script (if needed)
node migrate-to-secure-storage.js

# Check for any remaining localStorage usage
grep -r "localStorage\." src/ --include="*.ts" --include="*.tsx"
```

**Expected Result:** No localStorage usage in sensitive files (crisis, wellness, auth)

### 2. **Encryption Key Test**
Verify encryption is working:

1. Set encryption key in `.env.local`:
   ```env
   VITE_ENCRYPTION_KEY=test-256-bit-key-for-development-only-change-production
   ```

2. Open browser DevTools → Application → Local Storage
3. Add some crisis data (safety plan, mood entry)
4. Check localStorage - data should be encrypted (prefixed with `encrypted_`)

**Expected Result:** Sensitive data is encrypted in browser storage

### 3. **API Authentication Test**
Test secure backend communication:

1. Open Network tab in DevTools
2. Perform any action that requires backend communication
3. Check API requests include proper headers:
   - `Authorization: Bearer <token>`
   - `Content-Type: application/json`
   - `X-Client-Version: 4.0.0`

**Expected Result:** All API calls include authentication headers

---

## 🏥 Feature Integration Tests

### 1. **Anonymous Authentication Flow**
Test anonymous user creation and backend registration:

```javascript
// Open browser console and run:
const testAnonymousAuth = async () => {
  // Clear any existing data
  localStorage.clear();
  
  // Reload page to trigger anonymous user creation
  window.location.reload();
  
  // Wait for page load, then check
  setTimeout(() => {
    const user = JSON.parse(secureStorage.getItem('anonymous_user') || '{}');
    console.log('Anonymous user created:', user);
    console.log('User ID format valid:', user.id.startsWith('anon_'));
  }, 2000);
};

testAnonymousAuth();
```

**Expected Result:** Anonymous user created with secure ID, registered with backend

### 2. **Crisis Intervention Test**
Test crisis assessment and secure data storage:

1. Navigate to Crisis Intervention section
2. Complete a crisis assessment
3. Check Network tab for API call to `/api/crisis/assessment`
4. Verify response includes proper crisis resources
5. Check secure storage for encrypted assessment data

**Expected Result:** Crisis data sent securely to backend, encrypted locally

### 3. **WebSocket Connection Test**
Test real-time features:

```javascript
// Open browser console and run:
const testWebSocket = async () => {
  const { secureWebSocket } = await import('./src/services/websocket/SecureWebSocketClient.ts');
  
  // Test connection
  await secureWebSocket.connect();
  console.log('WebSocket connected:', secureWebSocket.connected);
  
  // Test crisis room join
  secureWebSocket.joinCrisisRoom('test-room-123');
  
  // Test wellness subscription
  secureWebSocket.subscribeToWellnessUpdates();
};

testWebSocket();
```

**Expected Result:** WebSocket connects securely, can join crisis rooms and subscribe to updates

---

## 🛡️ Security Validation Tests

### 1. **XSS Protection Test**
Verify Content Security Policy is active:

```javascript
// Try to execute inline script (should be blocked)
const script = document.createElement('script');
script.innerHTML = 'alert("XSS Test")';
document.head.appendChild(script);
```

**Expected Result:** Script blocked by CSP, error in console

### 2. **Data Encryption Test**
Verify sensitive data is encrypted:

```javascript
// Test encryption of sensitive data
const testData = { mood: 5, notes: "Feeling anxious today" };
secureStorage.setItem('mood_data', JSON.stringify(testData));

// Check raw localStorage (should be encrypted)
const rawData = localStorage.getItem('encrypted_mood_data');
console.log('Raw encrypted data:', rawData);

// Check decrypted access (should be readable)
const decrypted = secureStorage.getItem('mood_data');
console.log('Decrypted data:', JSON.parse(decrypted));
```

**Expected Result:** Raw data is encrypted, decrypted data is readable

### 3. **HIPAA Audit Logging Test**
Verify audit trails are created:

1. Perform sensitive data access (view safety plan, crisis assessment)
2. Check Network tab for calls to `/api/audit/log`
3. Verify audit entries include:
   - User ID (hashed for anonymity)
   - Action taken
   - Timestamp
   - Resource accessed

**Expected Result:** All sensitive data access is audited and logged securely

---

## ⚡ Performance Integration Tests

### 1. **API Response Time Test**
Test backend response times:

```javascript
const testAPIPerformance = async () => {
  const start = performance.now();
  
  try {
    const response = await fetch('http://localhost:3001/api/crisis/resources');
    const end = performance.now();
    
    console.log(`API Response Time: ${end - start}ms`);
    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Resources received:', data.resources?.length || 0);
    }
  } catch (error) {
    console.error('API Test Failed:', error);
  }
};

testAPIPerformance();
```

**Expected Result:** API responses under 200ms for basic endpoints

### 2. **WebSocket Latency Test**
Test real-time communication latency:

```javascript
const testWebSocketLatency = async () => {
  const { secureWebSocket } = await import('./src/services/websocket/SecureWebSocketClient.ts');
  
  await secureWebSocket.connect();
  
  // Test message round-trip time
  const start = performance.now();
  
  secureWebSocket.onWellnessUpdateReceived((update) => {
    const end = performance.now();
    console.log(`WebSocket Round-trip Time: ${end - start}ms`);
  });
  
  secureWebSocket.sendWellnessUpdate({
    type: 'mood',
    data: { mood: 5 },
    userId: 'test-user'
  });
};

testWebSocketLatency();
```

**Expected Result:** WebSocket round-trip time under 100ms

---

## 🔍 Manual Testing Checklist

### Core Functionality
- [ ] Anonymous user registration works
- [ ] Crisis assessment saves and encrypts data
- [ ] Safety plans save securely
- [ ] Emergency contacts encrypt properly
- [ ] Mood tracking data is encrypted
- [ ] Journal entries are encrypted
- [ ] Wellness data syncs with backend

### Security Features
- [ ] No localStorage usage for sensitive data
- [ ] All sensitive data encrypted in browser
- [ ] CSP blocks inline scripts
- [ ] API calls include authentication
- [ ] WebSocket uses secure connection
- [ ] Audit logs created for sensitive actions

### Real-time Features
- [ ] WebSocket connects successfully
- [ ] Crisis room joining works
- [ ] Wellness updates sync in real-time
- [ ] Community features work
- [ ] Automatic reconnection functions

### Error Handling
- [ ] Network errors handled gracefully
- [ ] Authentication errors trigger token refresh
- [ ] WebSocket disconnections auto-reconnect
- [ ] Validation errors display properly
- [ ] Crisis escalation triggers correctly

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to backend"
**Solution:** Ensure backend server is running on port 3001
```bash
cd backend && npm start
```

### Issue: "Encryption key not found"
**Solution:** Set encryption key in `.env.local`:
```env
VITE_ENCRYPTION_KEY=your-development-key-here
```

### Issue: "WebSocket connection failed"
**Solution:** Check WebSocket URL in environment:
```env
VITE_WS_URL=ws://localhost:3001
```

### Issue: "CSP blocks resources"
**Solution:** Update CSP in `index.html` to include required domains

### Issue: "Data not encrypted"
**Solution:** Verify you're using `secureStorage` not `localStorage`

---

## 📊 Success Metrics

### Security Metrics
- ✅ 0 sensitive data in plain text localStorage
- ✅ 100% of crisis data encrypted
- ✅ All API calls authenticated
- ✅ CSP blocks 100% of inline scripts
- ✅ HIPAA audit logs for all PHI access

### Performance Metrics
- ✅ API response time < 200ms
- ✅ WebSocket latency < 100ms
- ✅ Page load time < 3s
- ✅ Crisis response time < 50ms

### Functionality Metrics
- ✅ Anonymous auth success rate: 100%
- ✅ Crisis assessment completion: 100%
- ✅ Real-time message delivery: 100%
- ✅ Data synchronization success: >95%
- ✅ Offline functionality: Basic features work

---

## 🎯 Production Readiness Checklist

Before deploying to production:

### Security
- [ ] Encryption keys moved to secure environment variables
- [ ] CSP configured for production domains
- [ ] All localStorage usage removed from sensitive data
- [ ] HTTPS enforced for all communications
- [ ] Security headers implemented
- [ ] External security audit completed

### Performance
- [ ] Bundle size optimized (<500KB)
- [ ] CDN configured for static assets
- [ ] Database queries optimized
- [ ] Caching strategies implemented
- [ ] Load testing completed

### Monitoring
- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring active
- [ ] HIPAA audit logging functional
- [ ] Health checks implemented
- [ ] Backup procedures tested

### Compliance
- [ ] HIPAA Technical Safeguards audit passed
- [ ] Data retention policies implemented
- [ ] Breach response procedures documented
- [ ] Business Associate Agreements signed

---

**🎉 Integration testing ensures your mental health platform is secure, performant, and ready to help users safely!**

*Last updated: September 1, 2025*