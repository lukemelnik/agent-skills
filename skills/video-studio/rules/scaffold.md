# Scaffolding Remotion in a Project

## When to use

When the user wants to set up video creation capabilities in an existing project.

## Steps

1. **Create the remotion folder structure:**

```bash
mkdir -p remotion/public/captures remotion/public/music remotion/src/compositions remotion/src/components remotion/scripts
```

2. **Initialize pnpm and install dependencies:**

```bash
cd remotion
pnpm init
pnpm add remotion @remotion/cli @remotion/media @remotion/media-utils @remotion/captions @remotion/three @remotion/transitions @react-three/fiber three zod
pnpm add -D typescript @types/react @types/react-dom @types/three
```

3. **Create tsconfig.json:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src/**/*", "remotion.config.ts"]
}
```

4. **Create remotion.config.ts:**

```typescript
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer("angle"); // Required for Three.js rendering
```

5. **Create src/index.ts:**

```typescript
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
```

6. **Create src/Root.tsx:**

```typescript
import { Composition, Folder } from "remotion";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Videos">
        {/* Compositions will be added here */}
      </Folder>
    </>
  );
};
```

7. **Add scripts to package.json:**

```json
{
  "scripts": {
    "studio": "remotion studio",
    "render": "remotion render",
    "build": "remotion bundle"
  }
}
```

8. **Update parent project's .gitignore:**

Add `/remotion` to the project root's `.gitignore`.

## Folder structure

```
remotion/
├── public/
│   ├── captures/     ← screenshots from app
│   └── music/        ← background music files
├── src/
│   ├── components/   ← reusable 3D components
│   ├── compositions/ ← video compositions
│   ├── index.ts
│   └── Root.tsx
├── package.json
├── remotion.config.ts
└── tsconfig.json
```

## Verification

```bash
cd remotion
pnpm run studio
```

Should open at http://localhost:3000 (or next available port).
