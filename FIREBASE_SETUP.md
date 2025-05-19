# Firebase Setup for POS System

This document provides instructions on how to set up Firebase for your POS system.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name, e.g., "POS System"
4. Follow the setup wizard (you can disable Google Analytics if you don't need it)
5. Click "Create project"

## Step 2: Set Up Firebase Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Enable the "Email/Password" sign-in method
4. Optionally, you can also enable other sign-in methods like Google, Facebook, etc.

## Step 3: Set Up Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Start in production mode (or test mode if you're just testing)
4. Choose a location closest to your users
5. Click "Enable"

## Step 4: Set Up Firebase Storage

1. In your Firebase project, go to "Storage" in the left sidebar
2. Click "Get started"
3. Accept the default security rules (you can modify them later)
4. Choose a location closest to your users
5. Click "Done"

## Step 5: Get Your Firebase Configuration

1. In your Firebase project, click on the gear icon next to "Project Overview" and select "Project settings"
2. Scroll down to the "Your apps" section
3. If you haven't added an app yet, click on the web icon (`</>`)
4. Register your app with a nickname (e.g., "POS Web App")
5. Copy the Firebase configuration object

## Step 6: Update Your Firebase Configuration in the App

1. Open the file `src/firebase/config.ts` in your project
2. Replace the placeholder values with your actual Firebase configuration values:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 7: Set Up Firestore Security Rules

In the Firebase console, go to Firestore Database > Rules and set up appropriate security rules. Here's a basic example:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write all documents
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 8: Set Up Storage Security Rules

In the Firebase console, go to Storage > Rules and set up appropriate security rules. Here's a basic example:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 9: Deploy Your App

Now that you've set up Firebase, you can deploy your app to Firebase Hosting:

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize your project: `firebase init`
4. Select Hosting and follow the prompts
5. Build your app: `npm run build`
6. Deploy your app: `firebase deploy`

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
