# Product Promo Videos

## When to use

When creating promotional videos for apps, features, or products. These should be cinematic and professional with varied shot types, 3D perspectives, and dynamic transitions.

## Typical structure

1. **Hook** (2-3s) - Dramatic reveal, logo animation
2. **Feature showcase** (10-20s) - Screenshots with VARIED shot types (see Shot Library below)
3. **Call to action** (2-3s) - "Try it now", link, etc.

## CRITICAL: Shot Variety

**Never use the same shot type twice in a row.** Each feature scene should use a distinct shot type from the library below. When defining features, explicitly assign a `shotType` to each:

```typescript
const FEATURES = [
  { file: "songs.png", shotType: "floating-card", ... },
  { file: "contacts.png", shotType: "full-bleed", ... },
  { file: "projects.png", shotType: "device-mockup", ... },
  { file: "releases.png", shotType: "split-screen", ... },
];
```

---

## Shot Library

### 1. Floating Card (3D Perspective)

Screenshot floats in center with 3D rotation. Good for: hero features, first impression.

```typescript
const FloatingCardShot: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
  });

  const rotateY = interpolate(progress, [0, 1], [-8, 5], {
    easing: Easing.inOut(Easing.cubic),
  });
  const rotateX = interpolate(progress, [0, 1], [3, -2], {
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ perspective: 1200, justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          width: "70%",
          height: "75%",
          borderRadius: 16,
          overflow: "hidden",
          transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
          boxShadow: "0 50px 100px rgba(0,0,0,0.5)",
        }}
      >
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </AbsoluteFill>
  );
};
```

### 2. Full Bleed (Cinematic)

Screenshot fills entire frame with text overlay. Good for: immersive moments, showing UI detail.

```typescript
const FullBleedShot: React.FC<{ src: string; title: string }> = ({ src, title }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const scale = interpolate(frame, [0, durationInFrames], [1.1, 1.25], {
    easing: Easing.inOut(Easing.quad),
  });
  const translateY = interpolate(frame, [0, durationInFrames], [-30, 30]);

  return (
    <AbsoluteFill>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translateY(${translateY}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 80,
          color: "white",
          fontSize: 64,
          fontWeight: 700,
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};
```

### 3. Device Mockup

Screenshot inside a laptop/phone frame. Good for: context, showing it's real software.

```typescript
const DeviceMockupShot: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const floatY = interpolate(frame, [0, durationInFrames], [0, -20], {
    easing: Easing.inOut(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          width: "80%",
          transform: `translateY(${floatY}px)`,
        }}
      >
        {/* Laptop bezel */}
        <div
          style={{
            background: "linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)",
            borderRadius: "20px 20px 0 0",
            padding: "12px 12px 0",
          }}
        >
          <div style={{ borderRadius: 8, overflow: "hidden" }}>
            <Img src={src} style={{ width: "100%", display: "block" }} />
          </div>
        </div>
        {/* Laptop base */}
        <div
          style={{
            background: "linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%)",
            height: 20,
            borderRadius: "0 0 8px 8px",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
```

### 4. Split Screen

Screenshot on one side, large text on the other. Good for: explaining features, balanced composition.

```typescript
const SplitScreenShot: React.FC<{ src: string; title: string; side: "left" | "right" }> = ({
  src,
  title,
  side,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({ frame, fps, config: { damping: 100 } });

  return (
    <AbsoluteFill style={{ flexDirection: "row" }}>
      {side === "left" && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <h2
            style={{
              fontSize: 72,
              color: "white",
              transform: `translateX(${interpolate(slideIn, [0, 1], [-100, 0])}px)`,
              opacity: slideIn,
            }}
          >
            {title}
          </h2>
        </div>
      )}
      <div style={{ flex: 1, padding: 40 }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 16,
            overflow: "hidden",
            transform: `translateX(${interpolate(slideIn, [0, 1], [side === "left" ? 100 : -100, 0])}px)`,
            opacity: slideIn,
          }}
        >
          <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>
      {side === "right" && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <h2
            style={{
              fontSize: 72,
              color: "white",
              transform: `translateX(${interpolate(slideIn, [0, 1], [100, 0])}px)`,
              opacity: slideIn,
            }}
          >
            {title}
          </h2>
        </div>
      )}
    </AbsoluteFill>
  );
};
```

### 5. Isometric Stack

Multiple screenshots stacked at isometric angle. Good for: showing multiple views, depth.

```typescript
const IsometricStackShot: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enterProgress = spring({ frame, fps, config: { damping: 80 } });
  const floatProgress = interpolate(frame, [0, durationInFrames], [0, 1]);

  return (
    <AbsoluteFill style={{ perspective: 1500, justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          transform: `
            rotateX(55deg) rotateZ(-45deg)
            translateY(${interpolate(floatProgress, [0, 1], [0, -30])}px)
            scale(${interpolate(enterProgress, [0, 1], [0.8, 1])})
          `,
          opacity: enterProgress,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: i === 0 ? "relative" : "absolute",
              top: i * -15,
              left: i * 15,
              width: 800,
              height: 500,
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              opacity: 1 - i * 0.3,
            }}
          >
            <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
```

### 6. Zoom Through (Fly Into Screen)

Camera flies into the screenshot. Good for: transitions, dramatic reveals.

```typescript
const ZoomThroughShot: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
  });

  const scale = interpolate(progress, [0, 0.5, 1], [0.6, 1, 2.5]);
  const opacity = interpolate(progress, [0.7, 1], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          width: "80%",
          height: "80%",
          borderRadius: 20,
          overflow: "hidden",
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </AbsoluteFill>
  );
};
```

### 7. Spotlight/Vignette

Dark scene with screenshot dramatically lit. Good for: focus, premium feel.

