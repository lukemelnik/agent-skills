# Swift Charts

## Table of Contents

1. [Chart Container and Mark Types](#1-chart-container-and-mark-types)
2. [Data Modeling](#2-data-modeling)
3. [Styling](#3-styling)
4. [Axes Customization](#4-axes-customization)
5. [Scales](#5-scales)
6. [Interaction](#6-interaction)
7. [Annotations](#7-annotations)
8. [Accessibility](#8-accessibility)
9. [Common Patterns](#9-common-patterns)

---

## 1. Chart Container and Mark Types

### Basic Chart Container

```swift
import Charts

Chart {
    // One or more mark types go here
    BarMark(
        x: .value("Month", item.month),
        y: .value("Sales", item.sales)
    )
}
```

### BarMark — Vertical, Horizontal, Stacked, Grouped

```swift
// Vertical bar
Chart(data) { item in
    BarMark(
        x: .value("Category", item.category),
        y: .value("Value", item.value)
    )
}

// Horizontal bar — swap x and y
Chart(data) { item in
    BarMark(
        x: .value("Value", item.value),
        y: .value("Category", item.category)
    )
}

// Stacked — use foregroundStyle to split by series (default stacking)
Chart(data) { item in
    BarMark(
        x: .value("Month", item.month),
        y: .value("Sales", item.sales)
    )
    .foregroundStyle(by: .value("Product", item.product))
}

// Grouped — add .position(by:) to place bars side by side
Chart(data) { item in
    BarMark(
        x: .value("Month", item.month),
        y: .value("Sales", item.sales),
        width: .ratio(0.8)
    )
    .foregroundStyle(by: .value("Product", item.product))
    .position(by: .value("Product", item.product))
}
```

### LineMark — Single, Multi-Series, Curved

```swift
// Single series
Chart(data) { item in
    LineMark(
        x: .value("Date", item.date),
        y: .value("Price", item.price)
    )
}

// Multi-series — foregroundStyle splits into separate lines
Chart(data) { item in
    LineMark(
        x: .value("Date", item.date),
        y: .value("Price", item.price)
    )
    .foregroundStyle(by: .value("Symbol", item.symbol))
}

// Curved interpolation
Chart(data) { item in
    LineMark(
        x: .value("Date", item.date),
        y: .value("Value", item.value)
    )
    .interpolationMethod(.catmullRom)
}
// Other methods: .cardinal, .monotone, .stepStart, .stepCenter, .stepEnd
```

### PointMark — Scatter Plots

```swift
Chart(data) { item in
    PointMark(
        x: .value("Weight", item.weight),
        y: .value("Height", item.height)
    )
    .foregroundStyle(by: .value("Gender", item.gender))
    .symbolSize(item.age * 5)
}
```

### AreaMark — Area Charts, Stacked Areas

```swift
// Simple area
Chart(data) { item in
    AreaMark(
        x: .value("Date", item.date),
        y: .value("Value", item.value)
    )
    .foregroundStyle(.blue.opacity(0.3))
}

// Stacked area
Chart(data) { item in
    AreaMark(
        x: .value("Date", item.date),
        y: .value("Value", item.value)
    )
    .foregroundStyle(by: .value("Category", item.category))
}

// Range area (band between two values)
Chart(data) { item in
    AreaMark(
        x: .value("Date", item.date),
        yStart: .value("Low", item.low),
        yEnd: .value("High", item.high)
    )
    .opacity(0.3)
}
```

### RuleMark — Reference Lines, Thresholds, Ranges

```swift
// Horizontal threshold line
Chart {
    ForEach(data) { item in
        BarMark(x: .value("Day", item.day), y: .value("Steps", item.steps))
    }
    RuleMark(y: .value("Goal", 10_000))
        .foregroundStyle(.red)
        .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
        .annotation(position: .top, alignment: .leading) {
            Text("Goal").font(.caption).foregroundStyle(.red)
        }
}

// Vertical reference line
RuleMark(x: .value("Today", Date.now))

// Range band
RuleMark(yStart: .value("Low", 60), yEnd: .value("High", 80))
    .foregroundStyle(.green.opacity(0.2))
```

### RectangleMark — Heat Maps

```swift
Chart(data) { item in
    RectangleMark(
        x: .value("Hour", item.hour),
        y: .value("Day", item.day)
    )
    .foregroundStyle(by: .value("Count", item.count))
}
.chartForegroundStyleScale(range: Gradient(colors: [.blue, .green, .yellow, .red]))
```

### SectorMark — Pie and Donut Charts (iOS 17+)

```swift
// Pie chart
Chart(data) { item in
    SectorMark(
        angle: .value("Amount", item.amount)
    )
    .foregroundStyle(by: .value("Category", item.category))
}

// Donut chart — add innerRadius
Chart(data) { item in
    SectorMark(
        angle: .value("Amount", item.amount),
        innerRadius: .ratio(0.618),
        angularInset: 1.5
    )
    .cornerRadius(4)
    .foregroundStyle(by: .value("Category", item.category))
}
```

### Combining Marks

```swift
// Line + Point (data points visible on line)
Chart(data) { item in
    LineMark(x: .value("Date", item.date), y: .value("Value", item.value))
    PointMark(x: .value("Date", item.date), y: .value("Value", item.value))
}

// Line + Area (filled area under line)
Chart(data) { item in
    AreaMark(x: .value("Date", item.date), y: .value("Value", item.value))
        .foregroundStyle(.blue.opacity(0.1))
    LineMark(x: .value("Date", item.date), y: .value("Value", item.value))
}

// Bar + Rule (bar chart with threshold)
Chart {
    ForEach(data) { item in
        BarMark(x: .value("Day", item.day), y: .value("Value", item.value))
    }
    RuleMark(y: .value("Average", average))
        .foregroundStyle(.orange)
}
```

---

## 2. Data Modeling

### Plottable Protocol for Custom Types

Conform custom types to `Plottable` so they can be used directly as chart values:

```swift
enum Priority: String, Plottable, CaseIterable {
    case low, medium, high

    var primitivePlottable: String { rawValue.capitalized }
}

// Now usable directly in .value()
BarMark(x: .value("Priority", item.priority), y: .value("Count", item.count))
```

### ForEach Inside Chart

```swift
Chart {
    ForEach(series) { s in
        ForEach(s.data) { item in
            LineMark(
                x: .value("Date", item.date),
                y: .value("Value", item.value)
            )
            .foregroundStyle(by: .value("Series", s.name))
        }
    }
}
```

### Date-Based Data

```swift
struct DailyMetric: Identifiable {
    let id = UUID()
    let date: Date
    let value: Double
}

Chart(metrics) { metric in
    LineMark(
        x: .value("Date", metric.date, unit: .day),
        y: .value("Value", metric.value)
    )
}
// The `unit:` parameter tells Charts how to group/bin date values
// Common units: .hour, .day, .weekOfYear, .month
```

---

## 3. Styling

### Automatic Color by Category

```swift
.foregroundStyle(by: .value("Category", item.category))
```

### Different Symbols per Series

```swift
LineMark(x: .value("Date", item.date), y: .value("Value", item.value))
    .symbol(by: .value("Series", item.series))
```

### Line Style

```swift
LineMark(...)
    .lineStyle(StrokeStyle(lineWidth: 2, dash: [5, 3]))
```

### Grouped vs Stacked Bars

```swift
// Stacked (default) — just use foregroundStyle(by:)
// Grouped — add .position(by:)
.position(by: .value("Category", item.category))
```

### Corner Radius on Bars

```swift
BarMark(...)
    .cornerRadius(6)
```

### Custom Color Scale

```swift
Chart { ... }
    .chartForegroundStyleScale([
        "Revenue": .blue,
        "Expenses": .red,
        "Profit": .green
    ])
```

### Gradient Fill

```swift
AreaMark(...)
    .foregroundStyle(
        .linearGradient(
            colors: [.blue.opacity(0.4), .blue.opacity(0.0)],
            startPoint: .top,
            endPoint: .bottom
        )
    )
```

---

## 4. Axes Customization

### Custom Axis Marks

```swift
Chart { ... }
    .chartXAxis {
        AxisMarks(values: .stride(by: .month)) { value in
            AxisGridLine()
            AxisTick()
            AxisValueLabel(format: .dateTime.month(.abbreviated))
        }
    }
    .chartYAxis {
        AxisMarks(position: .leading) { value in
            AxisGridLine()
            AxisValueLabel {
                if let intValue = value.as(Int.self) {
                    Text("\(intValue)k")
                }
            }
        }
    }
```

### Date-Based Axes with Stride

```swift
.chartXAxis {
    AxisMarks(values: .stride(by: .day)) { _ in
        AxisGridLine()
        AxisValueLabel(format: .dateTime.weekday(.abbreviated), centered: true)
    }
}
// Common strides: .hour, .day, .weekOfYear, .month, .year
```

### Hidden Axes

```swift
.chartXAxis(.hidden)
.chartYAxis(.hidden)

// Hidden axes are useful for sparklines and compact dashboard cards
```

### Axis Label Formatting

```swift
// Currency
AxisValueLabel(format: .currency(code: "USD"))

// Percent
AxisValueLabel(format: .percent)

// Custom
AxisValueLabel {
    if let val = value.as(Double.self) {
        Text("\(val, specifier: "%.1f") mi")
    }
}
```

---

## 5. Scales

### Fixed Domain

```swift
// Fixed X range (dates)
.chartXScale(domain: startDate...endDate)

// Fixed Y range
.chartYScale(domain: 0...100)
```

### Logarithmic Scale

```swift
.chartYScale(type: .log)
```

### Custom Color Scale with Domain

```swift
.chartForegroundStyleScale(domain: ["Low", "Medium", "High"], range: [.green, .yellow, .red])
```

---

## 6. Interaction

### Tap/Hover Selection (iOS 17+)

```swift
struct InteractiveChart: View {
    @State private var selectedDate: Date?

    var body: some View {
        Chart(data) { item in
            LineMark(
                x: .value("Date", item.date),
                y: .value("Value", item.value)
            )
            if let selectedDate,
               let selected = data.first(where: { Calendar.current.isDate($0.date, inSameDayAs: selectedDate) }) {
                RuleMark(x: .value("Selected", selected.date))
                    .foregroundStyle(.gray.opacity(0.3))
                    .annotation(position: .top) {
                        Text("\(selected.value, specifier: "%.0f")")
                            .font(.caption)
                            .padding(4)
                            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 4))
                    }
                PointMark(
                    x: .value("Date", selected.date),
                    y: .value("Value", selected.value)
                )
                .symbolSize(60)
            }
        }
        .chartXSelection(value: $selectedDate)
    }
}
```

### Custom Gesture Handling with chartOverlay

```swift
Chart(data) { item in
    LineMark(x: .value("Date", item.date), y: .value("Value", item.value))
}
.chartOverlay { proxy in
    GeometryReader { geometry in
        Rectangle().fill(.clear).contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { value in
                        let origin = geometry[proxy.plotFrame!].origin
                        let x = value.location.x - origin.x
                        if let date: Date = proxy.value(atX: x) {
                            selectedDate = date
                        }
                    }
                    .onEnded { _ in selectedDate = nil }
            )
    }
}
```

### Scrollable Charts (iOS 17+)

```swift
Chart(data) { item in
    BarMark(x: .value("Date", item.date, unit: .day), y: .value("Value", item.value))
}
.chartScrollableAxes(.horizontal)
.chartXVisibleDomain(length: 3600 * 24 * 30) // 30 days visible
.chartScrollPosition(x: $scrollPosition)      // bind scroll position
```

---

## 7. Annotations

### Labels on Marks

```swift
BarMark(x: .value("Category", item.category), y: .value("Value", item.value))
    .annotation(position: .top) {
        Text("\(item.value, specifier: "%.0f")")
            .font(.caption2)
            .foregroundStyle(.secondary)
    }
```

### Position Options

- `.top`, `.bottom`, `.leading`, `.trailing` — outside the mark
- `.overlay` — centered on the mark
- `.automatic` — system chooses based on available space

### Match Annotation Colors to Mark

```swift
Chart { ... }
    .alignsMarkStylesWithPlottedValues
// annotation foregroundStyle will match the mark's series color
```

---

## 8. Accessibility

- **Automatic audio graphs**: Charts provides VoiceOver audio graph support out of the box. Users can hear data trends via the Audio Graph rotor action — no code needed.
- **Custom labels on marks**:

```swift
BarMark(...)
    .accessibilityLabel("\(item.category)")
    .accessibilityValue("\(item.value) units")
```

- **Chart descriptor** for custom VoiceOver summaries:

```swift
Chart { ... }
    .accessibilityChartDescriptor(self)

// Conform to AccessibilityChartDescriptor
extension MyView: AccessibilityChartDescriptor {
    func makeChartDescriptor() -> AXChartDescriptor {
        let xAxis = AXNumericDataAxisDescriptor(title: "Month", range: 1...12, gridlinePositions: []) { "Month \(Int($0))" }
        let yAxis = AXNumericDataAxisDescriptor(title: "Sales", range: 0...1000, gridlinePositions: []) { "\(Int($0)) units" }
        let series = AXDataSeriesDescriptor(name: "Sales", isContinuous: true, dataPoints: data.map {
            .init(x: Double($0.month), y: $0.sales)
        })
        return AXChartDescriptor(title: "Monthly Sales", summary: nil, xAxis: xAxis, yAxis: yAxis, additionalAxes: [], series: [series])
    }
}
```

---

## 9. Common Patterns

### Dashboard Card with Sparkline

```swift
struct SparklineCard: View {
    let title: String
    let value: String
    let data: [DataPoint]

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title2.bold())
            Chart(data) { point in
                LineMark(x: .value("Time", point.date), y: .value("Value", point.value))
                    .interpolationMethod(.catmullRom)
                AreaMark(x: .value("Time", point.date), y: .value("Value", point.value))
                    .foregroundStyle(.blue.opacity(0.1))
                    .interpolationMethod(.catmullRom)
            }
            .chartXAxis(.hidden)
            .chartYAxis(.hidden)
            .frame(height: 50)
        }
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
    }
}
```

### Bar Chart with Threshold Line

```swift
struct StepsChart: View {
    let steps: [DailySteps]
    let goal: Int

    var body: some View {
        Chart {
            ForEach(steps) { day in
                BarMark(
                    x: .value("Day", day.date, unit: .day),
                    y: .value("Steps", day.count)
                )
                .foregroundStyle(day.count >= goal ? .green : .blue)
                .cornerRadius(4)
            }
            RuleMark(y: .value("Goal", goal))
                .foregroundStyle(.orange)
                .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                .annotation(position: .top, alignment: .trailing) {
                    Text("Goal: \(goal)")
                        .font(.caption)
                        .foregroundStyle(.orange)
                }
        }
        .chartYAxis {
            AxisMarks(position: .leading)
        }
    }
}
```

### Multi-Series Line Chart with Legend

```swift
struct MultiLineChart: View {
    let series: [Series]  // each has name: String, points: [DataPoint]

    var body: some View {
        Chart {
            ForEach(series) { s in
                ForEach(s.points) { point in
                    LineMark(
                        x: .value("Date", point.date),
                        y: .value("Value", point.value)
                    )
                    .foregroundStyle(by: .value("Series", s.name))
                    .symbol(by: .value("Series", s.name))
                }
            }
        }
        .chartForegroundStyleScale([
            "Revenue": .blue,
            "Costs": .red,
            "Profit": .green
        ])
        .chartLegend(position: .bottom, alignment: .center)
        .chartYAxis {
            AxisMarks(position: .leading) { value in
                AxisGridLine()
                AxisValueLabel(format: .currency(code: "USD").precision(.fractionLength(0)))
            }
        }
    }
}
```

### Pie/Donut Chart with Labels (iOS 17+)

```swift
struct DonutChart: View {
    let slices: [CategoryAmount]

    var body: some View {
        Chart(slices) { slice in
            SectorMark(
                angle: .value("Amount", slice.amount),
                innerRadius: .ratio(0.618),
                angularInset: 1.5
            )
            .cornerRadius(4)
            .foregroundStyle(by: .value("Category", slice.category))
            .annotation(position: .overlay) {
                Text("\(slice.amount, specifier: "%.0f")")
                    .font(.caption2.bold())
                    .foregroundStyle(.white)
            }
        }
        .chartLegend(position: .bottom)
        .frame(height: 250)
    }
}
```

### Real-Time Updating Chart

```swift
struct LiveChart: View {
    @State private var readings: [SensorReading] = []
    let maxPoints = 60

    var body: some View {
        Chart(readings) { reading in
            LineMark(
                x: .value("Time", reading.timestamp),
                y: .value("Value", reading.value)
            )
            .interpolationMethod(.monotone)
        }
        .chartXScale(domain: xDomain)
        .chartYScale(domain: 0...100)
        .chartXAxis {
            AxisMarks(values: .stride(by: .second, count: 10)) { _ in
                AxisGridLine()
                AxisValueLabel(format: .dateTime.hour().minute().second())
            }
        }
        .task {
            for await reading in SensorService.stream() {
                withAnimation(.easeInOut(duration: 0.3)) {
                    readings.append(reading)
                    if readings.count > maxPoints {
                        readings.removeFirst()
                    }
                }
            }
        }
    }

    private var xDomain: ClosedRange<Date> {
        let now = Date.now
        return now.addingTimeInterval(-60)...now
    }
}
```
