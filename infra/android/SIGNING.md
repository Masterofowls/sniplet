# Apply after `tauri android init` regenerates gen/android

## 1. Copy keystore config

```powershell
Copy-Item infra\android\keystore.properties.example src-tauri\gen\android\keystore.properties
# Edit src-tauri\gen\android\keystore.properties with real passwords
```

## 2. Add to `src-tauri/gen/android/app/build.gradle.kts`

Import:
```kotlin
import java.io.FileInputStream
```

Before `buildTypes`:
```kotlin
signingConfigs {
    create("release") {
        val keystorePropertiesFile = rootProject.file("keystore.properties")
        val keystoreProperties = Properties()
        if (keystorePropertiesFile.exists()) {
            keystoreProperties.load(FileInputStream(keystorePropertiesFile))
        }
        keyAlias = keystoreProperties["keyAlias"] as String
        keyPassword = keystoreProperties["password"] as String
        storeFile = file(keystoreProperties["storeFile"] as String)
        storePassword = keystoreProperties["password"] as String
    }
}
```

In release `buildTypes`:
```kotlin
signingConfig = signingConfigs.getByName("release")
```
