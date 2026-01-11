# 📋 Implementation Plan: Flashcard Mode & Daily Notifications for PWA

## 🎯 Feature Overview

**Flashcard Mode**

- Dedicated route at `/flashcards` showing bookmarks one at a time
- Clean, focused interface
- Swipe gestures for mobile (left = skip, right = also skip)
- Random bookmark selection
- Unlimited review sessions
- **No tracking** (no Notion database modifications)

**Daily Notifications**

- Desktop notification system with custom schedule
- Preview bookmark name/URL in notification
- PWA support for mobile usage
- Service worker for background notifications

---

## 📁 File Structure & New Components

```
zenchi-keep/
├── app/
│   ├── flashcards/
│   │   └── page.tsx                    # Flashcard review page
│   ├── api/
│   │   ├── flashcards/
│   │   │   └── random/
│   │   │       └── route.ts           # API for random bookmark
│   │   └── settings/
│   │       └── notifications/
│   │           └── route.ts            # API for saving notification prefs
│   └── layout.tsx                      # Add PWA meta tags
├── components/
│   ├── Flashcard/
│   │   ├── Flashcard.tsx               # Main flashcard component
│   │   ├── FlashcardControls.tsx       # Control buttons
│   │   └── SwipeHandler.tsx            # Mobile swipe gesture logic
│   └── Settings/
│       └── NotificationSettings.tsx   # UI for setting notification times
├── lib/
│   ├── hooks/
│   │   ├── useFlashcards.ts            # Flashcard logic & state
│   │   └── useNotifications.ts         # Notification permission & scheduling
│   ├── utils/
│   │   └── storage.ts                  # localStorage/IndexedDB helpers
│   └── pwa/
│       ├── service-worker.ts           # Service worker for PWA
│       └── manifest.json               # PWA manifest
├── public/
│   ├── icons/
│   │   ├── icon-192x192.png            # PWA icons
│   │   └── icon-512x512.png
│   └── sw.js                           # Service worker entry
├── manifest.json                       # PWA manifest (root level)
└── next.config.ts                      # Update for next-pwa
```

---

## 🛠️ Implementation Phases

### **Phase 1: PWA Foundation** (Day 1-2)

#### 1.1 Install Dependencies

```bash
npm install next-pwa react-swipeable
npm install -D @types/react-swipeable
```

#### 1.2 PWA Configuration

**Create `manifest.json`:**

- App name: "Zenchi Keep"
- Theme color: Match pastel theme (sky-100)
- Display mode: `standalone` for PWA
- Icons: 192x192 and 512x512
- Start URL: `/`

**Update `next.config.ts`:**

```typescript
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
  },
};

export default withPWA(nextConfig);
```

**Update `app/layout.tsx`:**

- Add PWA meta tags (theme-color, apple-touch-icon, viewport)
- Add manifest link

#### 1.3 Service Worker Setup

- Create basic service worker for offline caching
- Register service worker in root layout
- Add update handling for PWA

---

### **Phase 2: Flashcard Mode - Core Functionality** (Day 2-3)

#### 2.1 Data Layer

**Create `lib/utils/storage.ts`:**

```typescript
// localStorage helpers for client-side tracking
interface ReviewState {
  reviewedIds: string[]; // IDs of reviewed bookmarks this session
  skippedIds: string[]; // IDs of skipped bookmarks
  lastReviewDate: string; // Date of last review session
  sessionStats: {
    reviewed: number;
    skipped: number;
  };
}

export const storage = {
  // Get/set review state from localStorage
  // Session management
  // Clear session data
};
```

**Update `lib/notion.ts`:**

- Add function `getRandomBookmarks(count: number)`
- No new database properties needed (user wants client-side only)

#### 2.2 API Routes

**Create `app/api/flashcards/random/route.ts`:**

```typescript
// GET - Return random bookmark for flashcard
// Accepts optional excludeIds parameter to avoid repeats
// Returns single bookmark in format: { bookmark, remainingCount }
```

#### 2.3 Hooks

**Create `lib/hooks/useFlashcards.ts`:**