```typescript
const SpotlightShot: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const spotlightX = interpolate(frame, [0, durationInFrames], [30, 70]);
  const spotlightY = interpolate(frame, [0, durationInFrames], [30, 50]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at ${spotlightX}% ${spotlightY}%, transparent 0%, rgba(0,0,0,0.85) 70%)`,
          zIndex: 2,
        }}
      />
      <div style={{ padding: 80 }}>
        <div style={{ borderRadius: 16, overflow: "hidden" }}>
          <Img src={src} style={{ width: "100%", display: "block" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

### 8. Parallax Layers

UI elements floating at different depths. Good for: modern feel, showing UI components.

```typescript
const ParallaxShot: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1]);

  // Different movement speeds for parallax effect
  const bgMove = interpolate(progress, [0, 1], [0, 30]);
  const fgMove = interpolate(progress, [0, 1], [0, 80]);

  return (
    <AbsoluteFill>
      {/* Background layer - moves slow */}
      <div
        style={{
          position: "absolute",
          inset: -50,
          transform: `translateX(${bgMove}px)`,
          filter: "blur(3px)",
          opacity: 0.5,
        }}
      >
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* Foreground card - moves faster */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "10%",
          width: "60%",
          height: "70%",
          transform: `translateX(${fgMove}px)`,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        }}
      >
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </AbsoluteFill>
  );
};
```

### 9. Minimal/Editorial

Small centered screenshot with lots of breathing room. Good for: elegance, premium products.

```typescript
const MinimalShot: React.FC<{ src: string; caption: string }> = ({ src, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0a0a0a",
      }}
    >
      <div style={{ textAlign: "center", opacity: fadeIn }}>
        <div
          style={{
            width: 900,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            transform: `translateY(${interpolate(fadeIn, [0, 1], [30, 0])}px)`,
          }}
        >
          <Img src={src} style={{ width: "100%", display: "block" }} />
        </div>
        <p
          style={{
            marginTop: 40,
            fontSize: 24,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          {caption}
        </p>
      </div>
    </AbsoluteFill>
  );
};
```

### 10. Over-the-Shoulder

Angled as if viewing someone's screen. Good for: context, relatability.

```typescript
const OverShoulderShot: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const panX = interpolate(frame, [0, durationInFrames], [-5, 5]);

  return (
    <AbsoluteFill style={{ perspective: 1000 }}>
      <div
        style={{
          position: "absolute",
          top: "5%",
          left: "15%",
          width: "85%",
          height: "90%",
          transform: `rotateY(-25deg) rotateX(5deg) translateX(${panX}px)`,
          transformOrigin: "right center",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "-30px 30px 80px rgba(0,0,0,0.5)",
        }}
      >
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </AbsoluteFill>
  );
};
```

---

## Shot Selection Strategy

When creating a promo with 4+ features, use this pattern for variety:

```typescript
const SHOT_ROTATION = [
  "floating-card",   // Opening - establishes the product
  "full-bleed",      // Immersive - draws them in
  "split-screen",    // Explanatory - pairs with copy
  "device-mockup",   // Context - shows it's real
  "minimal",         // Breathing room - elegant pause
  "over-shoulder",   // Relatable - human perspective
  "isometric",       // Technical - shows depth
  "spotlight",       // Focus - highlights key feature
];

// Assign shot types to features
const featuresWithShots = FEATURES.map((feature, i) => ({
  ...feature,
  shotType: SHOT_ROTATION[i % SHOT_ROTATION.length],
}));
```

---

## Critical Remotion Rules

### All animations MUST use `useCurrentFrame()`

CSS transitions/animations are **FORBIDDEN** - they won't render correctly.
Tailwind animation classes are **FORBIDDEN**.

```typescript
const frame = useCurrentFrame();
const { fps } = useVideoConfig();

const opacity = interpolate(frame, [0, 2 * fps], [0, 1], {
  extrapolateRight: "clamp",
});
```

### Express durations in seconds × fps

```typescript
const { fps, durationInFrames } = useVideoConfig();
const introFrames = 3 * fps; // 3 seconds
```

### Use recommended spring configs

```typescript
const SPRING_SMOOTH = { damping: 200 };      // Smooth, no bounce
const SPRING_SNAPPY = { damping: 20, stiffness: 200 }; // Snappy UI
const SPRING_BOUNCY = { damping: 8 };        // Playful bounce
```

### Always clamp interpolations

```typescript
const scale = interpolate(progress, [0, 1], [0.8, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

---

## Scene Transitions

Use `@remotion/transitions` for professional transitions:

```typescript
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={introDuration}>
    <IntroScene />
  </TransitionSeries.Sequence>

  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 12 })}
  />

  <TransitionSeries.Sequence durationInFrames={featureDuration}>
    <FeatureScene />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

Available transitions: `fade`, `slide`, `wipe`, `flip`, `clockWipe`

---

## Visual Polish Checklist

- [ ] Vignette (darkened edges) on each scene
- [ ] Reflection effect on floating elements
- [ ] Staggered text animation (word by word)
- [ ] Animated gradient background
- [ ] Box shadows for depth
- [ ] Subtle glow effects on CTA

---

## Rendering Configuration

For 3D/WebGL content, add to `remotion.config.ts`:

```typescript
import { Config } from "@remotion/cli/config";

Config.setChromiumOpenGlRenderer("angle");
```

---

## Recommended Dimensions

| Platform | Dimensions | Aspect |
|----------|------------|--------|
| YouTube | 1920x1080 | 16:9 |
| Instagram Feed | 1080x1080 | 1:1 |
| Instagram Reels/TikTok | 1080x1920 | 9:16 |
| Twitter | 1280x720 | 16:9 |
