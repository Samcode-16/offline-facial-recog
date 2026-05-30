# Datalake 3.0 Integration Guide

This document describes **exactly** how to integrate DatalakeFaceAuth into the Datalake 3.0 system when its source code becomes available.

**Key Principle:** The face auth system is designed as a **self-contained module**. Only **7 minimal changes** are required to integrate it. No other files need modification.

---

## Overview

The DatalakeFaceAuth module is currently a standalone React Native app. When Datalake 3.0 source code is available, these changes will integrate it:

1. Replace one adapter file to connect to Datalake 3.0's employee data
2. Merge navigation stacks
3. Copy native bridge modules
4. Copy model files
5. Merge npm dependencies
6. Merge configuration files
7. No other changes required

---

## Change 1: Replace EmployeeBridge.ts

### Current Location

`src/bridges/EmployeeBridge.ts` (DatalakeFaceAuth)

### Integration Steps

1. **Identify Datalake 3.0's employee data source:**
   - Check if it uses AsyncStorage
   - Check if it has its own SQLite database
   - Check if it uses Redux or MobX for state management
   - Ask the Datalake 3.0 team: "Where are employee records stored and how do I query them?"

2. **Replace EmployeeBridge implementation:**

**Example: If Datalake 3.0 uses Redux**

```typescript
// OLD: src/bridges/EmployeeBridge.ts (mock data)
const MOCK_EMPLOYEES: Employee[] = [ ... ];

// NEW: src/bridges/EmployeeBridge.ts (Redux integration)
import { useSelector } from 'react-redux';

export class EmployeeBridge {
  static async getById(employeeId: string): Promise<Employee | null> {
    // Connect to Datalake 3.0's Redux store
    const employees = store.getState().employees.data;
    return employees.find(e => e.id === employeeId) ?? null;
  }

  static async getAll(): Promise<Employee[]> {
    const employees = store.getState().employees.data;
    return employees.filter(e => e.isActive);
  }

  static async reportAttendance(record: {
    employeeId: string; timestamp: number; confidence: number;
  }): Promise<void> {
    // Dispatch attendance event to Datalake 3.0
    store.dispatch({
      type: 'ATTENDANCE_RECORDED',
      payload: record
    });
  }
}
```

**Example: If Datalake 3.0 uses AsyncStorage**

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

export class EmployeeBridge {
  static async getById(employeeId: string): Promise<Employee | null> {
    const employees = JSON.parse(
      (await AsyncStorage.getItem("datalake_employees")) ?? "[]",
    );
    return employees.find((e: Employee) => e.id === employeeId) ?? null;
  }

  static async getAll(): Promise<Employee[]> {
    const employees = JSON.parse(
      (await AsyncStorage.getItem("datalake_employees")) ?? "[]",
    );
    return employees.filter((e: Employee) => e.isActive);
  }

  static async reportAttendance(record: any): Promise<void> {
    const history = JSON.parse(
      (await AsyncStorage.getItem("attendance_history")) ?? "[]",
    );
    history.push({ ...record, recordedAt: Date.now() });
    await AsyncStorage.setItem("attendance_history", JSON.stringify(history));
  }
}
```

### Interface Guarantee

The interface **never changes**:

```typescript
export interface Employee {
  id: string;
  name: string;
  department: string;
  isActive: boolean;
}

export class EmployeeBridge {
  static async getById(employeeId: string): Promise<Employee | null>;
  static async getAll(): Promise<Employee[]>;
  static async reportAttendance(record: {
    employeeId: string;
    timestamp: number;
    confidence: number;
  }): Promise<void>;
}
```

All other code depends on this interface. If you maintain it, nothing else breaks.

---

## Change 2: Merge Navigation Stacks

### Current Location

- DatalakeFaceAuth: `src/navigation/AppNavigator.tsx`
- Datalake 3.0: `src/navigation/RootNavigator.tsx` (or similar)

### Integration Steps

1. **Import DatalakeFaceAuth screens into Datalake 3.0 navigator:**

```typescript
// In Datalake 3.0's RootNavigator.tsx

import HomeScreen from '../screens/DatalakeFaceAuth/HomeScreen';
import AuthenticationScreen from '../screens/DatalakeFaceAuth/AuthenticationScreen';
import EnrollmentScreen from '../screens/DatalakeFaceAuth/EnrollmentScreen';
import AttendanceListScreen from '../screens/DatalakeFaceAuth/AttendanceListScreen';
import SyncStatusScreen from '../screens/DatalakeFaceAuth/SyncStatusScreen';
import SettingsScreen from '../screens/DatalakeFaceAuth/SettingsScreen';