```typescript
// State management:
// - currentBookmark
// - reviewedCount
// - skippedCount
// - loading
// - error

// Functions:
// - fetchRandomBookmark()
// - markAsReviewed()
// - skipBookmark()
// - resetSession()
// - endSession()

// Client-side tracking (localStorage)
```

---

### **Phase 3: Flashcard Mode - UI Components** (Day 3-4)

#### 3.1 Flashcard Component

**Create `components/Flashcard/Flashcard.tsx`:**

```typescript
interface FlashcardProps {
  bookmark: Bookmark;
  onReviewed: () => void;
  onSkip: () => void;
}

// Clean, focused card design:
// - Large bookmark name
// - URL displayed clearly
// - Type/Status badges
// - Favicon
// - "Visit Link" button (opens in new tab)
// - Animated transitions between cards
```

**Design Considerations:**

- Minimal distractions (no header, no search)
- Full-height card centered on screen
- Smooth animations for card transitions
- Touch-friendly large buttons for mobile
- Progress indicator (X reviewed / X skipped)

#### 3.2 Swipe Handler

**Create `components/Flashcard/SwipeHandler.tsx`:**

```typescript
// Use react-swipeable for mobile gestures
// Left swipe: Skip bookmark
// Right swipe: Mark as reviewed
// Visual feedback during swipe (card moves with finger)
```

#### 3.3 Flashcard Controls

**Create `components/Flashcard/FlashcardControls.tsx`:**

```typescript
// Desktop buttons:
// - Skip (left side)
// - Mark as Reviewed (right side)
// - End Session (top/bottom)
// - Open in new tab (icon button)
```

#### 3.4 Flashcard Page

**Create `app/flashcards/page.tsx`:**

```typescript
"use client";

// Uses useFlashcards hook
// Renders Flashcard with SwipeHandler
// Shows session stats
// Handle loading/error states
// Clean, immersive full-screen layout
```

---

### **Phase 4: Daily Notifications** (Day 4-5)

#### 4.1 Data Layer

**Update `lib/utils/storage.ts`:**

```typescript
interface NotificationSettings {
  enabled: boolean;
  schedule: string[]; // Array of time strings: ["09:00", "14:00", "20:00"]
  lastNotificationDate: string; // Track when last notification was sent
}

export const storage = {
  // Get/set notification settings
  // Check if notification due today
};
```

#### 4.2 API Routes

**Create `app/api/settings/notifications/route.ts`:**

```typescript
// GET - Retrieve user's notification settings
// POST - Save notification settings
// Auth: Basic API key validation
```

**Create `app/api/notifications/schedule/route.ts`:**

```typescript
// Internal route called by service worker
// Returns next scheduled notification time and bookmark
```

#### 4.3 Hooks

**Create `lib/hooks/useNotifications.ts`:**

```typescript
// Request notification permission
// Schedule notifications
// Cancel notifications
// Check permission status
```

#### 4.4 Notification Settings UI

**Create `components/Settings/NotificationSettings.tsx`:**

```typescript
// Time picker(s) for custom schedule
// Toggle notifications on/off
// Preview notification button
// Save settings
```

#### 4.5 Service Worker Enhancement

**Update `public/sw.js`:**

```typescript
// Background sync for notifications
// Handle notification clicks
// Fetch random bookmark when notification triggers
// Schedule next notification
```

---

### **Phase 5: Integration & Polish** (Day 5-6)

#### 5.1 Navigation

**Update `app/page.tsx`:**

- Add "Flashcards" button in header
- Add "Settings" button in header
- Link to `/flashcards`

**Create `app/settings/page.tsx`:**

- Settings page with notification preferences
- Clean, accessible UI

#### 5.2 Notification Logic

**Notification Flow:**

1. User sets custom schedule (e.g., 9:00, 14:00, 20:00)
2. Service worker checks every minute for scheduled times
3. When time matches:
   - Fetch random bookmark from API
   - Show notification: `[bookmark name] - Ready to review?`
4. User taps notification → Opens `/flashcards` with that bookmark
5. Flashcard mode starts with that bookmark loaded

