# Flip Sensor Card

A fully customizable Lovelace card for Home Assistant that displays entity values as mechanical split-flap / drum counters.

![License](https://img.shields.io/github/license/dzaczek/lovelace-flip-sensor-card)
![Version](https://img.shields.io/github/v/release/dzaczek/lovelace-flip-sensor-card)

This card is read-only and does not control the entity in any way.

## Features

- **Mechanical Animation**: Realistic flip animation for numbers and characters.
- **Multiple Themes**: Built-in themes including Classic, iOS, Neon, Wood, and Aviation.
- **Visual Editor**: Fully supported in Lovelace UI visual editor.
- **Highly Customizable**: Adjust sizes, gaps, speeds, colors, and more.
- **Attribute Support**: Display state or specific attributes of an entity.
- **Demo Mode**: Test the look and feel without connecting to a real entity.

---

## Showcase & Examples

Check out [`examples.yaml`](examples.yaml) for a complete dashboard configuration demonstrating all themes and options.

https://github.com/user-attachments/assets/0a1d7521-89bc-42fb-8cc4-a45b2cebc417

---

## Installation

### Via HACS (Recommended)

1. Go to **HACS → Frontend**.
2. Click menu (three dots) → **Custom repositories**.
3. Add this repo URL with category **Dasboard**.
4. Click **Install**.
5. Reload your dashboard.

### Manual Install

1. Copy `flip-sensor-card.js` to `/config/www/`.
2. Add resource in Lovelace (Settings → Dashboards → Resources):
   - URL: `/local/flip-sensor-card.js`
   - Type: `JavaScript Module`
3. Refresh browser.

---

## Configuration

You can configure the card using the **Visual Editor** in Lovelace or via **YAML**.

### Options

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`entity`** | `string` | **Required** | The entity ID to display. Required unless `demo_mode` is true. |
| **`attribute`** | `string` | `null` | (Optional) Specific attribute to display instead of state. |
| `title` | `string` | `null` | Optional title displayed above the card. |
| `theme` | `string` | `classic` | Visual preset: `classic`, `ios-light`, `ios-dark`, `neon`, `wood`, `red`, `aviation-departure`. |
| `size` | `number` | `50` | Height of the flip tiles in pixels. |
| `digit_count` | `number` | `4` | For numeric values: number of decimal places to display (e.g., 2 rounds 9.39999 to 9.40). For non-numeric values: minimum number of tiles to show. |
| `gap` | `number` | `5` | Spacing (gap) between individual tiles in pixels. |
| `unit_pos` | `string` | `none` | Position of unit label: `none` (inside), `top`, `bottom`. |
| `unit` | `string` | `null` | Manually override unit text. Defaults to entity's `unit_of_measurement`. |
| `speed` | `number` | `0.6` | Flip animation duration (seconds). |
| `spin_speed` | `number` | `0.12` | Fast spin animation duration (seconds). |
| `remove_speed` | `number` | `0.5` | Duration of removing excess tiles animation (seconds). |
| `demo_mode` | `boolean` | `false` | Run a demo loop without reading any entity. |
| `custom_style` | `object` | `null` | Custom CSS variable overrides. |

### Visual Editor

The card fully supports the Lovelace visual editor. When adding a card, search for **Flip Sensor Card**. You can configure all options directly in the UI.

---

## Themes

| Theme | Description |
| :--- | :--- |
| **Classic** | Dark background, light text. Retro counter style. |
| **iOS Light** | Light background, dark text, soft shadows. Clean modern look. |
| **iOS Dark** | Dark background, white text. Matches dark mode dashboards. |
| **Neon** | Black background, bright green glowing text. Cyberpunk vibe. |
| **Wood** | Brown background, warm text. Vintage wooden panel look. |
| **Red** | Dark background, red digits. Alarm / HUD style. |
| **Aviation** | Classic airport departure board style. Yellow text on black, Oswald font. |

---

## Advanced Configuration

### Custom Styling (`custom_style`)

You can override CSS variables to customize the look beyond built-in themes.

```yaml
type: custom:flip-sensor-card
entity: sensor.power
custom_style:
  --flip-bg: "#222"
  --flip-text: "#00ff00"
  --flip-border-radius: "0px"
  --flip-shadow: "none"
```

### Supported Characters

The flip animation works for: `0-9`, `space`, `.`, `,`, `:`, `%`, `°`.
Other characters (letters, symbols) are displayed statically without animation.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
