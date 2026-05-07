# App Intents Framework

Start with the smallest useful action surface, not a mirror of the app's navigation tree.

First pass workflow:

1. Identify the 1-3 highest-value actions a user would want outside the app.
2. Add the smallest `AppEntity` surface needed for lookup or routing.
3. Decide whether the action completes inline or should open the app with `openAppWhenRun`.
4. Add `AppShortcutsProvider` entries so the actions are discoverable.
5. Verify the runtime handoff path is clear and centralized.

## Table of Contents

1. [AppIntent Protocol](#1-appintent-protocol)
2. [Parameters](#2-parameters)
3. [AppEntity](#3-appentity)
4. [AppShortcutsProvider](#4-appshortcutsprovider)
5. [Spotlight Integration](#5-spotlight-integration)
6. [Interactive Widgets](#6-interactive-widgets-ios-17)
7. [Focus Filters](#7-focus-filters)
8. [Action Button](#8-action-button-iphone-15-pro)
9. [Siri Integration](#9-siri-integration)
10. [Testing](#10-testing)
11. [Common Patterns](#11-common-patterns)

---

## 1. AppIntent Protocol

### Basic Intent

```swift
import AppIntents

struct OpenFavoritesIntent: AppIntent {
    static let title: LocalizedStringResource = "Open Favorites"
    static let description = IntentDescription("Opens the favorites screen")

    static var openAppWhenRun: Bool { true }

    func perform() async throws -> some IntentResult {
        // Execute action
        return .result()
    }
}
```

### Return Types

```swift
// Simple completion — no return value
func perform() async throws -> some IntentResult {
    return .result()
}

// Return a value to Shortcuts
func perform() async throws -> some IntentResult & ReturnsValue<Int> {
    return .result(value: items.count)
}

// Show a dialog in Siri / Shortcuts
func perform() async throws -> some IntentResult & ProvidesDialog {
    return .result(dialog: "Added \(item.name) to favorites.")
}

// Chain to another intent
func perform() async throws -> some IntentResult & OpensIntent {
    return .result(opensIntent: ShowDetailIntent())
}

// Combine — return value + dialog
func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog {
    return .result(value: item.name, dialog: "Created \(item.name).")
}
```

- Set `openAppWhenRun = true` when the intent needs to show UI.
- Set `openAppWhenRun = false` (default) for background-only actions like toggling a setting.

---

## 2. Parameters

### Declaring Parameters

```swift
struct CreateNoteIntent: AppIntent {
    static let title: LocalizedStringResource = "Create Note"

    @Parameter(title: "Title")
    var noteTitle: String

    @Parameter(title: "Priority", default: 0)
    var priority: Int

    @Parameter(title: "Is Pinned", default: false)
    var isPinned: Bool

    @Parameter(title: "Due Date")
    var dueDate: Date?

    @Parameter(title: "Category")
    var category: NoteCategory  // enum conforming to AppEnum

    func perform() async throws -> some IntentResult { ... }
}
```

Supported parameter types: `String`, `Int`, `Double`, `Bool`, `Date`, `URL`, enums conforming to `AppEnum`, entities conforming to `AppEntity`.

### AppEnum for Enum Parameters

```swift
enum NoteCategory: String, AppEnum {
    case work, personal, ideas

    static let typeDisplayRepresentation: TypeDisplayRepresentation = "Category"
    static let caseDisplayRepresentations: [NoteCategory: DisplayRepresentation] = [
        .work: "Work",
        .personal: "Personal",
        .ideas: "Ideas"
    ]
}
```

### Prompting for Input

```swift
func perform() async throws -> some IntentResult {
    // Ask the user for a value via Siri dialog
    let name = try await $noteTitle.requestValue("What should the note be called?")

    // Disambiguate among multiple options
    let chosen = try await $category.requestDisambiguation(
        among: NoteCategory.allCases,
        dialog: "Which category?"
    )

    // Confirm before destructive action
    try await requestConfirmation(result: .result(dialog: "Delete all notes in \(chosen)?"))

    return .result()
}
```

- `requestValue(_:)` — prompts the user when a required parameter is missing.
- `requestDisambiguation(among:dialog:)` — presents a choice list.
- `requestConfirmation(result:)` — asks the user to confirm before proceeding.
- Optional parameters (`Date?` above) do not require a value; the intent runs without prompting if nil.

---

## 3. AppEntity

Make app content discoverable in Shortcuts, Siri, and Spotlight.

### Defining an Entity

```swift
struct NoteEntity: AppEntity {
    static let typeDisplayRepresentation: TypeDisplayRepresentation = "Note"
    static let defaultQuery = NoteQuery()

    let id: String
    let title: String
    let category: NoteCategory

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(title)", subtitle: "\(category.rawValue)")
    }
}
```

### EntityQuery

```swift
struct NoteQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [NoteEntity] {
        // Fetch entities matching the given IDs
        NoteStore.shared.notes.filter { identifiers.contains($0.id) }
    }

    func suggestedEntities() async throws -> [NoteEntity] {
        // Return recently used / popular entities for the picker
        Array(NoteStore.shared.notes.prefix(10))
    }
}
```

### EntityStringQuery (Text Search)

```swift
struct NoteQuery: EntityStringQuery {
    func entities(for identifiers: [String]) async throws -> [NoteEntity] {
        NoteStore.shared.notes.filter { identifiers.contains($0.id) }
    }

    func entities(matching string: String) async throws -> [NoteEntity] {
        NoteStore.shared.notes.filter { $0.title.localizedCaseInsensitiveContains(string) }
    }

    func suggestedEntities() async throws -> [NoteEntity] {
        Array(NoteStore.shared.notes.prefix(10))
    }
}
```

- `entities(for:)` — resolve by identifier (required).
- `suggestedEntities()` — populate the Shortcuts parameter picker.
- `entities(matching:)` — enables type-to-search in Shortcuts and Siri.

---

## 4. AppShortcutsProvider

Predefined shortcuts that appear in Spotlight, the Shortcuts app, and Siri without user setup.

### Defining Shortcuts

```swift
struct MyAppShortcuts: AppShortcutsProvider {
    @AppShortcutsBuilder
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: OpenFavoritesIntent(),
            phrases: [
                "Open favorites in \(.applicationName)",
                "Show my \(.applicationName) favorites"
            ],
            shortTitle: "Favorites",
            systemImageName: "star.fill"
        )

        AppShortcut(
            intent: CreateNoteIntent(),
            phrases: [
                "Create a note in \(.applicationName)",
                "New \(.applicationName) note"
            ],
            shortTitle: "New Note",
            systemImageName: "plus.circle"
        )
    }
}
```

### Phrase Variables

- `\(.applicationName)` — replaced with the app's display name (required in every phrase).
- Parameter references: `"Open \(\.$noteTitle) in \(.applicationName)"` — allows Siri to fill in a parameter from speech.

### Promoting Shortcuts in the App

```swift
// Link to Shortcuts app showing your app's shortcuts
ShortcutsLink()

// Siri suggestion bubble for a specific intent
SiriTipView(intent: OpenFavoritesIntent())
    .siriTipViewStyle(.automatic)
```

- `ShortcutsLink()` opens the Shortcuts app filtered to your shortcuts.
- `SiriTipView` shows a floating tip with a suggested Siri phrase.

---

## 5. Spotlight Integration

### IndexedEntity

Make entities searchable in Spotlight results:

```swift
struct NoteEntity: AppEntity, IndexedEntity {
    // ... existing AppEntity conformance ...

    var attributeSet: CSSearchableItemAttributeSet {
        let attributes = CSSearchableItemAttributeSet()
        attributes.displayName = title
        attributes.contentDescription = "Note in \(category.rawValue)"
        return attributes
    }
}
```

- Conform to `IndexedEntity` and provide `attributeSet`.
- The system indexes entities returned by your query's `suggestedEntities()` and any entities used in intents.
- Tapping a Spotlight result can open the app via the entity's associated intent.

---

## 6. Interactive Widgets (iOS 17+)

Widgets can contain buttons and toggles that execute App Intents without opening the app.

### Button

```swift
struct ToggleFavoriteIntent: AppIntent {
    static let title: LocalizedStringResource = "Toggle Favorite"

    @Parameter(title: "Item ID")
    var itemID: String

    init() {}
    init(itemID: String) { self.itemID = itemID }

    func perform() async throws -> some IntentResult {
        FavoritesStore.shared.toggle(id: itemID)
        return .result()
    }
}

// In widget view
Button(intent: ToggleFavoriteIntent(itemID: entry.itemID)) {
    Image(systemName: entry.isFavorite ? "star.fill" : "star")
}
```

### Toggle

```swift
Toggle(isOn: entry.isPinned, intent: TogglePinIntent(itemID: entry.itemID)) {
    Text("Pinned")
}
```

### Combining with AppIntentTimelineProvider

When an interactive intent modifies data, reload the widget timeline:

```swift
func perform() async throws -> some IntentResult {
    FavoritesStore.shared.toggle(id: itemID)
    WidgetCenter.shared.reloadTimelines(ofKind: "FavoritesWidget")
    return .result()
}
```

- Interactive intents must have `openAppWhenRun = false` (the default).
- The intent runs in the widget extension's process — keep shared data in an App Group.

---

## 7. Focus Filters

Adapt app behavior when the user activates a Focus mode (e.g., show only work accounts during Work Focus).

```swift
struct MyFocusFilter: SetFocusFilterIntent {
    static let title: LocalizedStringResource = "Set Account Filter"
    static let description = IntentDescription("Choose which account to show during this Focus.")

    @Parameter(title: "Account")
    var account: AccountEntity?

    var displayRepresentation: DisplayRepresentation {
        if let account {
            return DisplayRepresentation(title: "Show \(account.name)")
        }
        return DisplayRepresentation(title: "All Accounts")
    }

    func perform() async throws -> some IntentResult {
        if let account {
            AccountFilter.shared.activeAccountID = account.id
        } else {
            AccountFilter.shared.activeAccountID = nil
        }
        return .result()
    }
}
```

- The system calls `perform()` when the Focus activates.
- `displayRepresentation` controls what appears in Settings > Focus > Focus Filters.
- Use `@Parameter` to let the user configure what the filter does.

---

## 8. Action Button (iPhone 15 Pro+)

Register intents for the Action Button by including them in `AppShortcutsProvider`. The system lists your app's shortcuts as Action Button options.

```swift
// The same AppShortcutsProvider from section 4 — no extra code needed.
// Users pick a shortcut in Settings > Action Button.
```

Constraints:
- Intents should complete quickly — the user expects immediate feedback.
- Must work from the Lock Screen — avoid requiring authentication unless necessary.
- Keep `openAppWhenRun = false` for instant actions; use `true` only if the intent must show UI.

---

## 9. Siri Integration

App Intents automatically integrate with Siri via the phrases defined in `AppShortcutsProvider`.

### Custom Dialog Responses

```swift
func perform() async throws -> some IntentResult & ProvidesDialog {
    return .result(dialog: IntentDialog("Done — \(item.name) has been added."))
}
```

### Prompting for Missing Values

```swift
func perform() async throws -> some IntentResult {
    let title = try await $noteTitle.requestValue(
        IntentDialog("What should I call the note?")
    )
    // Siri speaks the dialog and waits for a response
    ...
}
```

### Tips

- Every phrase **must** include `\(.applicationName)`.
- Keep phrases short and natural — 3-6 words is ideal.
- Provide 2-5 phrase variations per shortcut for better recognition.
- Test with Siri on device — the Simulator does not support voice input.

---

## 10. Testing

### Shortcuts App

- Open Shortcuts > search your app name > run intents manually.
- Verify parameters, dialogs, and return values work as expected.

### Siri Testing

- Test each phrase variation on a physical device.
- Verify `IntentDialog` responses read naturally when spoken.

### IntentDescription

Add metadata for discoverability:

```swift
struct CreateNoteIntent: AppIntent {
    static let title: LocalizedStringResource = "Create Note"
    static let description = IntentDescription(
        "Creates a new note with a title and category.",
        categoryName: "Notes",
        searchKeywords: ["note", "create", "new"]
    )
    ...
}
```

### Debug Logging

```swift
func perform() async throws -> some IntentResult {
    Logger.intents.debug("CreateNoteIntent: title=\(noteTitle), category=\(category)")
    ...
}
```

- Use `os.Logger` — output appears in Console.app filtered by your subsystem.
- Attach the debugger to the Shortcuts app process or your app's intent extension to hit breakpoints.

---

## 11. Common Patterns

### Add to Favorites

```swift
struct AddToFavoritesIntent: AppIntent {
    static let title: LocalizedStringResource = "Add to Favorites"

    @Parameter(title: "Item")
    var item: NoteEntity

    func perform() async throws -> some IntentResult & ProvidesDialog {
        FavoritesStore.shared.add(id: item.id)
        return .result(dialog: "Added \(item.title) to favorites.")
    }
}
```

### Open Item in App

```swift
struct OpenNoteIntent: AppIntent {
    static let title: LocalizedStringResource = "Open Note"
    static var openAppWhenRun: Bool { true }

    @Parameter(title: "Note")
    var note: NoteEntity

    func perform() async throws -> some IntentResult {
        Navigator.shared.open(noteID: note.id)
        return .result()
    }
}
```

### Create with Multiple Parameters

```swift
struct CreateReminderIntent: AppIntent {
    static let title: LocalizedStringResource = "Create Reminder"

    @Parameter(title: "Title")
    var title: String

    @Parameter(title: "Due Date")
    var dueDate: Date?

    @Parameter(title: "Priority", default: .medium)
    var priority: Priority

    func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog {
        let reminder = ReminderStore.shared.create(title: title, dueDate: dueDate, priority: priority)
        return .result(value: reminder.id, dialog: "Created reminder: \(title)")
    }
}
```

### Background Data Refresh for Widgets

```swift
struct RefreshWidgetDataIntent: AppIntent {
    static let title: LocalizedStringResource = "Refresh Widget"
    static var openAppWhenRun: Bool { false }

    func perform() async throws -> some IntentResult {
        try await DataService.shared.fetchLatest()
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}
```