#### 5.3 Error Handling & Edge Cases

- No bookmarks in database
- No notification permission granted
- Offline mode (fetch from cache)
- Multiple notification times per day
- Service worker update handling

#### 5.4 Accessibility & Polish

- Keyboard navigation for flashcards
- Screen reader support
- High contrast mode support
- Smooth animations
- Loading states
- Error states with retry

---

## 🎨 UI Design Guidelines

### Flashcard Mode

- **Color Scheme**: Continue pastel theme (sky-100, slate-800)
- **Typography**: Large, readable fonts
- **Card Design**:
  - Minimum height: 60% of viewport on mobile
  - Rounded corners (rounded-2xl)
  - Subtle shadow
  - Background: white with glassmorphism effect
- **Swipe Feedback**:
  - Visual indicator showing swipe direction
  - Color change during swipe (red = skip, green = reviewed)
  - Haptic feedback (vibration) on mobile

### Notifications

- **Icon**: Use app icon (zenchi sparkle)
- **Title**: "Zenchi Keep - Review Time!"
- **Body**: "[Bookmark Name] - Ready to review?"
- **Action**: "Open App" button
- **Sound**: Default notification sound

---

## 🔧 Technical Considerations

### State Management

- Use React hooks (useState, useEffect, useCallback)
- localStorage for persistence
- No global state management needed (keep it simple)

### PWA Specifics

- Service worker for offline caching
- Background sync API for notifications
- Push notification API
- Manifest for installability

### Mobile Considerations

- Touch targets: Minimum 44x44px
- Swipe gestures: react-swipeable
- Viewport meta tag: user-scalable=no
- Safe area insets for notched devices

### Performance

- Cache bookmarks in IndexedDB for offline access
- Lazy load flashcard components
- Use React.memo for optimization
- Debounce API calls

---

## ✅ Testing Checklist

### Flashcard Mode

- [ ] Load random bookmark on page load
- [ ] Mark as reviewed updates localStorage
- [ ] Skip updates localStorage
- [ ] Swipe gestures work on mobile
- [ ] Buttons work on desktop
- [ ] "Visit Link" opens bookmark in new tab
- [ ] Session stats display correctly
- [ ] Reset session clears localStorage

### Notifications

- [ ] Request notification permission
- [ ] Save custom notification times
- [ ] Notification appears at scheduled time
- [ ] Notification shows bookmark preview
- [ ] Tapping notification opens flashcard mode
- [ ] Multiple notification times work
- [ ] Disabling notifications works

### PWA

- [ ] App installs on home screen
- [ ] Works offline (cached bookmarks)
- [ ] Service worker updates correctly
- [ ] App launches in standalone mode

---

## 📦 Dependencies to Add

```json
{
  "dependencies": {
    "next-pwa": "^5.6.0",
    "react-swipeable": "^7.0.1",
    "workbox-window": "^7.0.0"
  },
  "devDependencies": {
    "@types/react-swipeable": "^5.2.0"
  }
}
```

---

## 🚀 Deployment Notes

### Vercel Deployment

- Environment variables remain the same
- PWA assets will be automatically deployed
- No special configuration needed

### Notion Database

- **No changes required** (client-side tracking only)
- Current properties are sufficient

---

## 💡 Future Enhancements (Optional)

1. **Quick Add Settings Button**: Add floating action button on flashcard page
2. **Notification History**: Track which bookmarks were notified
3. **Review Streak**: Track consecutive days of reviewing
4. **Sound Effects**: Add subtle sounds for swipe actions
5. **Themes**: Dark mode support
6. **Bulk Review**: Select multiple bookmarks to review

---

## 📝 Summary

This plan implements:

- ✅ Flashcard mode at `/flashcards` with clean UI
- ✅ Random bookmark selection
- ✅ Mobile swipe gestures
- ✅ Client-side tracking only (no Notion updates)
- ✅ Unlimited review sessions
- ✅ Custom notification schedule
- ✅ Bookmark preview in notifications
- ✅ PWA support for mobile usage
- ✅ Service worker for background notifications

Estimated timeline: **5-6 days** for full implementation
