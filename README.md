# YouTube StreamTime Web Extension

A browser extension that displays actual streaming time for YouTube live broadcasts and their archives.

## Overview

YouTube StreamTime enhances your YouTube viewing experience by displaying the real broadcast time for live streams and their archived videos. Instead of just seeing the video timeline, you can see exactly when something happened during the original live broadcast.

## Features

### For Live Broadcasts

Shows the actual start time of the stream with real-time elapsed duration.

![live](https://github.com/user-attachments/assets/0c972bda-72db-430c-8b05-844edd2dab8d)

**Display format:** `[Start time] + [Elapsed time]`

### For Archived Live Streams

Displays the exact broadcast timestamp corresponding to your current playback position.

![archive](https://github.com/user-attachments/assets/d6ef75e8-37f5-4e47-8de3-c9e6e6cb884b)

**Display format:** `[Current position] / [Total duration] ( [Original broadcast timestamp] )`

## Environment Setup

```bash
# Install bun runtime
mise install
# Install project dependencies
bun install
```

## Browser Extension Installation

```bash
# Build for Chrome (or Firefox)
bun run build # or bun run build:firefox
```

1. Open your browser's extension management page
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `.output/chrome-mv3/` directory (or `.output/firefox-mv2/` for Firefox)

### Usage

1. Install the extension
2. Navigate to any YouTube live video or its archive
3. The extension automatically detects live streams and archived broadcasts
4. Real broadcast times are displayed in the video player timeline

> [!NOTE]
> This extension only works with YouTube live videos and their archived recordings.

## Development

```bash
# Development with hot reload for Chrome (or Firefox)
bun run dev # or bun run dev:firefox
```

### Development Extension Installation

1. Run the development build command above
2. Open your browser's extension management page
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `.output/chrome-mv3-dev/` directory (or `.output/firefox-mv2-dev/` for Firefox)

**VSCode Users:**

1. Install the recommended extensions when prompted
2. Copy shared settings to your personal settings: `cp .vscode/settings-shared.json .vscode/settings.json`
3. The shared settings will enable Biome as the default formatter

## How It Works

The extension:

1. Injects a content script into YouTube video pages
2. Monitors YouTube's microformat metadata for live broadcast information
3. Calculates real broadcast timestamps using the original start time
4. Updates the display in real-time as the video plays
