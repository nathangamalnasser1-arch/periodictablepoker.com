# Google Play Store Submission Guide

## ✅ Done

- **Release keystore** – Created and configured
- **Signed AAB** – Built at `android/app/build/outputs/bundle/release/app-release.aab`
- **Privacy policy** – Live at **https://periodictablepoker.web.app/privacy.html**

## Steps to Publish

### 1. Deploy Privacy Policy
Ensure `privacy.html` is live at:
**https://periodictablepoker.com/privacy.html**

(Or use your Firebase/GitHub Pages URL.)

### 2. Create Play Console Account
- Go to [play.google.com/console](https://play.google.com/console)
- Pay the one-time $25 developer registration fee

### 3. Create the App
- Click **Create app**
- Fill in app name, default language, app or game, free/paid

### 4. Complete Store Listing
- **App name:** Periodic Table Poker
- **Short description** (80 chars): Texas Hold'em with 118 element cards. Learn science through play.
- **Full description** (4000 chars): Expand on the game, CHONP, hierarchy, etc.
- **App icon:** 512×512 PNG (use `game/public/pwa-512x512.png`)
- **Feature graphic:** 1024×500 PNG (screenshot or banner)
- **Screenshots:** Take 2–8 screenshots from the emulator (phone & 7" tablet)

### 5. Content Rating
- Complete the IARC questionnaire (Educational, No violence, etc.)

### 6. Data Safety
- Declare: No data collected (or minimal—see privacy policy)
- App does not collect personal info; optional GitHub submission is user-initiated

### 7. Upload the AAB
- **Release** → **Production** → **Create new release**
- Upload `android/app/build/outputs/bundle/release/app-release.aab`
- Add release notes
- Review and roll out

## Rebuilding the AAB

```bash
cd game
npm run build
npx cap sync android
cd android
gradlew.bat bundleRelease
```

The AAB will be at `android/app/build/outputs/bundle/release/app-release.aab`.

## ⚠️ Keep Secret

- `android/keystore.properties` – Contains keystore passwords
- `android/app/*.keystore` – Your signing key
- **Back up the keystore!** You cannot publish updates without it.
