# Async Streams

## Prefer `makeStream(of:)` factory

The modern way to create an `AsyncStream` is the static factory method. It returns both the stream and its continuation as a tuple, avoiding closure-based capture awkwardness.

```swift
// Old: Closure-based, awkward to store the continuation
var continuation: AsyncStream<Event>.Continuation?
let stream = AsyncStream<Event> { cont in
    continuation = cont
}

// New: Clean, no closure capture needed
let (stream, continuation) = AsyncStream.makeStream(of: Event.self)
```

This also works with `AsyncThrowingStream.makeStream(of:throwing:)`.


## Continuation lifecycle

A continuation must be finished exactly once.

- Failing to finish it causes the consumer's `for await` loop to hang indefinitely.
- Finishing it twice is a programmer error (`AsyncStream.Continuation` tolerates it, but `CheckedContinuation` does not).

Always finish in cleanup paths:

```swift
let (stream, continuation) = AsyncStream.makeStream(of: Event.self)

let monitor = NetworkMonitor()

monitor.onEvent = { event in
    continuation.yield(event)
}

monitor.onComplete = {
    continuation.finish()
}

continuation.onTermination = { _ in
    monitor.stop()
}
```

The `onTermination` handler runs when the consumer's `for await` loop ends or the task is cancelled — use it to clean up the underlying resource.


## Buffering and back pressure

`AsyncStream` defaults to unlimited buffer size. For high-throughput producers, this causes unbounded memory growth. Specify a buffering policy:

```swift
let (stream, continuation) = AsyncStream.makeStream(
    of: SensorReading.self,
    bufferingPolicy: .bufferingNewest(100)
)
```

| Policy | Behavior |
|--------|----------|
| `.bufferingNewest(n)` | Keeps the most recent `n` elements, drops older ones |
| `.bufferingOldest(n)` | Keeps the first `n` elements, drops newer ones |
| `.unbounded` | Default — use only when the consumer keeps up |


## `for await` and cancellation

A `for await` loop automatically stops when the task is cancelled or the stream finishes. You do not need to manually check cancellation inside the loop. Code after the loop does run, so handle cleanup there if needed.


## Wrapping delegates with AsyncStream

For delegate patterns that deliver multiple values over time, use `AsyncStream`. Store the continuation as a property so delegate callbacks can yield into it.

```swift
class LocationTracker: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private var continuation: AsyncStream<CLLocation>.Continuation?

    var locations: AsyncStream<CLLocation> {
        let (stream, continuation) = AsyncStream.makeStream(of: CLLocation.self)
        self.continuation = continuation
        manager.delegate = self
        manager.startUpdatingLocation()

        continuation.onTermination = { [weak self] _ in
            self?.manager.stopUpdatingLocation()
        }

        return stream
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        for location in locations {
            continuation?.yield(location)
        }
    }
}
```

This pattern supports a single consumer. For multiple consumers, broadcast through an `@Observable` class instead.

Single-shot delegates (one callback, then done) should use `withCheckedContinuation` instead of `AsyncStream`.
