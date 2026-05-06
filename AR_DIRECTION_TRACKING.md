# AR Direction Tracking - How It Works

## Overview
The AR Navigator now uses your phone's built-in sensors to detect which direction you're facing and adjusts the navigation arrows accordingly.

## Sensors Used

### 1. **Magnetometer (Compass)**
- Detects magnetic north
- Provides heading: 0° = North, 90° = East, 180° = South, 270° = West
- Accessed via `DeviceOrientationEvent.alpha` or `webkitCompassHeading` (iOS)

### 2. **Gyroscope**
- Tracks rotation speed
- Helps smooth out compass readings

### 3. **Accelerometer**
- Detects device tilt and movement
- Used for orientation calculations

## How Direction Detection Works

### Step 1: Get Device Heading
```javascript
window.addEventListener('deviceorientation', (event) => {
  let heading = event.alpha; // 0-360 degrees
  if (event.webkitCompassHeading) {
    heading = event.webkitCompassHeading; // iOS uses this
  }
  setDeviceHeading(heading);
});
```

### Step 2: Calculate Target Direction
Based on the map coordinates, we determine which direction the user needs to go:
- **Up** = 0° (North)
- **Right** = 90° (East)
- **Down** = 180° (South)
- **Left** = 270° (West)

### Step 3: Calculate Relative Angle
```javascript
const targetAngle = { up: 0, right: 90, down: 180, left: 270 }[direction];
const relativeAngle = ((targetAngle - deviceHeading + 360) % 360) * (Math.PI / 180);
```

### Step 4: Rotate Arrow
The arrow rotates based on the relative angle, so:
- If you're facing the target direction → Arrow points forward
- If you turn left → Arrow rotates right (telling you to turn right)
- If you turn around → Arrow points backward

## Features Added

### 1. **Compass Indicator**
- Shows a rotating compass icon in the top bar
- Rotates in real-time as you turn your phone
- Visual feedback that orientation tracking is working

### 2. **iOS Permission Request**
- iOS 13+ requires explicit permission for motion sensors
- Shows a popup asking user to "Allow Compass Access"
- Handles permission gracefully

### 3. **Real-time Arrow Rotation**
- Arrow smoothly rotates as you turn
- Updates continuously (not just on step changes)
- Works like Google Maps AR navigation

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome (Android) | ✅ Full | Works automatically |
| Safari (iOS) | ✅ Full | Requires permission prompt |
| Firefox (Android) | ✅ Full | Works automatically |
| Chrome (Desktop) | ⚠️ Limited | No compass on desktop |

## Testing

### On Real Device:
1. Open the app on your phone (must use HTTPS or localhost)
2. Start AR navigation
3. Allow compass/orientation permission if prompted
4. Turn your phone left/right and watch the arrow rotate
5. Walk in the direction the arrow points

### Troubleshooting:
- **Arrow doesn't rotate**: Check if permission was granted
- **Arrow jumps around**: Compass calibration needed (move phone in figure-8 pattern)
- **Not working on iOS**: Must use Safari, not Chrome
- **Not working at all**: Check if using HTTPS (required for sensor access)

## Example User Experience

**Scenario**: User needs to turn right at the next corridor

1. **User facing forward**: Arrow points right →
2. **User turns 45° right**: Arrow points slightly right ↗
3. **User turns 90° right**: Arrow points forward ⬆
4. **User is now facing the correct direction!**

## Technical Notes

- Compass readings can be affected by magnetic interference (metal, electronics)
- Indoor navigation may have less accurate compass readings
- Gyroscope helps smooth out jittery compass data
- Orientation updates happen ~60 times per second for smooth rotation
