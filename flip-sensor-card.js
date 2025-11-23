class FlipSensorCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // BĘBEN ZNAKÓW
    this.drumChars = [' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ',', ':', '%', '°'];
    
    this.currentDisplayValue = []; 
    this.isDemoRunning = false;
    
    this.surplusStrikeCount = 0;
    this.cleanupThreshold = 3; 

    this.themes = {
        'classic': { bg: '#333', text: '#f0f0f0', radius: '6px', shadow: '0 2px 5px rgba(0,0,0,0.4)', font: "'Oswald', sans-serif", border: 'none', textShadow: 'none' },
        'ios-light': { bg: '#ffffff', text: '#000000', radius: '6px', shadow: '0 4px 10px rgba(0,0,0,0.15)', font: "-apple-system, sans-serif", border: '1px solid #e0e0e0', textShadow: 'none' },
        'ios-dark': { bg: '#1c1c1e', text: '#ffffff', radius: '6px', shadow: '0 4px 10px rgba(0,0,0,0.3)', font: "-apple-system, sans-serif", border: '1px solid #333', textShadow: 'none' },
        'neon': { bg: '#000000', text: '#39ff14', radius: '0px', shadow: '0 0 10px rgba(57, 255, 20, 0.2)', font: "'Courier New', monospace", border: '1px solid #1a1a1a', textShadow: '0 0 5px #39ff14' },
        'wood': { bg: '#5d4037', text: '#efebe9', radius: '4px', shadow: '0 3px 6px rgba(0,0,0,0.4)', font: "'Times New Roman', serif", border: '1px solid #3e2723', textShadow: '0 1px 2px rgba(0,0,0,0.8)' },
        'red': { bg: '#202020', text: '#ff3b30', radius: '4px', shadow: '0 2px 5px rgba(0,0,0,0.5)', font: "'Oswald', sans-serif", border: 'none', textShadow: '0 0 2px #a00000' }
    };
  }

  setConfig(config) {
    if (!config.entity && !config.demo_mode) throw new Error('Podaj encję lub demo_mode: true');
    this.config = config;
    
    this.normalSpeed = config.speed !== undefined ? config.speed : 0.6;
    this.spinSpeed = config.spin_speed !== undefined ? config.spin_speed : 0.12;
    
    // Szybkość usuwania pustych kafelków
    this.removeSpeed = config.remove_speed !== undefined ? config.remove_speed : 0.5;

    // --- POPRAWKA: Aktualizacja zmiennej CSS na żywo ---
    this.style.setProperty('--remove-duration', `${this.removeSpeed}s`);

    this.cardSize = config.size || 50; 
    this.gap = config.gap || 5;
    this.digitCount = config.digit_count || 4; 
    
    this.currentTheme = this.themes[config.theme] || this.themes['classic'];

    if (this.config.demo_mode && !this.isDemoRunning) {
        this.startDemoMode();
    }
  }

  set hass(hass) {
    if (this.config.demo_mode) return;
    const entityId = this.config.entity;
    const stateObj = hass.states[entityId];
    if (!stateObj) return;

    let newState = stateObj.state;
    if (this.config.show_unit && stateObj.attributes.unit_of_measurement) {
         newState += stateObj.attributes.unit_of_measurement;
    }

    if (!this.content) {
      this.render();
      this.updateDisplay(newState, true);
      this.lastState = newState;
    } else if (newState !== this.lastState) {
      this.lastState = newState;
      this.updateDisplay(newState, false);
    }
  }

  async startDemoMode() {
      this.isDemoRunning = true;
      if(!this.content) this.render();
      
      const sequence = ['1234', '12345678', '1111', '22', '33', '4444'];
      let idx = 0;
      await this.updateDisplay(sequence[0], true);

      while (this.isDemoRunning) {
          // Czekamy dłużej niż trwa animacja usuwania
          await new Promise(resolve => setTimeout(resolve, 3000));
          idx = (idx + 1) % sequence.length;
          
          if(idx === 0) {
              this.content.innerHTML = ''; 
              this.currentDisplayValue = [];
              this.surplusStrikeCount = 0;
              await this.updateDisplay(sequence[0], true);
          } else {
              await this.updateDisplay(sequence[idx], false);
          }
      }
  }

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

    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap');
        :host { 
            display: block; 
            --card-size: ${this.cardSize}px; 
            --card-width: calc(var(--card-size) * 0.70); 
            --font-size: calc(var(--card-size) * 0.85); 
            --flip-duration: 0.5s;
            
            /* Zmienna CSS jest teraz ustawiana przez JS w setConfig */
            /* Jeśli nie jest ustawiona, domyślnie 0.5s */
            --remove-duration-internal: var(--remove-duration, 0.5s);
            
            ${themeCSS} 
            ${customOverride} 
        }
        .card-content { display: flex; flex-direction: column; align-items: center; padding: 16px; background: var(--ha-card-background, transparent); }
        .flip-clock { display: flex; justify-content: center; gap: ${this.gap}px; perspective: 1000px; }
        
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
            
            /* Animacje z wykorzystaniem poprawnej zmiennej */
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
            width: 0 !important; 
            flex-basis: 0 !important;
            min-width: 0 !important;
            margin: 0 !important; 
            opacity: 0 !important; 
            transform: scale(0.5);
            border: none !important;
            box-shadow: none !important;
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
        ${this.config.title ? `<div style="margin-bottom:12px; font-weight:500; opacity:0.9;">${this.config.title}</div>` : ''}
        <div id="display" class="flip-clock"></div>
      </div>
    `;
    this.content = this.shadowRoot.getElementById('display');
  }

  createDigitUnit(char) {
    const unit = document.createElement('div');
    unit.className = 'flip-unit';
    unit.innerHTML = `
      <div class="top" data-val="${char}"></div>
      <div class="bottom" data-val="${char}"></div>
      <div class="flap front" data-val="${char}"></div>
      <div class="flap back" data-val="${char}"></div>
    `;
    return unit;
  }

  async updateDisplay(inputRaw, skipAnimation) {
    let input = String(inputRaw);
    const displayEl = this.content;

    let targetLen = Math.max(input.length, this.digitCount);
    let currentLen = displayEl.children.length;

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

    if (excessCount > 0) {
        const surplusPart = paddedInput.substring(0, excessCount);
        const isSurplusEmpty = surplusPart.trim().length === 0;

        if (isSurplusEmpty) {
            this.surplusStrikeCount++;
        } else {
            this.surplusStrikeCount = 0;
        }

        if (this.surplusStrikeCount >= this.cleanupThreshold) {
            const unitsToRemove = [];
            for (let i = 0; i < excessCount; i++) {
                if (displayEl.children[i]) unitsToRemove.push(displayEl.children[i]);
            }

            unitsToRemove.forEach(el => el.classList.add('removing'));

            // WAŻNE: JS czeka na zmienną this.removeSpeed, która jest też w CSS
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

      const currentChar = this.currentDisplayValue[index];
      if (currentChar === targetChar) return Promise.resolve();

      return this.spinDigit(units[index], currentChar, targetChar, index);
    });

    await Promise.all(promises);
  }

  updateStatic(unit, char) {
    unit.querySelector('.top').setAttribute('data-val', char);
    unit.querySelector('.bottom').setAttribute('data-val', char);
    unit.querySelector('.flap.front').setAttribute('data-val', char);
    unit.querySelector('.flap.back').setAttribute('data-val', char);
  }

  async spinDigit(element, startChar, endChar, index) {
    let current = startChar;
    let safety = 0;
    let startIndex = this.drumChars.indexOf(startChar);
    let endIndex = this.drumChars.indexOf(endChar);
    if (startIndex === -1) startIndex = 0;
    if (endIndex === -1) endIndex = 0;

    let distance = endIndex - startIndex;
    if (distance < 0) distance += this.drumChars.length;
    const useSpeed = (distance === 1) ? this.normalSpeed : this.spinSpeed;

    while (current !== endChar && safety < 40) {
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

  flipOnce(element, oldChar, newChar, durationSeconds) {
    return new Promise(resolve => {
        if(!element) { resolve(); return; }
        const top = element.querySelector('.top');
        const bottom = element.querySelector('.bottom');
        const flapFront = element.querySelector('.flap.front');
        const flapBack = element.querySelector('.flap.back');

        element.style.setProperty('--flip-duration', durationSeconds + 's');
        top.setAttribute('data-val', newChar);
        bottom.setAttribute('data-val', oldChar);
        flapFront.setAttribute('data-val', oldChar);
        flapBack.setAttribute('data-val', newChar);

        element.classList.remove('flipping');
        void element.offsetWidth; 
        element.classList.add('flipping');

        setTimeout(() => {
            bottom.setAttribute('data-val', newChar);
            flapFront.setAttribute('data-val', newChar); 
            element.classList.remove('flipping');
            resolve();
        }, durationSeconds * 1000); 
    });
  }

  getCardSize() { return 3; }
}

customElements.define('flip-sensor-card', FlipSensorCard);
