# Flip Sensor Card

This is a custom card for Home Assistant that shows an entity value as a mechanical drum / counter.  
Each character sits on its own “wheel” and spins to the new value, like an old-school counter or split-flap display.

The card is read-only. It does not control the entity in any way.
![Video from demo](/img/deomflip.mp4)
---

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
