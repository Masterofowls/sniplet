# Android release signing

Generate a keystore (one-time):

```powershell
keytool -genkeypair -v -keystore infra/android/{{APP_SLUG}}-release.keystore -alias {{APP_SLUG}} -keyalg RSA -keysize 2048 -validity 10000
```

Copy the example properties file:

```powershell
copy android-overlay\keystore.properties.example src-tauri\gen\android\keystore.properties
```

Edit passwords in `src-tauri/gen/android/keystore.properties` after `npm run android:patch`.

**Never commit** `.keystore` or `keystore.properties`.
