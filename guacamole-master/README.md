Guacamole
---------

A Trip Assistant app for PAAC.

### Project Architecture

The project is based on React Native and most code is written in JavaScript.

We have only implemented and tested the Android part though. iOS won't work for
now.

Please refer to the React Native documentation for more details.

### Compile and Build

To build the app for Android requires signing, which needs a keystore.

Please follow [the instructions from React Native](https://facebook.github.io/react-native/docs/signed-apk-android.html) to generate a signing key first.

Once you have the keystore, please run the following commands:

```bash
cd ./android
./gradlew assembleRelease
```

The production APK can be found at `app/build/outputs/apk/app-release.apk`.

IMPORTANT: These commands won't work without a keystore.

### Development

To develop the Android app, please use the following command:

```bash
react-native run-android
```

This will run the app in an Android Emulator or a connected Android device with
`adb` enabled. Please see the instructions for Android Emulators or adb.

### Project Structure

This project is component-based and most components can be found in
`src/components`. Please see the README there for documentation about components.
Other utilities and modules are also included.

`my_location.js` contains positioning utilities for locating the users position
on the mobile platform.

`maps_api.js` contains the code that adapts to Google Maps API.

`paac_api.js` contains the code for PAAC TrueTime API.

The app first fetches directions from Google Maps API and then uses the
`true_time_routes.js` file to identify the routes and construct requests to the
PAAC APIs. If TrueTime information is available, the route estimations are
updated according to prediction information and service changes.

Please refer to the Design Document for more details about API usage.
