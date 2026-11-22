# IESTUDY-PRO
Created with CodeSandbox


## Android app (offline + Firebase)

1. `npm install --legacy-peer-deps`
2. Create a Firebase project: enable **Authentication > Email/Password** and **Firestore**, deploy `firestore.rules`.
3. `cp .env.example .env` and fill in the web app keys.
4. `npm run android:sync` (builds the web app and copies it into `android/`).
5. `npm run android:open`, then build/run in Android Studio (or `cd android && ./gradlew assembleDebug`).

The app bundles all assets, so the timer and calculators work with no connection. Signed-in users get saved studies stored in Firestore's on-device cache, synced when online.
