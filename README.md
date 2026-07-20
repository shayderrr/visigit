# VisiGit

A desktop git repository visualizer with AI-powered commit summaries. Built with Electron, React, and TypeScript.

![VisiGit](https://github.com/shayderrr/visigit/blob/main/screenshot.png?raw=true)

## Features

- **Commit Graph** — interactive SVG graph with drag-to-pan and branch filtering
- **Timeline View** — commit history with per-commit AI summaries
- **Contribution Heatmap** — GitHub-style activity map
- **Code Frequency** — additions/deletions over time (Recharts)
- **Contributor Stats** — bar charts with hover details
- **File Browser** — recursive tree with last-commit info per file
- **Branch Switching** — select any branch to re-fetch all data
- **AI Summaries** — powered by NVIDIA NIM API (user-provided key)
- **GitHub URL Support** — paste any public GitHub URL; auto-clones to a temp directory
- **Local Repository Support** — open any local `.git` folder via file picker
- **Snowy Black Theme** — snowy particle animation, dark UI, font-light throughout

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Git](https://git-scm.com/) (must be in your PATH)
- npm (comes with Node.js)

## Getting Started

### Install from npm

```bash
npm install -g visigit
visigit
```

This installs VisiGit globally and adds the `visigit` command to your PATH.

### Clone and install (development)

```bash
git clone https://github.com/shayderrr/visigit.git
cd visigit
npm install
```

### Run in development

```bash
npm run dev
```

This starts the Vite dev server with hot-reload. The Electron window opens automatically.

## Building Distributables

Electron Builder creates platform-specific installers. The default `npm run package` builds for your current OS and architecture.

### Build for current platform

```bash
npm run package
```

Output appears in the `release/` directory.

### Build for a specific platform

| Platform | Architecture | Command |
|----------|-------------|---------|
| macOS | Apple Silicon (arm64) | `npm run package:mac:arm` |
| macOS | Intel (x64) | `npm run package:mac:x64` |
| macOS | Both | `npm run package:mac` |
| Windows | x64 | `npm run package:win:x64` |
| Windows | ARM64 | `npm run package:win:arm` |
| Windows | Both | `npm run package:win` |
| Linux | x64 | `npm run package:linux:x64` |
| Linux | ARM64 | `npm run package:linux:arm` |
| Linux | Both | `npm run package:linux` |

### Output formats

| Platform | Format | Description |
|----------|--------|-------------|
| macOS | `.dmg` | Drag-and-drop installer for macOS |
| Windows | `.exe` (NSIS) | Installer with customizable install directory |
| Linux | `.AppImage` | Portable, runs on most distros without installation |
| Linux | `.deb` | Debian/Ubuntu package |

### Cross-compilation notes

Building for a different architecture on the same machine works for some targets but not all. For best results, build each platform on its native OS:

- **macOS builds**: Run on macOS (builds both arm64 and x64 natively)
- **Windows builds**: Run on Windows or use CI (GitHub Actions recommended)
- **Linux builds**: Run on Linux or use CI

If you need to cross-compile macOS arm64 on an Intel Mac (or vice versa), you may need to install the additional target:

```bash
# On macOS, to build for the other arch:
brew install filosottile/musl-cross/musl-cross  # optional, for Linux cross-builds
```

## AI Summaries (NVIDIA NIM)

VisiGit uses the [NVIDIA NIM API](https://build.nvidia.com/) for AI-powered commit and repository summaries.

### Setup

1. Create a free account at [build.nvidia.com](https://build.nvidia.com/)
2. Click **Get API Key** to generate a key (starts with `nvapi-`)
3. In VisiGit, click the **gear icon** in the top-right toolbar
4. Paste your API key and click **Save Key**

The key is stored in memory for the current session. You will need to re-enter it each time you restart the app.

### Free tier

- 5,000 inference credits/day (1 credit ≈ 1 API call)
- 40 requests per minute rate limit
- No credit card required
- Model: `z-ai/glm-5.2`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Electron 35 |
| Build | electron-vite 3, Vite 6 |
| UI | React 19, TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts 2 |
| Heatmap | @uiw/react-heat-map |
| Git | simple-git 3 |
| Packaging | electron-builder 26 |

## Project Structure

```
visigit/
├── bin/
│   └── visigit.js            # npm global launcher script
├── src/
│   ├── main/                  # Electron main process
│   │   ├── index.ts           # IPC handlers, window management, clone logic
│   │   └── git-service.ts     # Local git operations via simple-git
│   ├── preload/
│   │   ├── index.ts           # Context bridge (electronAPI)
│   │   └── index.d.ts         # TypeScript declarations
│   └── renderer/              # React app
│       ├── index.html
│       └── src/
│           ├── App.tsx
│           ├── main.tsx
│           ├── types.ts
│           ├── components/
│           │   ├── Dashboard.tsx
│           │   ├── DropZone.tsx
│           │   ├── Sidebar.tsx
│           │   ├── CommitGraph.tsx
│           │   ├── CommitTimeline.tsx
│           │   ├── ContributionHeatmap.tsx
│           │   ├── CodeFrequencyChart.tsx
│           │   ├── ContributorStats.tsx
│           │   ├── FileBrowser.tsx
│           │   ├── SummaryPanel.tsx
│           │   ├── SettingsModal.tsx
│           │   ├── StatsBar.tsx
│           │   ├── LoadingScreen.tsx
│           │   └── SnowBackground.tsx
│           ├── hooks/
│           │   ├── useGitData.ts
│           │   └── useAiSummary.ts
│           └── styles/
│               └── globals.css
├── logo.png                   # App icon
├── package.json
├── electron.vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
└── tsconfig.web.json
```

## Publishing a Release

### Option 1: GitHub Releases (recommended)

1. Tag a release and push:

```bash
git tag v1.0.0
git push origin v1.0.0
```

2. Build all platforms (use CI or build on each OS):

```bash
# On macOS
npm run package:mac

# On Windows
npm run package:win

# On Linux
npm run package:linux
```

3. Create a GitHub release at https://github.com/shayderrr/visigit/releases/new and upload the artifacts from `release/`:

| File | Platform |
|------|----------|
| `VisiGit-1.0.0.dmg` | macOS (universal) |
| `VisiGit Setup 1.0.0.exe` | Windows |
| `VisiGit-1.0.0.AppImage` | Linux |
| `visigit_1.0.0_amd64.deb` | Linux (Debian/Ubuntu) |

### Option 2: Publish with electron-builder

electron-builder can publish directly to GitHub Releases:

```bash
# Set a GitHub token (personal access token with repo scope)
export GH_TOKEN=your_github_token

# Build and publish
npm run publish
```

This builds for the current platform and uploads the artifact to the latest GitHub Release.

### Option 3: Automated CI (GitHub Actions)

Create `.github/workflows/release.yml` to build on all platforms automatically when you push a tag. See the [electron-builder CI guide](https://www.electron.build/multi-platform-build) for reference.

### Option 4: Publish to npm

VisiGit can be distributed as a global npm package. Users install with `npm install -g visigit` and run it with the `visigit` command.

```bash
# Build the app first
npm run build

# Login to npm
npm login

# Publish
npm publish
```

The `prepublishOnly` script runs `electron-vite build` automatically before publish. The `bin/visigit.js` launcher finds the Electron binary from the `electron` dependency and starts the app.

**Note:** The npm package includes the Electron binary for the user's platform (~180MB). This is larger than a standalone installer but works for users who prefer `npm install -g`.

## License

MIT
