# Mobile Performance & UX Optimizations

This document summarizes all mobile-focused optimizations implemented in the project, how to test them, and recommendations for future improvements.

---

## 1. Touch Target Sizing
- **What:** All interactive elements (buttons, close icons, toggles) use a `.touch-target` class for a minimum 44x44px size.
- **Code Reference:** `app/globals.css`, various components (e.g., `traveler-counter.tsx`, `itinerary-view.tsx`, etc.)
- **How to Test:**
  - Use Chrome DevTools mobile emulation.
  - Tap all buttons and icons; ensure they are easy to interact with.

## 2. Swipe Gestures & Haptic Feedback
- **What:**
  - Swipe-to-delete for activities (`activity-selector.tsx`)
  - Swipe navigation between itinerary days (`itinerary-view.tsx`)
  - Haptic feedback (via `navigator.vibrate`) for key actions (add, error, navigation)
- **How to Test:**
  - On a mobile device or emulator, swipe left/right on activities and itinerary days.
  - Confirm vibration feedback on supported devices.

## 3. Offline Support
- **What:**
  - General-purpose service worker (`public/sw.js`) caches app shell, images, and static assets.
  - Offline action queue for itinerary save (`offline-action-queue.ts`, `trip-modification-form.tsx`)
  - Offline status banner (`layout.tsx`)
- **How to Test:**
  - Go offline and reload the app; core UI should load.
  - Try saving an itinerary offline; it should queue and sync when back online.

## 4. Image Optimization
- **What:**
  - All `<img>` tags replaced with `ResponsiveImage` component for responsive, lazy, and blur-up loading.
  - Service worker caches images for offline use.
- **How to Test:**
  - Inspect images for correct `srcset`, `sizes`, and lazy loading.
  - Go offline and verify images are still available.

## 5. Code Splitting & Lazy Loading
- **What:**
  - Heavy components (e.g., maps) loaded with `next/dynamic` and skeleton fallback.
- **How to Test:**
  - Navigate to map view; observe loading indicator and deferred JS loading.

## 6. Resource Hints & Static Asset Caching
- **What:**
  - `<link rel="preconnect">`, `<link rel="dns-prefetch">`, and `<link rel="prefetch">` in `layout.tsx`.
  - Cache-Control headers for static assets in `next.config.mjs`.
- **How to Test:**
  - Check network panel for early connections and long-lived cache headers.

## 7. Automated & Real User Performance Monitoring
- **What:**
  - Lighthouse CI (`lighthouserc.json`, `npm run lhci`)
  - Core Web Vitals logging (`use-web-vitals.tsx`)
- **How to Test:**
  - Run `npm run lhci` and review reports in `.lighthouseci/`.
  - Check console/logs for Web Vitals in production.

## Dark Mode Support

### Overview
- The app supports automatic dark mode based on the user's OS/browser preference using the `next-themes` library and Tailwind CSS dark mode classes.
- The default theme is set to `system`, so the UI will follow the user's system setting unless manually overridden (if a theme switcher is present).
- A `<meta name="color-scheme" content="light dark">` tag is included for improved browser support.

### How It Works
- The app is wrapped in a `ThemeProvider` (`components/theme-provider.tsx`) at the root level (`app/layout.tsx`).
- Tailwind's `darkMode: ["class"]` is used, and dark theme variables are defined in `app/globals.css` under the `.dark` selector.
- When the user's system is set to dark mode, the UI automatically switches to dark theme colors and styles.

### Code References
- `app/layout.tsx`: ThemeProvider setup and meta tag
- `components/theme-provider.tsx`: Theme context provider
- `app/globals.css`: CSS variables for light and dark themes
- `tailwind.config.ts`: Tailwind dark mode configuration

### Manual Testing Checklist
- [ ] Set your OS/browser to light mode. The app should display in light theme.
- [ ] Set your OS/browser to dark mode. The app should display in dark theme.
- [ ] Switch between light and dark mode while the app is open; the UI should update automatically.
- [ ] Verify that all major UI elements (backgrounds, text, cards, buttons, etc.) adapt to the correct theme.
- [ ] Check on both desktop and mobile browsers.
- [ ] (If a theme switcher is present) Test manual toggling and persistence.

### Automated Testing (Optional)
- Use Playwright or Cypress to simulate `prefers-color-scheme` and verify theme changes.

### Future Recommendations
- Add a user-facing theme switcher for manual override (optional).
- Ensure all custom components and third-party UI respect dark mode classes and variables.

## Reduced Motion Support

### Overview
- The app respects the user's system/browser `prefers-reduced-motion` setting.
- When enabled, all CSS transitions and animations are minimized or disabled for accessibility.

### How It Works
- A global CSS rule in `app/globals.css` uses `@media (prefers-reduced-motion: reduce)` to:
  - Set all animation and transition durations to near-zero
  - Limit animation iteration count to 1
  - Disable smooth scrolling
- This applies to all elements and pseudo-elements.

### Code References
- `app/globals.css`: Global reduced motion CSS

### Manual Testing Checklist
- [ ] Enable "Reduce Motion" in your OS or browser accessibility settings.
- [ ] Reload the app and verify that:
  - [ ] Page transitions, button hovers, and other UI animations are minimized or disabled
  - [ ] No distracting motion or auto-scrolling occurs
