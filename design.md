# AudioMab Design System

> Apple Music-inspired design language for YouTube audio streaming

---

## Navigation

**Floating Pill Navigation (Bottom)**
- Glass morphism effect with blur
- Tabs: Home, New, Radio, Library
- Separate circular Search button
- Active state: filled background + accent color text
- Icons: Lucide React (matching Apple SF Symbols style)

---

## Now Playing Screen

**Full-Screen Blurred Background**
- Album artwork blurred and stretched to fill entire screen
- Dark overlay gradient for readability
- Artwork displayed centered at ~60% width

**Controls Layout**
- Track info at bottom third
- Progress bar with scrubbing
- Large centered playback controls
- Volume slider
- Bottom action bar: Lyrics, AirPlay, Queue

**Gestures**
- Swipe down to dismiss
- Tap progress bar to seek

---

## Lyrics View

**Synchronized Lyrics**
- Fetch from lrclib.net API
- Current line: full opacity, larger scale
- Upcoming lines: faded opacity
- Past lines: dimmed
- Auto-scroll to active line
- Tap any line to seek

---

## Queue View

**Layout**
- Current track header with artwork
- Action buttons: Shuffle, Repeat, Infinity, Autoplay
- "Continue Playing" section with draggable tracks

---

## Search Page

**Browse Categories**
- 2-column grid of category cards
- Gradient backgrounds with rotated image overlay
- Categories: Hits, Hip-Hop, Pop, Chill, etc.

**Search Bar**
- Pill-shaped with search icon
- Cancel button appears on focus
- Results list with thumbnails

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent` | `#FA2D48` | Primary actions, active states |
| `--color-bg-primary` | `#000000` | Main background |
| `--color-bg-secondary` | `#1C1C1E` | Cards, inputs |
| `--color-text-primary` | `#FFFFFF` | Main text |
| `--color-text-secondary` | `#8E8E93` | Subtitles |

---

## Typography

- **SF Pro Display** (fallback: system-ui)
- Large titles: 34px, weight 700
- Section titles: 20px, weight 700
- Body: 16px, weight 400
- Caption: 13px, weight 500

---

## Spacing

8px grid system:
- `--space-xs`: 4px
- `--space-sm`: 8px
- `--space-md`: 16px
- `--space-lg`: 24px
- `--space-xl`: 32px

---

## Animations

- **Ease**: `cubic-bezier(0.25, 0.1, 0.25, 1)`
- **Duration**: 200-300ms for micro-interactions
- **Spring**: `damping: 30, stiffness: 300` for panels
