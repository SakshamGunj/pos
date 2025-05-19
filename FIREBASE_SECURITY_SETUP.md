# Firebase Security Setup Guide

## Problem: Missing or Insufficient Permissions

You're seeing the following error:
```
Error fetching tables: FirebaseError: Missing or insufficient permissions.
```

This is because Firebase Firestore and Storage require security rules to be set up before you can read from or write to them.

## Solution: Deploy Security Rules

I've created two files with permissive security rules for development:
- `firestore.rules` - For Firestore database
- `storage.rules` - For Firebase Storage

### Option 1: Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** in your project directory:
   ```bash
   firebase init
   ```
   - Select Firestore and Storage
   - Select your project
   - Use existing rules files when prompted

4. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

### Option 2: Using Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com/

2. **Select your project**

3. **For Firestore Rules**:
   - Go to Firestore Database
   - Click on the "Rules" tab
   - Copy and paste the contents of `firestore.rules`
   - Click "Publish"

4. **For Storage Rules**:
   - Go to Storage
   - Click on the "Rules" tab
   - Copy and paste the contents of `storage.rules`
   - Click "Publish"

## Security Warning

The rules I've provided allow full read and write access to your database and storage. This is fine for development but **NOT RECOMMENDED FOR PRODUCTION**.

Before deploying to production, you should update your rules to be more restrictive. I've included commented examples of more secure rules in the files.

## Next Steps

After deploying these rules, restart your application and the permission errors should be resolved. You'll be able to:

1. Add and manage tables
2. Create and update menu items
3. Process orders
4. Upload images for menu items

If you're still experiencing issues after deploying the rules, make sure your Firebase configuration in `src/firebase/config.ts` is correct and that you're connecting to the right Firebase project.
