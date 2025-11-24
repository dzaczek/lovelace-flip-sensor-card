# Flip Sensor Card

This is a custom card for Home Assistant that shows an entity value as a mechanical drum / counter.  
Each character sits on its own “wheel” and spins to the new value, like an old-school counter or split-flap display.

The card is read-only. It does not control the entity in any way.

---


https://github.com/user-attachments/assets/0a1d7521-89bc-42fb-8cc4-a45b2cebc417


## How it works

- It reads the state of the given entity (for example `sensor.temperature_living_room`).
- It splits the state string into individual characters.
- Each character is rendered as a separate drum.
- When the value changes, each drum spins through its character set until it reaches the new one.
- Some characters use the flip animation, others are updated instantly.

Characters that support animated spinning:

`space, 0–9, '.', ',', ':', '%', '°'`

If some other character appears (for example a letter), it will still be shown, but without the spin animation.

---

## Installation

### Via HACS

1. Go to **HACS → Frontend**.
2. Add this repo as a **Custom repository** (type: Lovelace).
3. Install the card.
4. Reload the Home Assistant frontend (refresh the browser).

### Manual install

1. Copy `flip-sensor-card.js` into:

   `/config/www/`

2. Add the resource in Lovelace (Settings → Dashboards → Resources) or in `configuration.yaml`:

   ```yaml
   url: /local/flip-sensor-card.js
   type: module
   ```

3. Save and hard-refresh the browser (Ctrl+F5 / Cmd+Shift+R).

---

## Basic configuration

The smallest useful example:

```yaml
type: custom:flip-sensor-card
entity: sensor.temperature_living_room
title: Living room
```

The card will show the entity state as a row of drums, using the default theme.

---

## Available options

Below is a list of all options you can use in the card config.


# ⚙️ Configuration Options

Here is a complete list of all available options for the `flip-sensor-card`.

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`entity`** | `string` | **Required** | The entity ID to display (e.g., `sensor.temperature`). Required unless `demo_mode` is true. |
| **`attribute`** | `string` | `null` | (Optional) Specific attribute to display instead of the main state (e.g., `current_temperature`, `hour`). |
| `title` | `string` | `null` | A title displayed at the top of the card. |
| `theme` | `string` | `classic` | Visual preset. Options: `classic`, `ios-light`, `ios-dark`, `neon`, `wood`, `red`. |
| `size` | `number` | `50` | Height of the flip tiles in pixels. |
| `digit_count` | `number` | `4` | Target number of digits. The card adds empty padding tiles if the number is shorter. |
| `gap` | `number` | `5` | Spacing (gap) between individual tiles in pixels. |
| `unit_pos` | `string` | `none` | [Work In Progress] Position of the unit label. Options: `top`, `bottom`, `none` (inside the drum). |
| `unit` | `string` | `null` | [Work In Progress] Manually override the unit text. If not set, it pulls `unit_of_measurement` from the entity. |
| `speed` | `number` | `0.6` | Duration (in seconds) for a single step flip (e.g., 1 -> 2). |
| `spin_speed` | `number` | `0.12` | Duration (in seconds) for fast spinning steps (e.g., 5 -> 4 loop). |
| `remove_speed`| `number`| `0.5` | Duration (in seconds) of the fade-out/collapse animation when removing empty tiles. |
| `demo_mode` | `boolean`| `false` | If `true`, ignores the entity and runs a test animation loop. |
| `custom_style`| `object` | `null` | A map of CSS variables to override styles (see below). |

---

### 🎨 CSS Variables (custom_style)

You can override specific visual elements using the `custom_style` option in YAML.

| Variable Name | Description | Example |
| :--- | :--- | :--- |
| `--flip-bg` | Background color of the tiles | `#222`, `rgba(0,0,0,0.8)` |
| `--flip-text` | Color of the numbers | `#ff0000`, `white` |
| `--flip-font` | Font family used for digits | `'Courier New'`, `sans-serif` |
| `--flip-border-radius`| Rounding of the tile corners | `4px`, `50%` |
| `--flip-shadow` | CSS box-shadow for the tiles | `0 4px 10px rgba(0,0,0,0.5)` |
| `--flip-border` | CSS border definition | `1px solid red` |
| `--flip-text-shadow` | CSS text-shadow (useful for neon effects) | `0 0 5px green` |


#### Example Usage


https://github.com/user-attachments/assets/0f3b64ae-e013-4201-a333-4959848b4bc3


```yaml
type: custom:flip-sensor-card
entity: sensor.power_usage
digit_count: 5
unit_pos: bottom
theme: classic
custom_style:
  --flip-bg: "#000000"
  --flip-text: "#00ff00"
  --flip-border-radius: "0px"
```
---

