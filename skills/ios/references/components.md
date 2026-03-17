# SwiftUI Component Patterns

## Table of Contents

1. [Navigation](#1-navigation)
2. [Lists and Collections](#2-lists-and-collections)
3. [Pagination and Infinite Scroll](#3-pagination-and-infinite-scroll)
4. [Modern ScrollView APIs](#4-modern-scrollview-apis)
5. [Forms and Input](#5-forms-and-input)
6. [Sheets and Modals](#6-sheets-and-modals)
7. [Search](#7-search)
8. [Loading and Progress](#8-loading-and-progress)
9. [Adaptive Layouts](#9-adaptive-layouts)
10. [Animations](#10-animations)
11. [Gestures](#11-gestures)
12. [Feedback](#12-feedback)
13. [Error and Empty States](#13-error-and-empty-states)

---

## 1. Navigation

### Programmatic Navigation with NavigationPath

```swift
struct ContentView: View {
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            List(items) { item in
                NavigationLink(value: item) {
                    ItemRow(item: item)
                }
            }
            .navigationTitle("Items")
            .navigationDestination(for: Item.self) { item in
                ItemDetailView(item: item)
            }
            .navigationDestination(for: Destination.self) { dest in
                switch dest {
                case .settings: SettingsView()
                case .profile: ProfileView()
                case .itemDetail(let id): ItemDetailView(itemId: id)
                }
            }
        }
    }

    enum Destination: Hashable {
        case settings, profile, itemDetail(id: Int)
    }
}
```

### Navigation State Persistence

```swift
struct PersistentNavigationView: View {
    @SceneStorage("navigationPath") private var pathData: Data?
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            ContentView()
                .navigationDestination(for: Item.self) { item in
                    ItemDetailView(item: item)
                }
        }
        .onAppear { restorePath() }
        .onChange(of: path.count) { _, _ in savePath(path) }
    }

    private func savePath(_ path: NavigationPath) {
        guard let representation = path.codable else { return }
        pathData = try? JSONEncoder().encode(representation)
    }

    private func restorePath() {
        guard let data = pathData,
              let rep = try? JSONDecoder().decode(
                NavigationPath.CodableRepresentation.self, from: data
              ) else { return }
        path = NavigationPath(rep)
    }
}
```

### Three-Column NavigationSplitView

```swift
NavigationSplitView {
    List(folders, selection: $selectedFolder) { folder in
        NavigationLink(value: folder) {
            Label(folder.name, systemImage: "folder")
        }
    }
    .navigationTitle("Folders")
} content: {
    if let folder = selectedFolder {
        List(folder.documents, selection: $selectedDocument) { doc in
            NavigationLink(value: doc) {
                DocumentRow(document: doc)
            }
        }
        .navigationTitle(folder.name)
    }
} detail: {
    if let doc = selectedDocument {
        DocumentDetailView(document: doc)
    } else {
        ContentUnavailableView("Select a Document", systemImage: "doc")
    }
}
```

### Navigation Coordinator

```swift
@MainActor
@Observable class NavigationCoordinator {
    var path = NavigationPath()
    var sheet: Sheet?
    var fullScreenCover: FullScreenCover?

    enum Sheet: Identifiable {
        case settings, newItem, editItem(Item)
        var id: String {
            switch self {
            case .settings: "settings"
            case .newItem: "newItem"
            case .editItem(let item): "editItem-\(item.id)"
            }
        }
    }

    enum FullScreenCover: Identifiable {
        case onboarding, camera
        var id: String { String(describing: self) }
    }

    func push(_ destination: Destination) { path.append(destination) }
    func pop() { guard !path.isEmpty else { return }; path.removeLast() }
    func popToRoot() { path = NavigationPath() }
    func present(_ sheet: Sheet) { self.sheet = sheet }
    func dismiss() { sheet = nil; fullScreenCover = nil }
}
```

### TabView

```swift
// iOS 18+ Tab syntax
TabView {
    Tab("Home", systemImage: "house") {
        HomeView()
    }
    Tab("Search", systemImage: "magnifyingglass") {
        SearchView()
    }
    Tab("Profile", systemImage: "person") {
        ProfileView()
    }
}

// Pre-iOS 18 tabItem syntax (iOS 17 and earlier)
TabView {
    HomeView()
        .tabItem { Label("Home", systemImage: "house") }
    SearchView()
        .tabItem { Label("Search", systemImage: "magnifyingglass") }
}
```

### Toolbar Placements

```swift
.toolbar {
    // Leading button in the navigation bar
    ToolbarItem(placement: .topBarLeading) {
        Button("Edit") { isEditing.toggle() }
    }
    // Trailing button in the navigation bar
    ToolbarItem(placement: .topBarTrailing) {
        Button("Add", systemImage: "plus") { addItem() }
    }
    // Centered title area (replaces navigation title)
    ToolbarItem(placement: .principal) {
        Picker("Filter", selection: $filter) {
            Text("All").tag(Filter.all)
            Text("Active").tag(Filter.active)
        }
        .pickerStyle(.segmented)
    }
    // Bottom bar
    ToolbarItem(placement: .bottomBar) {
        Text("\(items.count) items")
    }
    // Group multiple items in one placement
    ToolbarItemGroup(placement: .topBarTrailing) {
        Button("Sort", systemImage: "arrow.up.arrow.down") { sort() }
        Button("Filter", systemImage: "line.3.horizontal.decrease") { filter() }
    }
}
```

### @Bindable with @Observable ViewModels

Use `@Bindable` to create `Binding`s from `@Observable` properties for two-way binding in forms and controls:

```swift
// @Bindable for creating bindings to @Observable properties
@Observable class FormModel {
    var name = ""
    var email = ""
    var isSubscribed = false
}

struct FormView: View {
    @Bindable var model: FormModel

    var body: some View {
        Form {
            TextField("Name", text: $model.name)
            TextField("Email", text: $model.email)
            Toggle("Subscribe", isOn: $model.isSubscribed)
        }
    }
}

// Use @Bindable in container views that own the model
struct ContainerView: View {
    @State private var model = FormModel()

    var body: some View {
        FormView(model: model) // @Bindable wraps automatically
    }
}
```

Key rules:
- Use `@State` to own the `@Observable` object at the top level.
- Use `@Bindable` in child views that need two-way bindings to the model's properties.
- For read-only access, just pass the `@Observable` object directly (no wrapper needed).
- `@Bindable` also works with `@Environment` values: first declare `@Environment(AppSettings.self) private var appSettings`, then use `@Bindable var settings = appSettings` as a local variable inside `body` to create bindings.
- **Never use `Binding(get:set:)` in view body code.** Use `@State`/`@Binding` with `onChange()` instead.

---

## 2. Lists and Collections

### Swipe Actions and Reordering

```swift
List {
    ForEach(items) { item in
        ItemRow(item: item)
            .swipeActions(edge: .trailing) {
                Button(role: .destructive) { delete(item) } label: {
                    Label("Delete", systemImage: "trash")
                }
                Button { archive(item) } label: {
                    Label("Archive", systemImage: "archivebox")
                }
                .tint(.blue)
            }
    }
    .onDelete(perform: deleteItems)
    .onMove(perform: moveItems)
}
.listStyle(.insetGrouped)
.refreshable { await loadItems() }
```

### Adaptive Grid

```swift
struct AdaptiveGridView: View {
    @Environment(\.horizontalSizeClass) private var sizeClass

    private var columns: [GridItem] {
        sizeClass == .regular
            ? [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())]
            : [GridItem(.adaptive(minimum: 150, maximum: 200))]
    }

    var body: some View {
        ScrollView {
            LazyVGrid(columns: columns, spacing: 16) {
                ForEach(items) { item in
                    ItemCard(item: item)
                }
            }
            .padding()
        }
    }
}
```

---

## 3. Pagination and Infinite Scroll

### Paging State and Fetcher Protocol

Define explicit paging state to track whether more content is available:

```swift
enum StatusesState: Equatable {
    enum PagingState: Equatable {
        case hasNextPage, none
    }
    case loading
    case display(statuses: [Status], nextPageState: PagingState)
    case error
}

@MainActor
protocol StatusesFetcher {
    var statusesState: StatusesState { get }
    func fetchNewestStatuses(pullToRefresh: Bool) async
    func fetchNextPage() async throws
    func statusDidAppear(status: Status)
    func statusDidDisappear(status: Status)
}
```

### Next Page View (onAppear-based trigger)

Place a lightweight view at the end of the list that triggers loading when it appears:

```swift
struct NextPageView: View {
    @State private var isLoadingNextPage = false
    @State private var showRetry = false
    let loadNextPage: () async throws -> Void

    var body: some View {
        HStack {
            if showRetry {
                Button { Task { showRetry = false; await executeTask() } } label: {
                    Label("Retry", systemImage: "arrow.clockwise")
                }
                .buttonStyle(.bordered)
            } else {
                Label("Loading...", systemImage: "arrow.down")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .task { await executeTask() }
    }

    private func executeTask() async {
        guard !isLoadingNextPage else { return }
        isLoadingNextPage = true
        defer { isLoadingNextPage = false }
        do {
            try await loadNextPage()
        } catch {
            showRetry = true
        }
    }
}
```

### Wiring Pagination in a List

Append `NextPageView` after list content based on paging state:

```swift
struct FeedView<Fetcher: StatusesFetcher>: View {
    @State private var fetcher: Fetcher

    var body: some View {
        List {
            switch fetcher.statusesState {
            case .loading:
                ForEach(Status.placeholders()) { status in
                    StatusRow(status: status).redacted(reason: .placeholder)
                }
            case .display(let statuses, let nextPageState):
                ForEach(statuses) { status in
                    StatusRow(status: status)
                        .onAppear { fetcher.statusDidAppear(status: status) }
                }
                if nextPageState == .hasNextPage {
                    NextPageView {
                        try await fetcher.fetchNextPage()
                    }
                }
            case .error:
                ContentUnavailableView("Failed to Load", systemImage: "exclamationmark.triangle")
            }
        }
        .refreshable { await fetcher.fetchNewestStatuses(pullToRefresh: true) }
    }
}
```

---

## 4. Modern ScrollView APIs

### scrollPosition(id:) -- Programmatic Scroll Tracking

Bind a `@State` variable to track and control which item is visible:

```swift
struct MediaGalleryView: View {
    let items: [MediaItem]
    @State private var scrolledItem: MediaItem?

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            LazyHStack {
                ForEach(items) { item in
                    MediaCard(item: item)
                        .containerRelativeFrame([.horizontal, .vertical])
                        .id(item)
                }
            }
            .scrollTargetLayout()
        }
        .scrollTargetBehavior(.viewAligned)
        .scrollPosition(id: $scrolledItem)
    }

    func scrollToNext() {
        guard let current = scrolledItem,
              let index = items.firstIndex(of: current),
              index < items.count - 1 else { return }
        withAnimation { scrolledItem = items[index + 1] }
    }
}
```

### scrollTargetBehavior -- Paged Scrolling

Use `.paging` for full-page snapping or `.viewAligned` for item-level snapping:

```swift
// Full-page snapping (each child fills the scroll container)
ScrollView(.horizontal) {
    LazyHStack(spacing: 0) {
        ForEach(pages) { page in
            PageView(page: page)
                .containerRelativeFrame(.horizontal)
        }
    }
}
.scrollTargetBehavior(.paging)

// Item-level snapping (wrap content in scrollTargetLayout)
ScrollView(.horizontal) {
    LazyHStack(spacing: 12) {
        ForEach(cards) { card in
            CardView(card: card)
                .frame(width: 280)
        }
    }
    .scrollTargetLayout()
}
.scrollTargetBehavior(.viewAligned)
```

### containerRelativeFrame -- Sizing Relative to Scroll Container

Size children relative to the visible scroll area:

```swift
ForEach(items) { item in
    ItemView(item: item)
        // Fill the full visible width and height of the ScrollView
        .containerRelativeFrame([.horizontal, .vertical])
}

// Show 2.5 items at a time with spacing
ForEach(items) { item in
    ItemView(item: item)
        .containerRelativeFrame(.horizontal, count: 5, span: 2, spacing: 8)
}
```

### scrollIndicators -- Show/Hide Scroll Indicators

```swift
ScrollView {
    content
}
.scrollIndicators(.hidden)          // Always hidden
.scrollIndicators(.visible)         // Always visible
.scrollIndicators(.automatic)       // System default
```

---

## 5. Forms and Input

### TextField with Vertical Axis

Prefer `TextField(axis: .vertical)` over `TextEditor` for most multiline input — it supports placeholder text and integrates better with forms:

```swift
// Good — placeholder, auto-grows, works in Form
TextField("Notes", text: $notes, axis: .vertical)
    .lineLimit(3...10)

// Only use TextEditor for full-screen editing or rich text
```

### Slider in Forms

Wrap `Slider` in `LabeledContent` inside `Form` for proper title/control layout:

```swift
Form {
    LabeledContent("Volume") {
        Slider(value: $volume, in: 0...1)
    }
}
```

### Settings Form

```swift
Form {
    Section("Account") {
        TextField("Username", text: $username)
            .textContentType(.username)
            .autocorrectionDisabled()
    }
    Section("Preferences") {
        Toggle("Notifications", isOn: $notificationsEnabled)
        Toggle("Sound Effects", isOn: $soundEnabled)
        Picker("Theme", selection: $selectedTheme) {
            ForEach(Theme.allCases) { theme in
                Text(theme.rawValue).tag(theme)
            }
        }
    }
    Section("About") {
        LabeledContent("Version", value: "1.0.0")
        Link("Privacy Policy", destination: URL(string: "https://example.com/privacy")!)
    }
}
```

### Validated Input

```swift
struct ValidatedTextField: View {
    let title: String
    @Binding var text: String
    let validation: (String) -> Bool
    @State private var isValid = true
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.caption).foregroundStyle(.secondary)
            TextField(title, text: $text)
                .textFieldStyle(.roundedBorder)
                .focused($isFocused)
                .onChange(of: text) { _, newValue in
                    isValid = validation(newValue)
                }
            if !isValid && !text.isEmpty {
                Text("Invalid input").font(.caption).foregroundStyle(.red)
            }
        }
    }
}
```

### @FocusState Keyboard Management

**Boolean focus for single field:**

```swift
struct SearchInputView: View {
    @State private var query = ""
    @FocusState private var isFieldFocused: Bool

    var body: some View {
        TextField("Search...", text: $query)
            .focused($isFieldFocused)
            .onAppear { isFieldFocused = true }
            .onSubmit { performSearch() }
    }
}
```

**Enum-based focus for moving between fields:**

```swift
struct PollEditorView: View {
    enum FocusField: Hashable {
        case option(Int)
    }

    @FocusState private var focused: FocusField?
    @State private var options = ["", ""]

    var body: some View {
        ForEach(options.indices, id: \.self) { index in
            TextField("Option \(index + 1)", text: $options[index])
                .focused($focused, equals: .option(index))
                .onSubmit {
                    if index < options.count - 1 {
                        focused = .option(index + 1)
                    }
                }
        }
        .onAppear { focused = .option(0) }
    }
}
```

**Dismissing the keyboard:**

```swift
// Set focus to nil to dismiss
Button("Done") { focused = nil }

// Toolbar button above the keyboard
.toolbar {
    ToolbarItemGroup(placement: .keyboard) {
        Spacer()
        Button("Done") { focused = nil }
    }
}
```

**Multi-field form with keyboard navigation:**

```swift
struct LoginForm: View {
    enum Field: Hashable { case email, password }
    @FocusState private var focusedField: Field?
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        Form {
            TextField("Email", text: $email)
                .focused($focusedField, equals: .email)
                .textContentType(.emailAddress)
                .submitLabel(.next)
                .onSubmit { focusedField = .password }
            SecureField("Password", text: $password)
                .focused($focusedField, equals: .password)
                .textContentType(.password)
                .submitLabel(.done)
                .onSubmit { login() }
        }
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Button("Previous") {
                    focusedField = (focusedField == .password) ? .email : nil
                }
                Button("Next") {
                    focusedField = (focusedField == .email) ? .password : nil
                }
                Spacer()
                Button("Done") { focusedField = nil }
            }
        }
    }
}
```

---

## 6. Sheets and Modals

### Prefer `sheet(item:)` Over `sheet(isPresented:)` for Optional Data

When presenting a sheet that displays an optional value, use `sheet(item:)` to safely unwrap:

```swift
// Good — item is safely unwrapped, no force-unwrap needed
.sheet(item: $selectedItem) { item in
    ItemDetailView(item: item)
}

// Shorthand when the view's init matches the closure signature:
.sheet(item: $selectedItem, content: ItemDetailView.init)
```

### Sheet Customization

```swift
.sheet(isPresented: $showSheet) {
    SheetContent()
        .presentationDetents([.medium, .large, .height(200), .fraction(0.75)])
        .presentationDragIndicator(.visible)
        .presentationCornerRadius(24)
        .presentationBackgroundInteraction(.enabled(upThrough: .medium))
        .interactiveDismissDisabled(hasUnsavedChanges)
}
```

### Confirmation Dialog

```swift
.confirmationDialog("Delete Account", isPresented: $showConfirmation, titleVisibility: .visible) {
    Button("Delete", role: .destructive) { deleteAccount() }
    Button("Cancel", role: .cancel) { }
} message: {
    Text("This action cannot be undone.")
}
```

---

## 7. Search

### Searchable with Scopes

```swift
NavigationStack {
    List(filteredItems) { item in
        ItemRow(item: item)
    }
    .navigationTitle("Library")
    .searchable(
        text: $searchText,
        isPresented: $isSearching,
        placement: .navigationBarDrawer(displayMode: .always)
    )
    .searchScopes($searchScope) {
        ForEach(SearchScope.allCases, id: \.self) { scope in
            Text(scope.rawValue.capitalized).tag(scope)
        }
    }
    .searchSuggestions {
        ForEach(suggestions, id: \.self) { suggestion in
            Text(suggestion).searchCompletion(suggestion)
        }
    }
}
```

### Empty Search Results

`ContentUnavailableView.search` auto-includes the search term — no need to pass it manually:

```swift
// Good — automatically shows "No results for 'query'"
if filteredItems.isEmpty && !searchText.isEmpty {
    ContentUnavailableView.search
}
```

---

## 8. Loading and Progress

### Skeleton Loading

```swift
struct SkeletonRow: View {
    @State private var isAnimating = false

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(.gray.opacity(0.3))
                .frame(width: 44, height: 44)
            VStack(alignment: .leading, spacing: 8) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(.gray.opacity(0.3))
                    .frame(height: 14)
                    .frame(maxWidth: 200)
                RoundedRectangle(cornerRadius: 4)
                    .fill(.gray.opacity(0.2))
                    .frame(height: 12)
                    .frame(maxWidth: 150)
            }
        }
        .opacity(isAnimating ? 0.5 : 1.0)
        .animation(.easeInOut(duration: 0.8).repeatForever(), value: isAnimating)
        .onAppear { isAnimating = true }
    }
}
```

### Async Content

```swift
struct AsyncContentView<T, Content: View>: View {
    @State private var data: T?
    @State private var isLoading = true
    @State private var error: Error?
    let loader: () async throws -> T
    @ViewBuilder let content: (T) -> Content

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading...")
            } else if let error {
                ContentUnavailableView {
                    Label("Failed to Load", systemImage: "exclamationmark.triangle")
                } description: {
                    Text(error.localizedDescription)
                } actions: {
                    Button("Try Again") { Task { await load() } }
                        .buttonStyle(.borderedProminent)
                }
            } else if let data {
                content(data)
            }
        }
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        error = nil
        do {
            data = try await loader()
        } catch is CancellationError {
            return  // Don't overwrite state on cancellation
        } catch {
            self.error = error
        }
        isLoading = false
    }
}
```

### AsyncImage

```swift
AsyncImage(url: imageURL) { phase in
    switch phase {
    case .empty: ProgressView()
    case .success(let image):
        image.resizable().aspectRatio(contentMode: .fill)
    case .failure:
        Image(systemName: "photo").foregroundStyle(.secondary)
    @unknown default: EmptyView()
    }
}
.frame(width: 100, height: 100)
.clipShape(RoundedRectangle(cornerRadius: 8))
```

---

## 9. Adaptive Layouts

### Size Class Adaptation

```swift
@Environment(\.horizontalSizeClass) private var sizeClass
@Environment(\.dynamicTypeSize) private var dynamicTypeSize

var body: some View {
    if dynamicTypeSize.isAccessibilitySize {
        VStack(alignment: .leading, spacing: 12) {
            leadingContent
            trailingContent
        }
    } else {
        HStack {
            leadingContent
            Spacer()
            trailingContent
        }
    }
}
```

---

## 10. Animations

### Spring Animations

```swift
withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
    isExpanded.toggle()
}
```

### Custom Transitions

```swift
extension AnyTransition {
    static var slideAndFade: AnyTransition {
        .asymmetric(
            insertion: .move(edge: .trailing).combined(with: .opacity),
            removal: .move(edge: .leading).combined(with: .opacity)
        )
    }
}
```

### Phase Animator (iOS 17+)

```swift
// Triggered animation — animates through phases each time `trigger` changes
@State private var tapped = false

Button("Tap Me") { tapped.toggle() }
    .buttonStyle(.borderedProminent)
    .phaseAnimator([false, true], trigger: tapped) { content, phase in
        content.scaleEffect(phase ? 1.05 : 1.0)
    } animation: { _ in
        .easeInOut(duration: 0.5)
    }
```

### Chaining Animations

Chain animations via `withAnimation` completion, not delays:

```swift
Button("Animate") {
    withAnimation {
        scale = 2
    } completion: {
        withAnimation {
            scale = 1
        }
    }
}
```

### Zoom Transition (iOS 18+)

```swift
struct ZoomTransitionExample: View {
    @Namespace private var namespace
    let items: [Item]

    var body: some View {
        NavigationStack {
            List(items) { item in
                NavigationLink(value: item) {
                    ItemRow(item: item)
                        .matchedTransitionSource(id: item.id, in: namespace)
                }
            }
            .navigationDestination(for: Item.self) { item in
                ItemDetailView(item: item)
                    .navigationTransition(.zoom(sourceID: item.id, in: namespace))
            }
        }
    }
}
```

---

## 11. Gestures

### Drag Gesture

```swift
struct DraggableCard: View {
    @State private var offset = CGSize.zero
    @State private var isDragging = false

    var body: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(.blue)
            .frame(width: 200, height: 150)
            .offset(offset)
            .scaleEffect(isDragging ? 1.05 : 1.0)
            .gesture(
                DragGesture()
                    .onChanged { value in
                        offset = value.translation
                        isDragging = true
                    }
                    .onEnded { _ in
                        withAnimation(.spring()) {
                            offset = .zero
                            isDragging = false
                        }
                    }
            )
    }
}
```

### Pinch to Zoom

```swift
Image("photo")
    .resizable()
    .aspectRatio(contentMode: .fit)
    .scaleEffect(scale)
    .gesture(
        MagnifyGesture()
            .onChanged { value in scale = lastScale * value.magnification }
            .onEnded { value in lastScale = scale }
    )
    .gesture(
        TapGesture(count: 2)
            .onEnded {
                withAnimation { scale = 1.0; lastScale = 1.0 }
            }
    )
```

---

## 12. Feedback

### Haptics

Use the SwiftUI `.sensoryFeedback()` modifier (iOS 17+):

```swift
// On a button or interactive view
Button("Complete") { completeTask() }
    .sensoryFeedback(.success, trigger: taskCompleted)

// Common feedback types: .impact, .selection, .success, .warning, .error
Toggle("Enable", isOn: $isEnabled)
    .sensoryFeedback(.selection, trigger: isEnabled)
```

### SF Symbols

```swift
// Multicolor rendering
Image(systemName: "cloud.sun.fill")
    .symbolRenderingMode(.multicolor)

// Variable value (iOS 16+)
Image(systemName: "speaker.wave.3.fill", variableValue: volume)

// Symbol effect (iOS 17+)
Image(systemName: "bell.fill")
    .symbolEffect(.bounce, value: notificationCount)
```

---

## 13. Error and Empty States

```swift
// Error
ContentUnavailableView {
    Label("Unable to Load", systemImage: "exclamationmark.triangle")
} description: {
    Text(error.localizedDescription)
} actions: {
    Button("Try Again") { Task { await retry() } }
        .buttonStyle(.borderedProminent)
}

// Empty
ContentUnavailableView {
    Label("No Photos", systemImage: "camera")
} description: {
    Text("Take your first photo to get started.")
} actions: {
    Button("Take Photo") { showCamera = true }
        .buttonStyle(.borderedProminent)
}
```
