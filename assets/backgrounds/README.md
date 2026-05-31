# assets/backgrounds/

Drop your background images into the appropriate folder.
Expected filename: `bg.jpg` (or `bg.png` — update the CSS variable in the theme file if using PNG).

## Folder structure:

```
backgrounds/
├── minimalistic/
│   ├── light/
│   │   └── bg.jpg    ← Minimalistic Light background
│   └── dark/
│       └── bg.jpg    ← Minimalistic Dark background
└── work/
    ├── light/
    │   └── bg.jpg    ← Work Light background
    └── dark/
        └── bg.jpg    ← Work Dark background
```

## Tips:
- Recommended resolution: 2560×1440 (or higher for retina screens)
- Format: JPG for photos, PNG for illustrations/art
- If you don't want a background image, leave the folder empty and
  the theme will fall back to the `--color-bg` solid color defined
  in the theme CSS file.
