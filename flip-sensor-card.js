/**
 * Flip Sensor Card - Custom Home Assistant card displaying entity values as animated flip displays
 * @class FlipSensorCard
 * @extends HTMLElement
 */
class FlipSensorCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Character drum - characters that support animated spinning
    this.drumChars = [' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ',', ':', '%', '°'];
    
    // Constants
    this.MAX_SPIN_ITERATIONS = 40; // Safety limit for spinDigit loop
    this.CLEANUP_THRESHOLD = 3; // Number of empty cycles before removing surplus tiles
    this.CARD_WIDTH_RATIO = 0.70; // Width of card relative to height
    this.FONT_SIZE_RATIO = 0.85; // Font size relative to card height
    this.UNIT_FONT_SIZE_RATIO = 0.4; // Unit label font size relative to main font
    
    // State
    this.currentDisplayValue = []; 
    this.isDemoRunning = false;
    this.demoTimer = null;
    this.surplusStrikeCount = 0;
    
    // DOM cache
    this._cachedElements = {};

    // Theme definitions
    this.themes = {
        'classic': { bg: '#333', text: '#f0f0f0', radius: '6px', shadow: '0 2px 5px rgba(0,0,0,0.4)', font: "'Oswald', sans-serif", border: 'none', textShadow: 'none' },
        'ios-light': { bg: '#ffffff', text: '#000000', radius: '6px', shadow: '0 4px 10px rgba(0,0,0,0.15)', font: "-apple-system, sans-serif", border: '1px solid #e0e0e0', textShadow: 'none' },
        'ios-dark': { bg: '#1c1c1e', text: '#ffffff', radius: '6px', shadow: '0 4px 10px rgba(0,0,0,0.3)', font: "-apple-system, sans-serif", border: '1px solid #333', textShadow: 'none' },
        'neon': { bg: '#000000', text: '#39ff14', radius: '0px', shadow: '0 0 10px rgba(57, 255, 20, 0.2)', font: "'Courier New', monospace", border: '1px solid #1a1a1a', textShadow: '0 0 5px #39ff14' },
        'wood': { bg: '#5d4037', text: '#efebe9', radius: '4px', shadow: '0 3px 6px rgba(0,0,0,0.4)', font: "'Times New Roman', serif", border: '1px solid #3e2723', textShadow: '0 1px 2px rgba(0,0,0,0.8)' },
        'red': { bg: '#202020', text: '#ff3b30', radius: '4px', shadow: '0 2px 5px rgba(0,0,0,0.5)', font: "'Oswald', sans-serif", border: 'none', textShadow: '0 0 2px #a00000' },
        'aviation-departure': { bg: '#000000', text: '#ffd700', radius: '0px', shadow: '0 2px 8px rgba(255, 215, 0, 0.3)', font: "'Oswald', sans-serif", border: 'none', textShadow: '0 0 3px rgba(255, 215, 0, 0.5)' }
    };
  }

  /**
   * Sets the card configuration and validates parameters
   * @param {Object} config - Configuration object
   * @throws {Error} If required configuration is missing or invalid
   */
  setConfig(config) {
    if (!config.entity && !config.demo_mode) {
      throw new Error('Entity ID is required, or set demo_mode: true');
    }
    
    this.config = config;
    
    // Validate and set speed parameters
    this.normalSpeed = config.speed !== undefined ? config.speed : 0.6;
    this.spinSpeed = config.spin_speed !== undefined ? config.spin_speed : 0.12;
    this.removeSpeed = config.remove_speed !== undefined ? config.remove_speed : 0.5;
    
    if (this.normalSpeed <= 0 || this.spinSpeed <= 0 || this.removeSpeed <= 0) {
      throw new Error('Speed values must be greater than 0');
    }

    // Unit position: 'top', 'bottom', 'none' (default: 'none' = inside the drum)
    this.unitPos = config.unit_pos || 'none';
    if (!['top', 'bottom', 'none'].includes(this.unitPos)) {
      this.unitPos = 'none';
    }
    
    // Manual unit override
    this.manualUnit = config.unit || null; 

    this.style.setProperty('--remove-duration', `${this.removeSpeed}s`);

    // Validate and set size parameters
    this.cardSize = config.size || 50;
    this.gap = config.gap || 5;
    this.digitCount = config.digit_count || 4;
    
    if (this.cardSize <= 0) {
      throw new Error('Size must be greater than 0');
    }
    if (this.gap < 0) {
      throw new Error('Gap cannot be negative');
    }
    if (this.digitCount < 0) {
      throw new Error('digit_count cannot be negative');
    }
    
    this.currentTheme = this.themes[config.theme] || this.themes['classic'];
    
    // Clear DOM cache when config changes
    this._cachedElements = {};

    if (this.config.demo_mode && !this.isDemoRunning) {
        this.startDemoMode();
    }
  }

  /**
   * Updates the card when Home Assistant state changes
   * @param {Object} hass - Home Assistant object
   */
  set hass(hass) {
    if (this.config.demo_mode) return;
    const entityId = this.config.entity;
    const stateObj = hass.states[entityId];
    
    // Handle missing or unavailable entity
    if (!stateObj) {
      this.showError('Entity not found: ' + entityId);
      return;
    }
    
    if (stateObj.state === 'unavailable' || stateObj.state === 'unknown') {
      this.showError('Entity unavailable: ' + entityId);
      return;
    }

    // Get value from state or attribute
    let value;
    if (this.config.attribute) {
      value = stateObj.attributes[this.config.attribute];
      if (value === undefined || value === null) {
        this.showError(`Attribute "${this.config.attribute}" not found`);
        return;
      }
      value = String(value);
    } else {
      value = String(stateObj.state);
    }
    
    // Get unit from config or entity attributes
    let unit = this.manualUnit !== null ? this.manualUnit : (stateObj.attributes.unit_of_measurement || '');

    // Build display string
    let displayString = value;

    if (this.unitPos === 'none' && unit) {
        // Append unit to the display string (old method)
        displayString += unit;
    } else {
        // Update static label (new method)
        this.updateUnitLabel(unit);
    }

    if (!this.content) {
      this.render();
      // Update unit label after render to ensure it appears on first load
      if(this.unitPos !== 'none') this.updateUnitLabel(unit);
      
      this.updateDisplay(displayString, true);
      this.lastState = displayString;
    } else if (displayString !== this.lastState) {
      this.lastState = displayString;
      this.updateDisplay(displayString, false);
    }
  }
  
  /**
   * Displays an error message in the card
   * @param {string} message - Error message to display
   */
  showError(message) {
    if (!this.shadowRoot) {
      this.render();
    }
    
    const errorEl = this.shadowRoot.getElementById('error-message');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    } else {
      // Create error element if it doesn't exist
      const errorDiv = document.createElement('div');
      errorDiv.id = 'error-message';
      errorDiv.style.cssText = 'color: #f44336; padding: 16px; text-align: center;';
      errorDiv.textContent = message;
      const cardContent = this.shadowRoot.querySelector('.card-content');
      if (cardContent) {
        cardContent.appendChild(errorDiv);
      }
    }
  }

  /**
   * Updates the unit label display
   * @param {string} text - Unit text to display
   */
  updateUnitLabel(text) {
      if (!this.shadowRoot) return;
      
      // Cache DOM elements
      if (!this._cachedElements.topLabel) {
        this._cachedElements.topLabel = this.shadowRoot.getElementById('unit-top');
      }
      if (!this._cachedElements.bottomLabel) {
        this._cachedElements.bottomLabel = this.shadowRoot.getElementById('unit-bottom');
      }
      
      const topLabel = this._cachedElements.topLabel;
      const bottomLabel = this._cachedElements.bottomLabel;

      if (this.unitPos === 'top' && topLabel) {
          topLabel.textContent = text;
          topLabel.style.display = 'block';
          if(bottomLabel) bottomLabel.style.display = 'none';
      } else if (this.unitPos === 'bottom' && bottomLabel) {
          bottomLabel.textContent = text;
          bottomLabel.style.display = 'block';
          if(topLabel) topLabel.style.display = 'none';
      } else {
          if(topLabel) topLabel.style.display = 'none';
          if(bottomLabel) bottomLabel.style.display = 'none';
      }
  }

  /**
   * Starts demo mode with cycling values
   */
  async startDemoMode() {
      this.isDemoRunning = true;
      if(!this.content) this.render();
      
      // Set example unit in demo mode
      if (this.unitPos !== 'none') this.updateUnitLabel(this.manualUnit || 'km/h');

      const sequence = ['1234', '12345678', '1111', '22', '33', '4444'];
      let idx = 0;
      await this.updateDisplay(sequence[0], true);

      const runDemo = async () => {
          if (!this.isDemoRunning) return;
          
          await new Promise(resolve => {
            this.demoTimer = setTimeout(resolve, 2500);
          });
          
          if (!this.isDemoRunning) return;
          
          idx = (idx + 1) % sequence.length;
          
          if(idx === 0) {
              // Clear tiles and reset state
              this.content.innerHTML = ''; 
              this.currentDisplayValue = [];
              this.surplusStrikeCount = 0;
              await this.updateDisplay(sequence[0], true);
          } else {
              await this.updateDisplay(sequence[idx], false);
          }
          
          // Continue loop
          runDemo();
      };
      
      runDemo();
  }
  
  /**
   * Cleanup when element is disconnected from DOM
   */
  disconnectedCallback() {
    this.isDemoRunning = false;
    if (this.demoTimer) {
      clearTimeout(this.demoTimer);
      this.demoTimer = null;
    }
    this._cachedElements = {};
  }

  /**
   * Renders the card HTML structure
   */
  render() {
    const t = this.currentTheme;
    const themeCSS = `
        --flip-bg: ${t.bg}; --flip-text: ${t.text}; --flip-border-radius: ${t.radius};
        --flip-shadow: ${t.shadow}; --flip-font: ${t.font}; --flip-text-shadow: ${t.textShadow}; --flip-border: ${t.border};
    `;
    let customOverride = '';
    if (this.config.custom_style) {
        for (const [key, value] of Object.entries(this.config.custom_style)) customOverride += `${key}: ${value} !important;\n`;
    }
    
    // Escape HTML in title to prevent XSS
    const titleText = this.config.title ? this.escapeHtml(this.config.title) : '';

    // Check if fonts are already loaded to avoid duplicate imports
    const fontsLoaded = document.querySelector('link[href*="fonts.googleapis.com"]') !== null;
    const fontImports = fontsLoaded ? '' : `
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap');
    `;

    this.shadowRoot.innerHTML = `
      <style>
        ${fontImports}
        :host { 
            display: block; 
            --card-size: ${this.cardSize}px; 
            --card-width: calc(var(--card-size) * ${this.CARD_WIDTH_RATIO}); 
            --font-size: calc(var(--card-size) * ${this.FONT_SIZE_RATIO}); 
            --flip-duration: 0.5s;
            --remove-duration-internal: var(--remove-duration, 0.5s);
            ${themeCSS} 
            ${customOverride} 
        }
        .card-content { display: flex; flex-direction: column; align-items: center; padding: 16px; background: var(--ha-card-background, transparent); }
        .flip-clock { display: flex; justify-content: center; gap: ${this.gap}px; perspective: 1000px; }
        
        /* Unit label styles (header/footer) */
        .unit-label {
            font-family: var(--flip-font);
            color: var(--flip-text);
            opacity: 0.7;
            font-size: calc(var(--font-size) * ${this.UNIT_FONT_SIZE_RATIO});
            text-transform: uppercase;
            letter-spacing: 1px;
            text-shadow: var(--flip-text-shadow);
            margin: 4px 0;
            display: none; /* Hidden by default, JS shows the appropriate one */
        }
        
        #error-message {
            color: #f44336;
            padding: 16px;
            text-align: center;
            display: none;
        }

        .flip-unit { 
            position: relative; 
            flex: 0 0 var(--card-width); 
            width: var(--card-width);
            height: var(--card-size); 
            background: var(--flip-bg); 
            border-radius: var(--flip-border-radius); 
            font-family: var(--flip-font); 
            font-weight: bold; 
            font-size: var(--font-size); 
            line-height: var(--card-size); 
            color: var(--flip-text); 
            box-shadow: var(--flip-shadow); 
            text-align: center; 
            border: var(--flip-border); 
            transition: 
                width var(--remove-duration-internal) ease-in-out, 
                flex-basis var(--remove-duration-internal) ease-in-out,
                min-width var(--remove-duration-internal) ease-in-out,
                margin var(--remove-duration-internal) ease-in-out, 
                opacity var(--remove-duration-internal) ease-in-out, 
                transform var(--remove-duration-internal) ease-in-out;
            overflow: hidden; 
        }
        
        .flip-unit.removing { 
            width: 0 !important; flex-basis: 0 !important; min-width: 0 !important;
            margin: 0 !important; opacity: 0 !important; transform: scale(0.5);
            border: none !important; box-shadow: none !important;
        }

        .top, .bottom, .flap { position: absolute; left: 0; width: 100%; height: 50%; overflow: hidden; background: var(--flip-bg); backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .top { top: 0; border-radius: var(--flip-border-radius) var(--flip-border-radius) 0 0; border-bottom: 1px solid rgba(0,0,0,0.3); z-index: 1; }
        .bottom { bottom: 0; border-radius: 0 0 var(--flip-border-radius) var(--flip-border-radius); z-index: 0; }
        .flap.front { top: 0; transform-origin: bottom; border-radius: var(--flip-border-radius) var(--flip-border-radius) 0 0; border-bottom: 1px solid rgba(0,0,0,0.3); z-index: 2; }
        .flap.back { top: 50%; transform-origin: top; border-radius: 0 0 var(--flip-border-radius) var(--flip-border-radius); transform: rotateX(180deg); z-index: 3; }
        .top::before, .bottom::before, .flap::before { content: attr(data-val); position: absolute; left: 0; width: 100%; height: 200%; text-shadow: var(--flip-text-shadow); }
        .top::before, .flap.front::before { top: 0; } .bottom::before, .flap.back::before { top: -100%; }
        .flip-unit.flipping .flap.front { animation: flipDownFront var(--flip-duration) ease-in forwards; }
        .flip-unit.flipping .flap.back { animation: flipDownBack var(--flip-duration) ease-out forwards; }
        @keyframes flipDownFront { 0% { transform: rotateX(0deg); } 100% { transform: rotateX(-180deg); } }
        @keyframes flipDownBack { 0% { transform: rotateX(180deg); } 100% { transform: rotateX(0deg); } }
      </style>

      <div class="card-content">
        ${titleText ? `<div style="margin-bottom:8px; font-weight:500; opacity:0.9;">${titleText}</div>` : ''}
        
        <div id="error-message"></div>
        
        <div id="unit-top" class="unit-label"></div>
        
        <div id="display" class="flip-clock"></div>
        
        <div id="unit-bottom" class="unit-label"></div>
      </div>
    `;
    this.content = this.shadowRoot.getElementById('display');
    // Clear cache when re-rendering
    this._cachedElements = {};
  }
  
  /**
   * Escapes HTML to prevent XSS attacks
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Creates a single flip digit unit element
   * @param {string} char - Character to display
   * @returns {HTMLElement} Created flip unit element
   */
  createDigitUnit(char) {
    const unit = document.createElement('div');
    unit.className = 'flip-unit';
    // Escape character to prevent XSS
    const safeChar = this.escapeHtml(char);
    unit.innerHTML = `
      <div class="top" data-val="${safeChar}"></div>
      <div class="bottom" data-val="${safeChar}"></div>
      <div class="flap front" data-val="${safeChar}"></div>
      <div class="flap back" data-val="${safeChar}"></div>
    `;
    return unit;
  }

  /**
   * Updates the display with new value
   * @param {string|number} inputRaw - Raw input value
   * @param {boolean} skipAnimation - Whether to skip animations
   */
  async updateDisplay(inputRaw, skipAnimation) {
    let input = String(inputRaw);
    const displayEl = this.content;
    if (!displayEl) return;

    let targetLen = Math.max(input.length, this.digitCount);
    let currentLen = displayEl.children.length;

    // Add missing tiles
    if (targetLen > currentLen) {
        const diff = targetLen - currentLen;
        for (let i = 0; i < diff; i++) {
            const blankUnit = this.createDigitUnit(' ');
            displayEl.insertBefore(blankUnit, displayEl.firstChild); 
            this.currentDisplayValue.unshift(' ');
        }
        this.surplusStrikeCount = 0; 
        currentLen = targetLen;
    }

    let paddedInput = input.padStart(currentLen, ' ');
    let excessCount = currentLen - this.digitCount;

    // Handle surplus tiles cleanup
    if (excessCount > 0) {
        const surplusPart = paddedInput.substring(0, excessCount);
        const isSurplusEmpty = surplusPart.trim().length === 0;

        if (isSurplusEmpty) {
            this.surplusStrikeCount++;
        } else {
            this.surplusStrikeCount = 0;
        }

        // Remove surplus tiles after threshold
        if (this.surplusStrikeCount >= this.CLEANUP_THRESHOLD) {
            const unitsToRemove = [];
            for (let i = 0; i < excessCount; i++) {
                if (displayEl.children[i]) unitsToRemove.push(displayEl.children[i]);
            }
            unitsToRemove.forEach(el => el.classList.add('removing'));
            await new Promise(r => setTimeout(r, this.removeSpeed * 1000));
            unitsToRemove.forEach(el => {
                if(el.parentNode === displayEl) displayEl.removeChild(el);
            });
            this.currentDisplayValue.splice(0, excessCount);
            paddedInput = paddedInput.substring(excessCount);
            this.surplusStrikeCount = 0;
        }
    } else {
        this.surplusStrikeCount = 0;
    }

    const targetChars = paddedInput.split('');
    const units = displayEl.querySelectorAll('.flip-unit:not(.removing)');

    if (skipAnimation) {
        targetChars.forEach((char, i) => {
            if(units[i]) {
                this.updateStatic(units[i], char);
                this.currentDisplayValue[i] = char;
            }
        });
        return;
    }

    const promises = targetChars.map((targetChar, index) => {
      if (!units[index]) return Promise.resolve(); 

      if (!this.drumChars.includes(targetChar)) {
        this.updateStatic(units[index], targetChar);
        this.currentDisplayValue[index] = targetChar;
        return Promise.resolve();
      }

      const currentChar = this.currentDisplayValue[index] || ' ';
      if (currentChar === targetChar) return Promise.resolve();

      return this.spinDigit(units[index], currentChar, targetChar, index);
    });

    await Promise.all(promises);
  }

  /**
   * Updates a unit element without animation
   * @param {HTMLElement} unit - Unit element to update
   * @param {string} char - Character to display
   */
  updateStatic(unit, char) {
    if (!unit) return;
    const safeChar = this.escapeHtml(char);
    const top = unit.querySelector('.top');
    const bottom = unit.querySelector('.bottom');
    const flapFront = unit.querySelector('.flap.front');
    const flapBack = unit.querySelector('.flap.back');
    
    if (top) top.setAttribute('data-val', safeChar);
    if (bottom) bottom.setAttribute('data-val', safeChar);
    if (flapFront) flapFront.setAttribute('data-val', safeChar);
    if (flapBack) flapBack.setAttribute('data-val', safeChar);
  }

  /**
   * Animates a digit spinning from start to end character
   * @param {HTMLElement} element - Unit element to animate
   * @param {string} startChar - Starting character
   * @param {string} endChar - Target character
   * @param {number} index - Index of the digit in the display
   */
  async spinDigit(element, startChar, endChar, index) {
    if (!element) return;
    
    let current = startChar;
    let safety = 0;
    let startIndex = this.drumChars.indexOf(startChar);
    let endIndex = this.drumChars.indexOf(endChar);
    if (startIndex === -1) startIndex = 0;
    if (endIndex === -1) endIndex = 0;

    // Calculate shortest distance (forward or backward)
    let distance = endIndex - startIndex;
    if (distance < 0) distance += this.drumChars.length;
    
    // Use normal speed for single step, spin speed for multiple steps
    const useSpeed = (distance === 1) ? this.normalSpeed : this.spinSpeed;

    // Spin through characters until reaching target
    while (current !== endChar && safety < this.MAX_SPIN_ITERATIONS) {
      let idx = this.drumChars.indexOf(current);
      if (idx === -1) idx = 0;
      let nextIdx = (idx + 1) % this.drumChars.length;
      let nextChar = this.drumChars[nextIdx];
      await this.flipOnce(element, current, nextChar, useSpeed);
      current = nextChar;
      this.currentDisplayValue[index] = current;
      safety++;
    }
  }

  /**
   * Performs a single flip animation
   * @param {HTMLElement} element - Unit element to flip
   * @param {string} oldChar - Current character
   * @param {string} newChar - New character
   * @param {number} durationSeconds - Animation duration in seconds
   * @returns {Promise} Promise that resolves when animation completes
   */
  flipOnce(element, oldChar, newChar, durationSeconds) {
    return new Promise(resolve => {
        if(!element) { resolve(); return; }
        
        const safeOldChar = this.escapeHtml(oldChar);
        const safeNewChar = this.escapeHtml(newChar);
        
        const top = element.querySelector('.top');
        const bottom = element.querySelector('.bottom');
        const flapFront = element.querySelector('.flap.front');
        const flapBack = element.querySelector('.flap.back');

        if (!top || !bottom || !flapFront || !flapBack) {
          resolve();
          return;
        }

        element.style.setProperty('--flip-duration', durationSeconds + 's');
        top.setAttribute('data-val', safeNewChar);
        bottom.setAttribute('data-val', safeOldChar);
        flapFront.setAttribute('data-val', safeOldChar);
        flapBack.setAttribute('data-val', safeNewChar);

        // Force reflow to restart animation
        element.classList.remove('flipping');
        void element.offsetWidth; 
        element.classList.add('flipping');

        setTimeout(() => {
            bottom.setAttribute('data-val', safeNewChar);
            flapFront.setAttribute('data-val', safeNewChar); 
            element.classList.remove('flipping');
            resolve();
        }, durationSeconds * 1000); 
    });
  }

  /**
   * Returns the card size (required by Home Assistant)
   * @returns {number} Card size in pixels
   */
  getCardSize() {
    return this.cardSize || 50;
  }

  static getStubConfig() {
    return {
      entity: '',
      title: 'Flip Sensor',
      theme: 'classic',
      size: 50,
      digit_count: 4,
      unit_pos: 'none'
    }
  }

  static getConfigElement() {
    return document.createElement('flip-sensor-card-editor');
  }
}

class FlipSensorCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.render();
  }

  configChanged(newConfig) {
    const event = new Event('config-changed', {
      bubbles: true,
      composed: true,
    });
    event.detail = { config: newConfig };
    this.dispatchEvent(event);
  }

  render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    const config = this._config || {};
    
    this.shadowRoot.innerHTML = `
      <style>
        .card-config {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
        }
        .row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        label {
          font-weight: 500;
        }
        input, select {
          padding: 8px;
          border: 1px solid var(--primary-text-color, #ccc);
          border-radius: 4px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #000);
        }
        .checkbox-row {
          flex-direction: row;
          align-items: center;
          gap: 8px;
        }
      </style>
      <div class="card-config">
        <div class="row">
          <label>Entity (Required)</label>
          <input type="text" id="entity" value="${config.entity || ''}">
        </div>
        
        <div class="row">
          <label>Attribute (Optional)</label>
          <input type="text" id="attribute" value="${config.attribute || ''}">
        </div>

        <div class="row">
          <label>Title</label>
          <input type="text" id="title" value="${config.title || ''}">
        </div>

        <div class="row">
          <label>Theme</label>
          <select id="theme">
            <option value="classic" ${config.theme === 'classic' ? 'selected' : ''}>Classic</option>
            <option value="ios-light" ${config.theme === 'ios-light' ? 'selected' : ''}>iOS Light</option>
            <option value="ios-dark" ${config.theme === 'ios-dark' ? 'selected' : ''}>iOS Dark</option>
            <option value="neon" ${config.theme === 'neon' ? 'selected' : ''}>Neon</option>
            <option value="wood" ${config.theme === 'wood' ? 'selected' : ''}>Wood</option>
            <option value="red" ${config.theme === 'red' ? 'selected' : ''}>Red</option>
            <option value="aviation-departure" ${config.theme === 'aviation-departure' ? 'selected' : ''}>Aviation Departure</option>
          </select>
        </div>

        <div class="row">
          <label>Size (px)</label>
          <input type="number" id="size" value="${config.size || 50}">
        </div>

        <div class="row">
          <label>Digit Count</label>
          <input type="number" id="digit_count" value="${config.digit_count || 4}">
        </div>

        <div class="row">
          <label>Gap (px)</label>
          <input type="number" id="gap" value="${config.gap || 5}">
        </div>

        <div class="row">
          <label>Unit Position</label>
          <select id="unit_pos">
            <option value="none" ${config.unit_pos === 'none' ? 'selected' : ''}>None (Inside)</option>
            <option value="top" ${config.unit_pos === 'top' ? 'selected' : ''}>Top</option>
            <option value="bottom" ${config.unit_pos === 'bottom' ? 'selected' : ''}>Bottom</option>
          </select>
        </div>

        <div class="row">
          <label>Manual Unit (Optional)</label>
          <input type="text" id="unit" value="${config.unit || ''}">
        </div>

        <div class="row">
          <label>Animation Speed (s)</label>
          <input type="number" step="0.1" id="speed" value="${config.speed || 0.6}">
        </div>

        <div class="row">
          <label>Spin Speed (s)</label>
          <input type="number" step="0.01" id="spin_speed" value="${config.spin_speed || 0.12}">
        </div>
        
        <div class="row checkbox-row">
          <input type="checkbox" id="demo_mode" ${config.demo_mode ? 'checked' : ''}>
          <label for="demo_mode">Demo Mode</label>
        </div>
      </div>
    `;

    this.shadowRoot.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('change', this._valueChanged.bind(this));
    });
  }

  _valueChanged(ev) {
    if (!this._config || !this.shadowRoot) return;
    const target = ev.target;
    const configValue = target.type === 'checkbox' ? target.checked : target.value;
    const configKey = target.id;
    
    // Numeric conversion
    let finalValue = configValue;
    if (['size', 'digit_count', 'gap', 'speed', 'spin_speed', 'remove_speed'].includes(configKey)) {
        finalValue = Number(configValue);
    }

    if (this._config[configKey] === finalValue) return;

    const newConfig = {
      ...this._config,
      [configKey]: finalValue,
    };
    
    // Remove empty optional strings
    if (typeof finalValue === 'string' && finalValue.trim() === '') {
        delete newConfig[configKey];
    }

    this.configChanged(newConfig);
  }
}

customElements.define('flip-sensor-card-editor', FlipSensorCardEditor);
customElements.define('flip-sensor-card', FlipSensorCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "flip-sensor-card",
  name: "Flip Sensor Card",
  preview: true,
  description: "A mechanical flip display for sensor values"
});
