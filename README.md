# Homedock

A personal homedock built with **React + TypeScript + Vite**, served as a static site via Docker using `joseluisq/static-web-server:2`.

## Features

- 🖼 **Daily rotating background** — deterministic image per day (picsum.photos, same seed = same image)
- 🪟 **Glassmorphism panels** — configurable blur, opacity, border radius, colors
- 🔗 **Link panels** — each link shows the site's favicon automatically
- ✏️ **Built-in editor** — drag to reposition, resize, style, and manage links inline
- 💾 **LocalStorage persistence** — config is auto-saved, survives page refresh
- 📦 **JSON export / import** — versioned schema with strict validation

## Development

```bash
npm install
npm run dev        # http://localhost:5173
```

## Production build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the build locally
```

## Docker

```bash
# Build and run
docker compose up --build

# Open http://localhost:8080
```

## Usage

1. Open the app — you start in **View mode**.
2. Click **✏️ Edit** in the toolbar to enter edit mode.
3. Click **＋ Add Panel** to create a new panel.
4. Click a panel to open the editor sidebar — set title, position, size, style and links.
5. Drag the panel's title bar to reposition it.
6. Click **⬇ Export** to download your configuration as JSON.
7. Click **⬆ Import** to load a previously exported JSON file.
8. Click **👁 View** to return to view mode (changes are auto-saved).

## JSON schema

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-05-12T10:00:00.000Z",
  "panels": [
    {
      "id": "uuid",
      "title": "Work",
      "x": 80,
      "y": 80,
      "width": 260,
      "links": [
        { "id": "uuid", "label": "GitHub", "url": "https://github.com" }
      ],
      "style": {
        "bgOpacity": 0.15,
        "blur": 10,
        "borderRadius": 16,
        "textColor": "#ffffff",
        "borderColor": "#ffffff",
        "borderOpacity": 0.3
      }
    }
  ]
}
```
