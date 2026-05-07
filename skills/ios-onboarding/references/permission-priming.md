# Permission Priming for iOS

## Principle

Prime a permission only when the user can understand the benefit immediately.
Do not ask early just because the app may want the permission later.

Inspect both declarations and call sites before recommending a prompt.

## What to inspect

Check `Info.plist` for keys such as:
- `NSUserTrackingUsageDescription`
- `NSCameraUsageDescription`
- `NSMicrophoneUsageDescription`
- `NSPhotoLibraryUsageDescription`
- `NSPhotoLibraryAddUsageDescription`
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`
- `NSContactsUsageDescription`
- `NSHealthShareUsageDescription`
- `NSHealthUpdateUsageDescription`

Also inspect code for request sites such as:
- `UNUserNotificationCenter.current().requestAuthorization`
- `CLLocationManager.requestWhenInUseAuthorization`
- `AVCaptureDevice.requestAccess`
- `PHPhotoLibrary.requestAuthorization`
- `ATTrackingManager.requestTrackingAuthorization`
- `HKHealthStore.requestAuthorization`

## Ask timing by permission

### Notifications
Ask after the user has created or scheduled something worth being reminded about.

Do:
- connect the ask to a specific reminder or streak
- explain what the notifications contain
- offer `Not now`

Do not:
- ask on the first screen
- ask before the user has seen the product's benefit

### Camera
Ask right before capture or scanning.

Do:
- frame the ask around scanning, capturing, or uploading the thing the user wants
- provide a fallback such as manual entry when possible

### Photos
Prefer `PhotosPicker` or `PHPickerViewController` when full library access is unnecessary.
That often removes the need for a broad library permission during onboarding.

Ask for photo permission only when:
- the app must access the library outside the picker flow
- the value is clear in the current step

### Location
Ask only when nearby results, route context, or place-aware behavior is on screen.
Start with When In Use unless background behavior is essential and already understood.

### Microphone
Ask only when the user taps a record or voice feature.

### HealthKit
Ask only when health import is a central reason to use the app.
Explain exactly which data types will be read or written and why.

### Contacts
Ask only when the user starts an invitation, sharing, or matching flow.

### ATT
Treat ATT separately from product permissions.
Ask only if the app truly uses tracking and the reason can be explained honestly.
Do not bundle it with product value copy that implies the app cannot work without it.

## Pre-prompt structure

Keep the pre-prompt short:

1. State the user benefit.
2. Name 2-3 concrete outcomes.
3. Let the user continue or skip.
4. Trigger the system prompt only from the explicit allow action.

Example shape:

- Headline: `Get reminded before your plan slips`
- Bullets:
  - `Receive reminders for the sessions you scheduled`
  - `Keep your streak going without checking the app`
  - `Change these anytime in Settings`
- Buttons:
  - `Turn on reminders`
  - `Not now`

## Review rules

- Verify the permission is actually used in the product.
- Verify the wording matches the corresponding `Info.plist` description and in-app behavior.
- Verify denial leaves the user on a usable path.
- Verify the app does not chain multiple system prompts back to back.
- Verify the flow does not punish `Not now` with dead ends or guilt language.
