# Navigation Test Checklist - Crisis-First Mental Health Platform

## 🚨 **IMMEDIATE CRISIS ACCESS TESTS**
- [ ] Crisis banner visible on every page (always at top)
- [ ] Crisis banner has working 988 call button
- [ ] Crisis banner has working crisis chat button
- [ ] Crisis banner accessible via keyboard navigation
- [ ] Crisis banner has proper ARIA labels

## 🏠 **HOME PAGE TESTS**
- [ ] HomePage loads at root URL (/)
- [ ] Welcome message displays correctly
- [ ] Four main action cards are visible and clickable
- [ ] Wellness Tools card navigates to /wellness
- [ ] Community Support card navigates to /community
- [ ] Find Professionals card navigates to /professional
- [ ] Crisis Support card navigates to /crisis
- [ ] All cards have proper hover states and accessibility

## 🧘 **WELLNESS PAGE TESTS**
- [ ] Wellness page loads WellnessToolsSuite by default
- [ ] All wellness tools are accessible
- [ ] Navigation sidebar works properly
- [ ] Breathing exercises, meditation, and journal tools function
- [ ] Can navigate back to main site

## 💬 **COMMUNITY PAGE TESTS**
- [ ] Community page loads without breaking
- [ ] Support groups section is accessible
- [ ] Community posts display properly
- [ ] No WebSocket errors in console
- [ ] Community guidelines are visible
- [ ] Quick actions work correctly

## 👨‍⚕️ **PROFESSIONAL PAGE TESTS**
- [ ] Professional page displays free resources
- [ ] Search functionality works
- [ ] Resource categories filter properly
- [ ] Emergency resources are highlighted
- [ ] All external links work and open in new tabs
- [ ] Contact information is properly formatted

## 🆘 **CRISIS PAGE TESTS**
- [ ] Crisis page loads immediately (not lazy loaded)
- [ ] Crisis assessment functionality works
- [ ] Emergency hotline buttons function correctly
- [ ] 988 button calls the correct number
- [ ] Crisis text line button works
- [ ] Emergency contacts are displayed
- [ ] Safety plan tools are accessible

## ⚙️ **SETTINGS PAGE TESTS**
- [ ] Settings page loads correctly
- [ ] Settings categories are navigable
- [ ] Dark mode toggle works
- [ ] Privacy settings are functional
- [ ] Language selection works
- [ ] Settings match wellness suite design

## 🎯 **SIDEBAR NAVIGATION TESTS**
- [ ] Sidebar collapses and expands properly
- [ ] All 5 main navigation items are present:
  - 🏠 Home
  - 🧘 Wellness Tools
  - 💬 Community Support
  - 👨‍⚕️ Find Professionals
  - ⚙️ My Settings
- [ ] Active page is highlighted correctly
- [ ] Emoji visual anchors are visible
- [ ] Quick wellness tools section expands
- [ ] User menu is accessible at bottom

## 📱 **MOBILE RESPONSIVENESS TESTS**
- [ ] Crisis banner works on mobile
- [ ] Sidebar navigation collapses properly on mobile
- [ ] Touch targets are minimum 44px
- [ ] All pages are mobile-friendly
- [ ] Emergency buttons are easily tappable
- [ ] Text is readable on small screens

## ♿ **ACCESSIBILITY TESTS**
- [ ] Skip links work (Skip to main content, Skip to navigation, Skip to crisis help)
- [ ] All buttons have proper ARIA labels
- [ ] Focus management works correctly
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader compatibility
- [ ] Keyboard-only navigation works
- [ ] Crisis features have highest accessibility priority

## 🔄 **USER FLOW TESTS**
- [ ] **Crisis Flow**: Any page → Crisis banner → Help (0 clicks)
- [ ] **Wellness Flow**: Home → Wellness Tools → Tool selection (1-2 clicks)
- [ ] **Community Flow**: Home → Community → Support groups (1-2 clicks)
- [ ] **Professional Flow**: Home → Professionals → Resource search (1-2 clicks)
- [ ] **Settings Flow**: Sidebar → Settings → Category (2 clicks)

## 🔍 **PERFORMANCE TESTS**
- [ ] Initial page load < 3 seconds
- [ ] Crisis page loads immediately (no lazy loading delay)
- [ ] No console errors
- [ ] No broken links
- [ ] Images load properly
- [ ] Animations are smooth and not overwhelming

## 🌟 **CRISIS-FIRST DESIGN VALIDATION**
- [ ] Help is accessible in 3 seconds or less from any page
- [ ] Maximum 5 choices visible at any navigation level
- [ ] Visual design promotes calm and safety
- [ ] Emergency features are visually prominent
- [ ] User never feels lost or confused
- [ ] Every page maintains crisis access priority

## 📊 **Success Metrics**
- **Crisis Access**: ✅ Help reachable in < 3 seconds on any page
- **Navigation**: ✅ Users can find any feature in < 2 clicks  
- **Cognitive Load**: ✅ No more than 5 choices visible at once
- **Emotional Safety**: ✅ Calming, trustworthy visual atmosphere
- **Accessibility**: ✅ WCAG AAA compliance for crisis features

---

## 🎯 **TESTING NOTES**

**Development Server**: http://localhost:5179

**Test Environment**: 
- Chrome (desktop & mobile view)
- Firefox 
- Safari (if available)
- Screen reader testing
- Keyboard-only navigation

**Priority Order for Testing**:
1. Crisis access functionality (CRITICAL)
2. Main navigation flow (HIGH)
3. Page loading and accessibility (HIGH)  
4. Mobile responsiveness (MEDIUM)
5. Advanced features and polish (LOW)

---

**Remember**: In mental health, good design literally saves lives. Every design decision should prioritize safety, clarity, and immediate access to help. 🌟