### `entity` (string)

- The entity whose state will be displayed.
- Example: `sensor.temperature_living_room`
- **Required**, unless you are using `demo_mode: true`.

```yaml
entity: sensor.temperature_living_room
```

---

### `demo_mode` (bool)

- If `true`, the card does not read any entity.
- Instead, it cycles through a few demo values in a loop.
- Handy for testing layout and styles.

```yaml
demo_mode: true
```

You should not set `entity` and `demo_mode: true` together. Pick one.

---

### `size` (number)

- Height of a single drum (one tile), in pixels.
- Default: `50`
- Larger value → bigger drums and text.

```yaml
size: 80
```

---

### `gap` (number)

- Space between drums, in pixels.
- Default: `5`

```yaml
gap: 8
```

---

### `digit_count` (number)

- Minimum number of drums to show.
- Default: `4`
- If the value has fewer characters than `digit_count`, empty drums are added on the left.
- If the value has more characters, extra drums are added on the left as needed.

```yaml
digit_count: 6
```

---

### `show_unit` (bool)

- If `true` and the entity has `unit_of_measurement` (like `°C`, `%`, `kWh`), the unit is appended to the value.
- The unit is treated as a normal character in the display.

```yaml
show_unit: true
```

---

### `title` (string)

- Optional label shown above the drums.

```yaml
title: Living room temperature
```

---

### `speed` (number)

- Duration of one flip animation when the drum only needs to move by one step.
- In seconds.
- Default: `0.6`

Used for small changes like `2 → 3`.

```yaml
speed: 0.5
```

---

### `spin_speed` (number)

- Duration of one step when the drum has to spin through more than one character.
- In seconds.
- Default: `0.12`

For example, going from `1` to `8` will spin through several characters using this speed.

```yaml
spin_speed: 0.1
```

---

### `remove_speed` (number)

- Duration of the “removing” animation for extra left-side drums that are no longer needed.
- In seconds.
- Default: `0.5`

How it behaves:

- When the entity value gets shorter, the leftmost drums may end up showing only spaces.
- The card keeps track of how many times this happens in a row.
- After a few cycles, it animates those extra drums out (they shrink and fade), then removes them from the DOM.

```yaml
remove_speed: 0.4
```

---

### `theme` (string)

Selects a built-in theme (colors, fonts, shadows).

Available themes:

- `classic`  
  Dark background, light text. Slightly retro.

- `ios-light`  
  Light background, dark text, soft shadow. Inspired by iOS cards.

- `ios-dark`  
  Dark background, light text, stronger shadow. Good for dark dashboards.

- `neon`  
  Black background, bright green text, subtle neon glow.

- `wood`  
  Brown background, warm text. Looks like an old wooden panel.

- `red`  
  Dark background with red digits. Feels like an alarm / HUD display.

Example:

```yaml
theme: neon
```

If you pass an unknown theme name, the card falls back to `classic`.

---

### `custom_style` (object)

Extra CSS overrides.  
Whatever you put here is merged into the base theme and injected into `:host { ... }`.

You can use it to tweak:

- colors,
- fonts,
- shadows,
- and custom CSS variables used inside the card.

Example – small tweaks:

```yaml
custom_style:
  --card-size: 70px
  background: "transparent"
```

Example – override colors on top of a built-in theme:

```yaml
theme: classic
custom_style:
  --flip-bg: "#101010"
  --flip-text: "#ffcc00"
  --flip-text-shadow: "0 0 8px rgba(255, 204, 0, 0.8)"
```

---

## Example configurations

### 1. Simple temperature sensor

```yaml
type: custom:flip-sensor-card
entity: sensor.temperature_living_room
title: Living room
show_unit: true
theme: classic
```

---

### 2. Neon style with faster spinning

```yaml
type: custom:flip-sensor-card
entity: sensor.power_usage
title: Power usage
show_unit: true
theme: neon
size: 70
speed: 0.5
spin_speed: 0.08
remove_speed: 0.4
```

---

### 3. iOS dark style, more digits

```yaml
type: custom:flip-sensor-card
entity: sensor.energy_today
title: Energy today
show_unit: true
theme: ios-dark
size: 80
digit_count: 6
```

---

### 4. Demo mode (no entity required)

```yaml
type: custom:flip-sensor-card
demo_mode: true
title: Demo
theme: wood
size: 60
```

---

That’s it.  
Pick an entity, choose a theme, adjust speeds and sizes to your taste, and you get a smooth, animated drum display that looks like something pulled out of an old counter, but wired into Home Assistant.
