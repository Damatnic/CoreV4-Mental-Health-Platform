# CoreV4 Mobile Experience Testing Checklist

## Overview
This comprehensive checklist ensures the CoreV4 Mental Health Platform delivers an exceptional mobile experience with fully functional PWA capabilities.

## Test Devices Required
- [ ] iPhone (iOS 15+)
- [ ] Android Phone (Android 10+)
- [ ] iPad/Android Tablet
- [ ] Low-end Android device (for performance testing)
- [ ] Device with limited storage (<1GB free)
- [ ] Device with poor network (3G or throttled connection)

## 1. PWA Installation & Setup

### Installation Process
- [ ] PWA install prompt appears after 30 seconds or 5 scrolls
- [ ] Install button works on Android Chrome
- [ ] "Add to Home Screen" instructions shown for iOS Safari
- [ ] App icon appears on home screen after installation
- [ ] App launches in standalone mode (no browser UI)
- [ ] Splash screen displays during app launch
- [ ] App respects device orientation lock
- [ ] Installation tracking works in analytics

### App Manifest
- [ ] App name displays correctly
- [ ] Theme color matches brand (#6366f1)
- [ ] All icon sizes load properly
- [ ] App shortcuts work (Crisis, Breathing, Safety Plan)

## 2. Crisis Features Testing

### Emergency Access (CRITICAL - Test First!)
- [ ] Crisis button accessible within 2 taps from any screen
- [ ] 988 hotline dial works immediately
- [ ] 911 emergency dial works immediately
- [ ] Crisis Text Line (741741) SMS integration works
- [ ] Emergency contacts load and dial correctly
- [ ] GPS location sharing works for emergency services
- [ ] Crisis features work completely offline
- [ ] Haptic feedback triggers on crisis actions

### Crisis Interface
- [ ] Large touch targets (minimum 44px)
- [ ] High contrast text readable in distress
- [ ] One-handed operation possible
- [ ] Swipe up reveals crisis quick actions
- [ ] Long press triggers emergency mode
- [ ] Voice commands work (if implemented)

### Offline Crisis Resources
- [ ] Safety plan loads offline
- [ ] Coping strategies accessible offline
- [ ] Emergency numbers visible offline
- [ ] Breathing exercises work offline
- [ ] Crisis chat fallback message shown offline

## 3. Mobile Navigation

### Bottom Navigation Bar
- [ ] All navigation items reachable with thumb
- [ ] Active state clearly visible
- [ ] Badge notifications display correctly
- [ ] Haptic feedback on tap
- [ ] Navigation persists across pages
- [ ] Safe area padding on iPhone X+

### Touch Gestures
- [ ] Swipe up opens drawer menu
- [ ] Swipe down closes drawer
- [ ] Swipe between dashboard widgets
- [ ] Pull-to-refresh works on dashboard
- [ ] Long press shows context menus
- [ ] Double tap to expand/collapse widgets
- [ ] Pinch to zoom on charts

### Drawer Menu
- [ ] Smooth slide animation
- [ ] Backdrop closes drawer on tap
- [ ] All menu items accessible
- [ ] Scroll works for long menu
- [ ] Crisis quick actions visible

## 4. Dashboard Experience

### Widget System
- [ ] Widgets collapse/expand smoothly
- [ ] Reordering works via drag handle
- [ ] Widget preferences save locally
- [ ] Offline-capable widgets marked clearly
- [ ] Loading states display properly
- [ ] Error states handled gracefully

### Mobile Optimization
- [ ] Text readable without zooming
- [ ] Charts/graphs touch-interactive
- [ ] Horizontal scroll avoided
- [ ] Content fits viewport width
- [ ] Images load progressively
- [ ] Lazy loading for below-fold content

## 5. Offline Functionality

### Service Worker
- [ ] App loads offline after first visit
- [ ] Offline indicator appears when disconnected
- [ ] Cached pages load instantly
- [ ] Static assets served from cache
- [ ] API fallbacks work correctly

### Data Sync
- [ ] Mood entries queue when offline
- [ ] Journal entries save locally
- [ ] Crisis interactions logged for sync
- [ ] Background sync triggers when online
- [ ] Sync complete notification appears
- [ ] No data loss during offline periods

### Offline Pages
- [ ] /offline.html loads for uncached routes
- [ ] /offline-crisis.html provides crisis resources
- [ ] Offline pages include useful content
- [ ] Navigation to cached pages works

## 6. Performance Testing

### Load Times (Target: <3s on 3G)
- [ ] Initial load under 3 seconds
- [ ] Subsequent loads under 1 second
- [ ] Dashboard renders progressively
- [ ] Images use appropriate formats (WebP)
- [ ] JavaScript bundles optimized
- [ ] CSS critical path inlined

### Battery & Memory
- [ ] Battery drain acceptable (<5% per hour active use)
- [ ] Memory usage stable over time
- [ ] No memory leaks detected
- [ ] Background processes minimal
- [ ] Wake lock only during crisis mode

### Network Optimization
- [ ] Works on 2G/3G connections
- [ ] Adaptive loading based on network
- [ ] Request batching implemented
- [ ] Unnecessary requests avoided
- [ ] Cache headers configured properly

## 7. Wellness Tools

### Mood Tracker
- [ ] Emoji selector touch-friendly
- [ ] Date picker works on mobile
- [ ] Charts readable and interactive
- [ ] History scrolls smoothly
- [ ] Offline entries sync later

### Meditation Timer
- [ ] Screen stays on during session
- [ ] Background audio continues
- [ ] Vibration patterns work
- [ ] Notification at session end
- [ ] Progress saves if interrupted

### Breathing Exercises
- [ ] Visual guide animates smoothly
- [ ] Haptic patterns match breathing
- [ ] Works in portrait and landscape
- [ ] Audio cues play correctly
- [ ] Can run in background

### Journal
- [ ] Keyboard doesn't cover input
- [ ] Voice-to-text integration works
- [ ] Auto-save prevents data loss
- [ ] Rich text editor touch-friendly
- [ ] Image attachments work

## 8. Accessibility

### Screen Readers
- [ ] VoiceOver (iOS) navigation works
- [ ] TalkBack (Android) navigation works
- [ ] All buttons have labels
- [ ] Images have alt text
- [ ] Focus order logical
- [ ] Announcements for state changes

### Visual Accessibility
- [ ] Text scalable to 200%
- [ ] Color contrast WCAG AA compliant
- [ ] Focus indicators visible
- [ ] Dark mode works (if implemented)
- [ ] Reduce motion respects preference

### Motor Accessibility
- [ ] Touch targets 44px minimum
- [ ] Swipe alternatives for all gestures
- [ ] No time-limited interactions
- [ ] Tap alternatives for long press
- [ ] One-handed operation possible

## 9. Push Notifications

### Permission Flow
- [ ] Permission prompt at appropriate time
- [ ] Explanation provided before prompt
- [ ] Settings page to manage preferences
- [ ] Opt-out respected immediately

### Notification Types
- [ ] Medication reminders arrive on time
- [ ] Wellness check-ins work
- [ ] Crisis check-in after emergency use
- [ ] Appointment reminders accurate
- [ ] Community notifications (if enabled)

### Notification Actions
- [ ] Quick actions work from notification
- [ ] Tap opens correct app section
- [ ] Snooze functionality works
- [ ] Badge count updates correctly

## 10. Device Integration

### Native Features
- [ ] Camera works for mood selfies
- [ ] Contacts integration for emergency contacts
- [ ] Calendar sync for appointments
- [ ] Location services for resources
- [ ] Share functionality works

### Platform-Specific
- [ ] iOS Safe Area handling
- [ ] Android back button behavior
- [ ] iOS swipe-back gesture
- [ ] Android app shortcuts
- [ ] Widget support (if applicable)

## 11. Security & Privacy

### Data Protection
- [ ] Biometric authentication works
- [ ] Session timeout appropriate
- [ ] Secure storage for sensitive data
- [ ] Privacy mode for sensitive screens
- [ ] Clear data option works

### Network Security
- [ ] HTTPS enforced everywhere
- [ ] Certificate pinning (if implemented)
- [ ] API authentication tokens secure
- [ ] No sensitive data in URLs

## 12. Error Handling

### Network Errors
- [ ] Offline message clear and helpful
- [ ] Retry mechanisms work
- [ ] Timeout handling appropriate
- [ ] Partial content loads gracefully

### App Errors
- [ ] Error boundaries prevent crashes
- [ ] User-friendly error messages
- [ ] Report issue functionality
- [ ] Recovery without data loss

## 13. Edge Cases

### Interruption Handling
- [ ] Phone calls don't lose data
- [ ] App switching preserves state
- [ ] Low battery warning shown
- [ ] Storage full handling
- [ ] Multiple tabs handled correctly

### Unusual Scenarios
- [ ] Works in airplane mode
- [ ] Handles time zone changes
- [ ] Works with VPN
- [ ] Handles device rotation mid-action
- [ ] Background app refresh works

## 14. Performance Metrics

### Target Metrics
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.0s
- [ ] Lighthouse Performance Score > 90
- [ ] Lighthouse PWA Score = 100
- [ ] Lighthouse Accessibility Score > 95

### Real User Monitoring
- [ ] Page load times tracked
- [ ] Error rates monitored
- [ ] API response times logged
- [ ] User engagement metrics captured
- [ ] Crash reports collected

## 15. Final Checklist

### Critical Path Testing
- [ ] New user can access crisis resources immediately
- [ ] Existing user can check in within 10 seconds
- [ ] Emergency features work 100% offline
- [ ] PWA installs successfully
- [ ] No data loss scenarios identified

### Sign-off Criteria
- [ ] All critical crisis features tested
- [ ] Offline functionality verified
- [ ] Performance targets met
- [ ] Accessibility standards met
- [ ] Security review completed

## Testing Notes Template

```
Device: [Model, OS Version]
Network: [WiFi/4G/3G/Offline]
Test Date: [Date]
Tester: [Name]

Issues Found:
1. [Issue description, severity, steps to reproduce]

Performance Observations:
- Load time: 
- Battery impact: 
- Memory usage: 

User Experience Notes:
- 
```

## Automated Testing

Consider implementing:
- Lighthouse CI for performance regression
- Puppeteer tests for critical paths
- Jest tests for offline functionality
- Cypress tests for E2E mobile flows
- BrowserStack for device coverage

## Contact for Issues

Report critical issues immediately to:
- Development Team: [Contact]
- Crisis Feature Owner: [Contact]
- Security Team: [Contact]

---

Remember: The crisis features are life-critical. Test thoroughly and report any issues immediately.