// Add to your stack or tab navigator
<Stack.Screen name="FaceAuthHome" component={HomeScreen} />
<Stack.Screen name="FaceAuthAuth" component={AuthenticationScreen} />
// ... etc
```

2. **Alternative: Keep AppNavigator, mount it as a nested stack:**

```typescript
// In Datalake 3.0's RootNavigator
import { AppNavigator } from './DatalakeFaceAuth/AppNavigator';

<Stack.Screen
  name="FaceAuthStack"
  component={AppNavigator}
  options={{ headerShown: false }}
/>
```

This keeps the face auth system completely encapsulated.

---

## Change 3: Copy Native Bridge Modules

### Source Files

- `android/app/src/main/java/com/datalakefaceauth/FaceRecognitionModule.java`
- `ios/DatalakeFaceAuth/FaceRecognitionModule.h`
- `ios/DatalakeFaceAuth/FaceRecognitionModule.m`

### Integration Steps

1. **Android:**
   - Copy `FaceRecognitionModule.java` to Datalake 3.0's Android project
   - Update package name if needed: `com.datalakefaceauth` → `com.datalake3`
   - Register in MainApplication.java:

   ```java
   import com.datalakefaceauth.FaceRecognitionModule;

   @Override
   protected List<ReactPackage> getPackages() {
     return Arrays.asList(
       new MainReactPackage(),
       new FaceRecognitionModule() // Add this
     );
   }
   ```

2. **iOS:**
   - Copy both `.h` and `.m` files to Datalake 3.0's iOS project
   - Xcode will auto-register via RCT_EXPORT_MODULE
   - Verify in Xcode: Build Phases → Link Binary With Libraries
     - TensorFlowLiteC should be present

---

## Change 4: Copy Model Files

### Source Location

`models/` directory in DatalakeFaceAuth

### Target Location

Datalake 3.0's `models/` or `assets/` directory

### Models to Copy

- `blazeface.tflite` (2.1 MB)
- `face_mesh.tflite` (1.9 MB)
- `mobilefacenet.tflite` (2.4 MB)
- `antispy_l.tflite` (1.0 MB)
- `antispy_h.tflite` (1.3 MB)

### Integration Steps

1. **Android:**
   - Copy all `.tflite` files to `android/app/src/main/assets/models/`
   - Verify in `metro.config.js`:

   ```javascript
   assetExts: [...defaultAssetExts, "tflite", "onnx"];
   ```

2. **iOS:**
   - Copy all `.tflite` files to Xcode project
   - Xcode → Build Phases → Copy Bundle Resources
   - Add all `.tflite` files

---

## Change 5: Merge npm Dependencies

### Source

`package.json` (DatalakeFaceAuth section: steps 1)

### Add to Datalake 3.0's `package.json`

```json
{
  "dependencies": {
    "@react-navigation/native": "^6.1.17",
    "@react-navigation/stack": "^6.3.29",
    "react-native-screens": "^3.31.1",
    "react-native-safe-area-context": "^4.10.5",
    "react-native-vision-camera": "^4.5.1",
    "react-native-worklets-core": "^1.3.3",
    "vision-camera-resize-plugin": "^2.1.0",
    "react-native-fast-tflite": "^1.2.0",
    "react-native-sqlite-storage": "^6.0.1",
    "@react-native-community/netinfo": "^11.3.1",
    "react-native-fs": "^2.20.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-native-uuid": "^2.0.1",
    "react-native-encrypted-storage": "^4.1.4",
    "react-native-aes-crypto": "^2.2.0",
    "aws-sdk": "^2.1693.0"
  },
  "devDependencies": {
    "@types/react-native-sqlite-storage": "^5.0.3",
    "@types/react-native-fs": "^2.20.2"
  }
}
```

### Installation

```bash
npm install
# or if peer dependency conflicts:
npm install --legacy-peer-deps
```

---

## Change 6: Merge Configuration Files

### Babel Configuration

In Datalake 3.0's `babel.config.js`, ensure `react-native-worklets-core/plugin` is **FIRST**:

```javascript
module.exports = {
  presets: ["module:metro-react-native-babel-preset"],
  plugins: [
    "react-native-worklets-core/plugin", // ← MUST be first
    "react-native-reanimated/plugin",
    // ... other plugins
  ],
};
```

### Metro Configuration

In `metro.config.js`, add `.tflite` and `.onnx` extensions:

```javascript
const config = {
  project: {
    ios: {},
    android: {},
  },
  resolver: {
    assetExts: [...getDefaultAssetExts(), "tflite", "onnx"],
    sourceExts: [...getDefaultSourceExts(), "jsx", "ts", "tsx"],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
```

### TypeScript Configuration

In `tsconfig.json`, ensure strict mode is enabled (for type safety):

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## Change 7: Initialize Face Auth in App.tsx

### Before (Datalake 3.0's App.tsx)

```typescript
export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
```

### After (Add Face Auth initialization)

```typescript
import { DatabaseManager } from './DatalakeFaceAuth/database/DatabaseManager';
import { EmbeddingCache } from './DatalakeFaceAuth/core/EmbeddingCache';
import { NetworkMonitor } from './DatalakeFaceAuth/sync/NetworkMonitor';
import { SyncManager } from './DatalakeFaceAuth/sync/SyncManager';
import { SecurityUtils } from './DatalakeFaceAuth/utils/SecurityUtils';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeFaceAuth();
  }, []);

  const initializeFaceAuth = async () => {
    try {
      await SecurityUtils.getOrCreateEncryptionKey();
      await DatabaseManager.getInstance().initialize();
      await EmbeddingCache.getInstance().loadAll();
      NetworkMonitor.getInstance().start(async () => {
        await SyncManager.getInstance().startSync();
      });
      setReady(true);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (error) return <ErrorScreen message={error} />;
  if (!ready) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
```

---

## Verification Checklist

After integrating all 7 changes, verify:

### Build

- [ ] Android build succeeds: `npx react-native run-android`
- [ ] iOS build succeeds: `npx react-native run-ios`
- [ ] No TypeScript compilation errors
- [ ] No missing dependency warnings

### Runtime

- [ ] App launches without errors
- [ ] Loading spinner shows (initialization)
- [ ] After 3-5 seconds, main app appears
- [ ] Face auth screens accessible from navigation
- [ ] Camera permission works
- [ ] Models load on first auth attempt

### Face Auth Functionality

- [ ] Can enroll a face (5 captures)
- [ ] Can authenticate against enrolled face
- [ ] Attendance records saved to SQLite
- [ ] SyncBadge shows pending records count
- [ ] Offline mode works (airplane mode)
- [ ] Sync works when online

### Datalake 3.0 Integration

- [ ] Employee data loads from Datalake 3.0's source
- [ ] EnrollmentScreen dropdown shows employees
- [ ] EmployeeBridge.reportAttendance() updates Datalake 3.0
- [ ] Navigation stack merges correctly

---

## Troubleshooting Integration

### Issue: EmployeeBridge data not loading

**Cause:** Employee data source not found  
**Fix:** Verify Datalake 3.0's employee data location and update EmployeeBridge accordingly

### Issue: FaceRecognitionModule not registered

**Cause:** Native bridge not properly linked  
**Fix:** For Android, verify FaceRecognitionModule is added to MainApplication.getPackages()

### Issue: Models not found at runtime

**Cause:** Model files not copied to assets  
**Fix:** Verify models/ directory and metro.config.js assetExts includes 'tflite'

### Issue: Navigation stack conflicts

**Cause:** Screen name collisions between face auth and Datalake 3.0  
**Fix:** Namespace face auth screens with "FaceAuth" prefix (e.g., "FaceAuthHome" instead of "Home")

### Issue: TypeScript type mismatches

**Cause:** Type definitions don't align  
**Fix:** Ensure both projects use strict: true in tsconfig.json

---

## Reverse Process: Removing Face Auth

If face auth integration needs to be removed later:

1. Delete `src/bridges/EmployeeBridge.ts` usage
2. Remove face auth screens from navigator
3. Delete native bridge files
4. Delete model files
5. Remove face auth npm packages from package.json
6. Remove SecurityUtils.getOrCreateEncryptionKey() call
7. Remove DatabaseManager and EmbeddingCache initialization
8. Delete all FaceAuth TypeScript sources

All remaining Datalake 3.0 code continues to work unchanged.

---

## Questions?

Contact the face auth development team for:

- Help identifying Datalake 3.0's employee data source
- Debugging native bridge registration
- Resolving TypeScript conflicts
- Performance optimization on target device
