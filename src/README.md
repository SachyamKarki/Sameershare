# 🎯 Professional Source Code Structure

## 📁 Directory Overview

```
src/
├── 📱 App.js                    # Main application entry point
├── 📖 index.js                 # Central export hub
├── 📖 README.md                # This documentation
│
├── 🧩 components/               # Reusable UI components
│   ├── 📖 index.js             # Component exports
│   ├── 🎨 ui/                  # Pure UI components
│   │   ├── AmPmSelector.js     # AM/PM time selector
│   │   ├── DaysSelector.js     # Day selection component
│   │   └── TimeDisplay.tsx     # Current time display
│   └── 🔄 common/              # Business logic components
│       ├── AlarmList.jsx       # Alarm management list
│       └── Recorder.jsx        # Audio recording component
│
├── 🎭 context/                  # React Context providers
│   ├── 📖 index.js             # Context exports
│   └── AlarmContext.js         # Alarm state management
│
├── 📱 screens/                  # Application screens
│   ├── 📖 index.js             # Screen exports
│   ├── HomeScreen.jsx          # Main home interface
│   ├── SetAlarmScreen.jsx      # Alarm configuration
│   ├── RecordingScreen.jsx     # Recording management
│   └── (AlarmRingingScreen removed - now using native Java AlarmActivity)
│
├── 🧭 navigation/               # Navigation configuration
│   └── navigation.jsx          # Route definitions & setup
│
├── 🔧 services/                 # Business logic services
│   └── NotificationService.js  # Notification management
│
├── 🛠️ utils/                    # Utility functions
│   ├── 📖 index.js             # Utility exports
│   ├── ⏰ time.js              # Time manipulation helpers
│   └── 🔊 audio.js             # Audio management helpers
│
├── 📊 constants/                # Application constants
│   └── app.js                  # App-wide configuration
│
├── ⚙️ config/                   # Configuration files
├── 🎣 hooks/                    # Custom React hooks
└── 📝 types/                    # Type definitions
```

## 🚀 Key Benefits

### ✅ **Maintainability**
- **Clear separation of concerns** - Each folder has a specific purpose
- **Easy to locate code** - Logical organization makes finding files intuitive
- **Scalable structure** - Can easily add new features without restructuring

### ✅ **Developer Experience**
- **Clean imports** - Use index files for organized imports
- **Consistent patterns** - Standardized file organization
- **Professional standards** - Industry-standard folder structure

### ✅ **Code Quality**
- **Centralized constants** - No magic strings scattered throughout code
- **Reusable utilities** - Common functions extracted to utils
- **Service layer** - Business logic separated from UI components

## 📚 Usage Examples

### Clean Imports
```javascript
// ✅ Good: Clean, organized imports
import { TimeDisplay, AlarmList, Recorder } from '../components';
import { useAlarm } from '../context';
import { formatTime, getCurrentTime } from '../utils';
import { COLORS, DAYS } from '../constants/app';

// ❌ Bad: Scattered, hard to read
import TimeDisplay from '../components/ui/TimeDisplay';
import AlarmList from '../components/common/AlarmList';
import Recorder from '../components/common/Recorder';
import { useAlarm } from '../context/AlarmContext';
// ... many more individual imports
```

### Service Usage
```javascript
// ✅ Centralized service for notifications
await NotificationService.scheduleAlarmsForDays({
  hour24, minute, alarmId, audioUri, days
});

// ✅ Easy snooze functionality
await NotificationService.scheduleSnoozeNotification(alarmId, audioUri);
```

### Utility Functions
```javascript
// ✅ Reusable time utilities
const currentTime = getCurrentTime();
const formatted = formatTime(milliseconds);
const { hour, minute } = to24h('11', '30', 'PM');
```

## 🎨 Component Architecture

### 🎨 **UI Components** (`components/ui/`)
- Pure, reusable interface elements
- No business logic
- Highly reusable across screens

### 🔄 **Common Components** (`components/common/`)
- Components with business logic
- Connected to context/state
- Screen-specific functionality

### 📱 **Screens** (`screens/`)
- Full-screen components
- Route destinations
- Orchestrate multiple components

## 🔧 Professional Patterns

### 📦 **Barrel Exports**
Each folder has an `index.js` that re-exports everything:
```javascript
// components/index.js
export { default as TimeDisplay } from './ui/TimeDisplay';
export { default as AlarmList } from './common/AlarmList';
```

### 🎯 **Single Responsibility**
- Each file has one clear purpose
- Services handle specific domains
- Utilities are focused and pure

### 📊 **Constants Management**
- All magic numbers/strings in constants
- Centralized configuration
- Easy to modify app-wide settings

## 🚀 Development Workflow

1. **Adding Features**: Place new components in appropriate folders
2. **Modifications**: Update constants first, then components
3. **Testing**: Each layer can be tested independently
4. **Debugging**: Clear structure makes issues easy to locate

## 📈 Future Extensibility

This structure supports:
- ✅ **TypeScript migration** - Types folder ready
- ✅ **Custom hooks** - Hooks folder prepared
- ✅ **Configuration management** - Config folder available
- ✅ **Testing** - Clear separation makes unit testing easy
- ✅ **Team collaboration** - Standard patterns everyone can follow

---

> **Note**: All functionality has been preserved during this reorganization. The app works exactly the same but with improved code organization and maintainability.
