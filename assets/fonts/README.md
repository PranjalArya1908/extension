# assets/fonts/

Place your custom font files here if you prefer self-hosted fonts
instead of Google Fonts.

## Usage:
1. Add your `.woff2` / `.woff` font files to this folder.
2. Add `@font-face` declarations in `css/base.css`:

```css
@font-face {
  font-family: 'YourFont';
  src: url('../assets/fonts/YourFont-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

3. Set `--font-primary: 'YourFont';` in `:root` inside `css/base.css`.

## Alternatively — Google Fonts:
Add the import at the top of `css/base.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
```
Then set `--font-primary: 'Inter';`
