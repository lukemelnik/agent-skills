# Help Documentation Videos

## When to use

When creating tutorial or documentation videos that explain how to use a feature. These combine screen captures with narration.

## Typical structure

1. **Intro** (3-5s) - What this video covers
2. **Steps** (varies) - Screen captures synced to narration
3. **Recap** (3-5s) - Summary or next steps

## Workflow

### 1. Write the script first

```markdown
# How to Configure Settings

## Intro
"In this video, I'll show you how to configure your account settings."

## Step 1: Open Settings
"Click the gear icon in the top right corner to open the settings panel."
[CAPTURE: settings-icon-click.png]

## Step 2: Update Profile
"Here you can update your name, email, and profile picture."
[CAPTURE: profile-section.png]

## Outro
"That's it! Your settings are now configured."
```

### 2. Capture screenshots

Use the capture workflow to get screenshots for each step.

### 3. Generate voiceover

**Current options (TBD - pick one later):**
- Manual recording
- OpenAI TTS API
- ElevenLabs API
- macOS `say` command (robotic but free)

Placeholder for TTS integration:
```typescript
// scripts/tts.ts - TBD
// Will generate audio files from script text
```

### 4. Create composition

```typescript
interface HelpVideoStep {
  narration: string;
  screenshot: string;
  durationSec: number;
}

export const HelpVideo: React.FC<{
  title: string;
  steps: HelpVideoStep[];
  audioFile?: string; // Combined voiceover
}> = ({ title, steps, audioFile }) => {
  const { fps } = useVideoConfig();

  let currentFrame = 0;

  return (
    <AbsoluteFill>
      {/* Voiceover audio */}
      {audioFile && <Audio src={staticFile(audioFile)} />}

      {/* Title card */}
      <Sequence from={0} durationInFrames={fps * 3}>
        <TitleCard title={title} />
      </Sequence>

      {/* Steps */}
      {steps.map((step, i) => {
        const from = fps * 3 + currentFrame;
        const duration = step.durationSec * fps;
        currentFrame += duration;

        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            <StepSlide
              screenshot={step.screenshot}
              caption={step.narration}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
```

## Caption display

Show captions synced to narration using `@remotion/captions`:
- Import SRT file if generated from TTS
- Or manually time captions to match audio

## Style guidelines

- Clean, minimal UI
- Highlight/callout the relevant area of screenshots
- Use consistent caption styling
- Keep pace slow enough to follow
- Add cursor indicators or arrows for clicks