- [ ] Test on both desktop and mobile browsers.

### Automated Testing (Optional)
- Use Playwright or Cypress to simulate `prefers-reduced-motion` and verify that animations are disabled.

### Future Recommendations
- For JS-based animations (e.g., Framer Motion), check for reduced motion in code and skip/shorten animations accordingly.
- Ensure all third-party UI libraries respect reduced motion settings.

## User-Facing Theme Switcher

### Overview
- A floating theme switcher button is now available in the header (top right, desktop/tablet only by default).
- The button toggles between light and dark mode, showing a sun or moon icon depending on the current theme.
- Uses `next-themes` for theme management and updates the UI instantly.

### How It Works
- The button appears as a circular icon (sun/moon) in the header, styled to float above the header content.
- Clicking the button toggles the theme between light and dark.
- Accessible labels are provided for screen readers.

### Code References
- `components/header.tsx`: Theme switcher button implementation
- `components/theme-provider.tsx`: Theme context provider
- `components/ui/switch.tsx`: (Switch UI, not used directly but available for future toggle variants)

### Manual Testing Checklist
- [ ] Locate the floating theme switcher button in the header (desktop/tablet).
- [ ] Click the button to toggle between light and dark mode; the UI should update instantly.
- [ ] Verify the icon changes (sun for dark mode, moon for light mode).
- [ ] Check accessibility: the button should have an appropriate aria-label.
- [ ] Test on both desktop and mobile (if made visible on mobile).

### Future Recommendations
- Make the switcher visible on mobile (optional).
- Add a dropdown for system/default/manual theme selection if needed.

## Battery Status Adaptation

### Overview
- The app detects device battery status using the Battery Status API (if available).
- When battery is low (<20%) and not charging, or if power saving mode is detected, a prominent banner appears at the top of the app.
- While in power saving mode, all non-essential UI animations (e.g., framer-motion transitions, logo animations) are paused or minimized to conserve energy.

### How It Works
- `useBatteryStatus` React hook provides battery level, charging status, and power saving detection.
- `BatteryStatusBanner` component displays a warning and disables non-critical UI effects.
- All major animated components (logos, main content, sidebar, etc.) check for power saving and reduce animation duration to near-zero.

### Code References
- `hooks/use-battery-status.ts`: Battery status detection hook
- `components/BatteryStatusBanner.tsx`: Banner UI
- All major animated components (e.g., `logo.tsx`, `main-content.tsx`, etc.)

### Manual Testing Checklist
- [ ] Simulate low battery or enable power saving mode on your device.
- [ ] Reload the app and verify:
  - [ ] A yellow "Battery Saver" banner appears at the top.
  - [ ] All animated UI elements (logos, transitions, etc.) are paused or move instantly.
  - [ ] Banner disappears when battery is sufficient or charging resumes.

### Best Practices
- Avoid non-essential animations when battery is low.
- Inform users when features are limited to conserve power.
- Always allow critical functionality regardless of battery state.

## Geolocation Adaptation

### Overview
- The app detects and requests the user's location using the Geolocation and Permissions APIs.
- A banner appears at the top of the app to prompt for location access, warn if denied, or confirm if enabled.
- When location is enabled, the app can show the user's city (reverse geocoded) and provide personalized suggestions.

### How It Works
- `useGeolocation` React hook manages permission state, errors, and coordinates.
- `GeolocationBanner` component displays a prompt, warning, or confirmation banner based on permission and location state.
- If permission is 'prompt', a button allows the user to enable location.
- If permission is 'denied', a warning is shown with instructions.
- If permission is 'granted', the user's city or coordinates are shown.

### Code References
- `hooks/use-geolocation.ts`: Geolocation detection hook
- `components/GeolocationBanner.tsx`: Banner UI
- `app/layout.tsx`: Banner integration

### Manual Testing Checklist
- [ ] Load the app and verify a yellow banner prompts for location (if not yet granted/denied).
- [ ] Click "Enable Location" and allow access; the banner should confirm your city or coordinates.
- [ ] Deny location access; a red warning banner should appear.
- [ ] Re-enable location in browser settings and reload; confirmation banner should return.
- [ ] Test on both desktop and mobile browsers.

### Best Practices
- Always ask for location permission in a user-friendly way.
- Clearly explain why location is needed and how it will be used.
- Respect user privacy and never require location for core functionality.

---

## Manual Testing Checklist
- [ ] All buttons and icons are easy to tap on mobile
- [ ] Swipe gestures work for navigation and delete
- [ ] Haptic feedback triggers on key actions
- [ ] App loads and works offline (core features)
- [ ] Images are responsive, lazy-loaded, and cached
- [ ] Map and other heavy components load only when needed
- [ ] Resource hints and cache headers are present
- [ ] Lighthouse CI scores are 90+ for performance, accessibility, best practices, SEO

---

## Recommendations for Future Improvements
- Integrate advanced RUM (e.g., Google Analytics, Sentry Performance)
- Explore Workbox for more granular service worker strategies
- Add background sync for queued actions
- Monitor bundle size regularly with `@next/bundle-analyzer`
- Periodically review Lighthouse and Web Vitals scores

---

**For questions or improvements, see code comments and this file.** 