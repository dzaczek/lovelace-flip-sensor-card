# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- **`digit_count` behavior for numeric values** - Now controls decimal precision instead of minimum tiles
  - Numeric sensors: `digit_count: 2` rounds `9.39999` to `9.40`
  - Integer sensors: `digit_count: 2` displays `42` as `42.00`
  - Non-numeric values: Preserves existing minimum tile behavior
  - To avoid decimals on integer sensors, set `digit_count: 0`

## [25.0.2] - 2025-12-24

### Added
- **Lovelace Visual Editor Support** - Added a visual editor interface for configuring the card directly in Lovelace UI. Now all parameters (entity, theme, size, speeds, etc.) can be adjusted via graphical form instead of YAML.
- **Card Preview** - Added card preview support for the "Add Card" dialog in Lovelace.
- **Examples Dashboard** - Added `examples.yaml` with a comprehensive showcase of all themes and configurations.
- **Documentation Overhaul** - Completely redesigned README structure for better readability and added Visual Editor documentation.

## [25.0.1] - 2025-12-24

### Added
- **New theme: `aviation-departure`** - Classic airport departure board style with yellow text on black background, using Oswald font for authentic look
- **Attribute support** - New `attribute` option to display specific entity attributes instead of the main state (e.g., `current_temperature`, `hour`)
- **Error handling** - Display user-friendly error messages when entity is missing, unavailable, or attribute not found
- **JSDoc documentation** - Comprehensive JSDoc comments for all major class methods
- **Input validation** - Validate configuration parameters (size > 0, speed > 0, etc.) with descriptive error messages
- **XSS protection** - HTML escaping for title and character values to prevent cross-site scripting attacks
- **DOM element caching** - Cache frequently accessed DOM elements to improve performance
- **Lifecycle cleanup** - Added `disconnectedCallback` to properly clean up timers and demo mode when card is removed

### Fixed
- **`getCardSize()` method** - Now returns actual card size (`this.cardSize`) instead of hardcoded value `3`
- **Error messages** - Changed error messages from Polish to English for consistency
- **Entity state handling** - Proper handling of `unavailable` and `unknown` entity states
- **Surplus tiles cleanup** - Improved logic for removing excess tiles with better edge case handling
- **Font loading optimization** - Check if Google Fonts are already loaded before importing to avoid duplicate requests

### Changed
- **Code comments** - Unified all comments to English for better maintainability
- **Magic numbers** - Extracted magic numbers to named constants:
  - `MAX_SPIN_ITERATIONS = 40` (safety limit for spinDigit loop)
  - `CLEANUP_THRESHOLD = 3` (empty cycles before removing surplus tiles)
  - `CARD_WIDTH_RATIO = 0.70` (width relative to height)
  - `FONT_SIZE_RATIO = 0.85` (font size relative to card height)
  - `UNIT_FONT_SIZE_RATIO = 0.4` (unit label font size relative to main font)
- **Demo mode** - Improved demo mode with proper async/await pattern and timer cleanup
- **Unit label updates** - Use `textContent` instead of `innerText` for better security

### Documentation
- **README synchronization** - Updated documentation to match actual code implementation:
  - Removed `show_unit` option (not implemented, use `unit_pos` instead)
  - Removed "Work In Progress" labels from `unit_pos` and `unit` options
  - Added detailed documentation for `attribute` option
  - Updated all examples to use correct configuration options
  - Added new theme to available options list
  - Updated "How it works" section to mention attribute support and error handling

### Performance
- **Font loading** - Optimized Google Fonts loading by checking if fonts are already loaded
- **DOM queries** - Reduced redundant DOM queries through element caching
- **Animation promises** - Improved promise handling in animation sequences

### Security
- **XSS prevention** - Added HTML escaping for all user-provided content (title, characters)
- **Input sanitization** - Validate and sanitize all configuration inputs

---

## Previous Versions

For earlier versions, see the git commit history.
