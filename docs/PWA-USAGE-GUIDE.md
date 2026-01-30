# TheoShift PWA - User Guide

**Progressive Web App Features**

TheoShift can now be installed as a Progressive Web App (PWA) on your mobile device, giving you an app-like experience without downloading from an app store.

---

## 📱 Installing TheoShift as an App

### **On iPhone (iOS Safari)**

1. **Open Safari** and visit https://theoshift.com
2. **Tap the Share button** (square with arrow pointing up) at the bottom
3. **Scroll down** and tap **"Add to Home Screen"**
4. **Edit the name** if desired (default: "TheoShift")
5. **Tap "Add"** in the top right

**Result:** TheoShift icon appears on your home screen like a native app!

### **On Android (Chrome)**

1. **Open Chrome** and visit https://theoshift.com
2. **Tap the menu** (three dots) in the top right
3. **Tap "Install app"** or **"Add to Home Screen"**
4. **Confirm** by tapping "Install"

**Alternative:** Look for the install banner at the bottom of the screen and tap "Install"

**Result:** TheoShift appears in your app drawer and home screen!

---

## ✨ PWA Features

### **1. App-Like Experience**
- ✅ Full-screen mode (no browser chrome)
- ✅ Runs in its own window
- ✅ Appears in app switcher
- ✅ Native-like navigation

### **2. Offline Access**
- ✅ View cached pages without internet
- ✅ Offline fallback page when disconnected
- ✅ Automatic sync when back online

### **3. Fast Loading**
- ✅ Instant startup
- ✅ Cached resources load immediately
- ✅ Background updates

### **4. Home Screen Icon**
- ✅ Quick access from home screen
- ✅ No need to open browser first
- ✅ Professional app icon

### **5. App Shortcuts** (Long-press icon)
- 📅 Events - Jump directly to event selection
- 👥 Volunteers - Go straight to volunteer management

---

## 🔧 How It Works

### **Service Worker**
TheoShift uses a service worker to:
- Cache static assets (CSS, JS, images)
- Enable offline functionality
- Speed up page loads
- Sync data in the background

### **Caching Strategy**
- **Static files:** Cached on first visit
- **API calls:** Network-first (fresh data when online)
- **Offline:** Serves cached content when disconnected

---

## 📖 Using TheoShift Offline

### **What Works Offline:**
- ✅ View previously loaded pages
- ✅ Browse cached event data
- ✅ View volunteer information
- ✅ Access help documentation

### **What Requires Internet:**
- ❌ Creating new events
- ❌ Making assignments
- ❌ Updating data
- ❌ Logging in (first time)

### **Testing Offline Mode:**

1. **Install the app** on your device
2. **Open TheoShift** and browse a few pages
3. **Turn on Airplane Mode** or disable WiFi
4. **Open the app again**
5. **You'll see cached content** or the offline page

---

## 🎯 Best Practices

### **For Event Coordinators:**

**Before an Event:**
1. Install TheoShift as PWA
2. Open all pages you'll need (events, positions, volunteers)
3. This caches the data for offline access

**During an Event:**
- Use the installed app for quick access
- Data loads faster from cache
- Works even with spotty WiFi

**After an Event:**
- App automatically updates when online
- No manual updates needed

### **For Volunteers:**

**Setup:**
1. Install TheoShift PWA
2. Log in once while online
3. Browse your assignments

**Usage:**
- Quick access from home screen
- View your schedule offline
- Check event details anytime

---

## 🔄 Updating the App

### **Automatic Updates**
- TheoShift checks for updates automatically
- New version downloads in background
- Refresh the page to use latest version

### **Manual Update**
1. Close all TheoShift tabs/windows
2. Reopen the app
3. Latest version loads automatically

### **Force Refresh**
- **iOS Safari:** Pull down to refresh
- **Android Chrome:** Pull down to refresh
- **Desktop:** Ctrl+Shift+R (Cmd+Shift+R on Mac)

---

## 🗑️ Uninstalling the PWA

### **On iPhone:**
1. **Long-press** the TheoShift icon
2. **Tap "Remove App"**
3. **Confirm** deletion

### **On Android:**
1. **Long-press** the TheoShift icon
2. **Tap "Uninstall"** or drag to "Remove"
3. **Confirm** deletion

**Note:** This only removes the installed app. You can still access TheoShift through your browser.

---

## 🐛 Troubleshooting

### **"Add to Home Screen" not showing (iOS)**
- Make sure you're using **Safari** (not Chrome)
- Visit the site first, then look for the share button
- Ensure you're on the main domain (theoshift.com)

### **Install prompt not appearing (Android)**
- Clear browser cache and revisit the site
- Make sure you're using **Chrome**
- Check that you're on HTTPS (secure connection)

### **App not working offline**
- Visit pages while online first (to cache them)
- Check that service worker is registered (see console)
- Try reinstalling the app

### **Old version showing**
- Close all TheoShift tabs
- Reopen the app
- Pull to refresh

### **App icon looks wrong**
- Uninstall and reinstall the app
- Clear browser cache before reinstalling

---

## 📊 PWA vs Native App

### **PWA Advantages:**
- ✅ No app store download
- ✅ Instant updates (no approval delays)
- ✅ Works on all devices (iOS, Android, desktop)
- ✅ Smaller size (no installation package)
- ✅ Always latest version

### **PWA Limitations:**
- ⚠️ Limited push notifications on iOS
- ⚠️ Can't access all device features
- ⚠️ Requires initial internet connection

---

## 🎓 Tips & Tricks

### **Quick Access**
- Add TheoShift to your dock/home screen first row
- Use app shortcuts for common tasks
- Enable notifications (if available)

### **Performance**
- Let pages load fully before going offline
- Clear cache if app feels slow
- Reinstall if issues persist

### **Data Usage**
- PWA uses less data (cached resources)
- Only new content downloads
- Works great on limited data plans

---

## 🚀 What's Next

**Coming Soon:**
- Push notifications for assignments
- Background sync for offline changes
- Enhanced offline capabilities
- More app shortcuts

---

## 📞 Support

**Having issues?**
- Check the troubleshooting section above
- Visit `/help` in the app
- Contact your system administrator

**Want to learn more?**
- Visit the help documentation
- Check release notes for new features
- Explore the mobile-optimized interface

---

**TheoShift PWA - Access your volunteer coordination platform anywhere, anytime!** 📱✨
