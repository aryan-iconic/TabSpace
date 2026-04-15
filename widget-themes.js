/**
 * TabSpace — Widget Theming System
 * widget-themes.js
 *
 * Provides 20+ themes for individual widget styling.
 * Drop-in addition to main.js — no breaking changes.
 *
 * HOW TO INTEGRATE:
 * 1. Add <script src="widget-themes.js"></script> to newtab.html (before closing </body>)
 * 2. Add <link rel="stylesheet" href="widget-themes.css"> to newtab.html <head>
 * 3. In createWidgetEl(), after `el.className = 'widget';` add:
 *      WidgetThemes.applyToElement(el, id, data);
 * 4. In addWidget(), inside the widgets[id] = {...} object, spread incoming data's widgetTheme:
 *      data: data || {}   <-- already done, widgetTheme lives inside data
 * 5. In edit mode, add a "🎨" button per widget:
 *      const themeBtn = DOM.create('div');
 *      themeBtn.className = 'widget-btn';
 *      themeBtn.innerHTML = '🎨';
 *      themeBtn.title = 'Style';
 *      themeBtn.onclick = () => WidgetThemes.openPanel(id);
 *      controls.appendChild(themeBtn);  // before controlsBtn
 * 6. Inside saveState(), widgetTheme is already part of data, so no extra work needed.
 */

// ============================================================
// THEME DEFINITIONS — 20 themes across 7 categories
// Each theme defines CSS variables applied inline to a .widget
// ============================================================
const WIDGET_THEME_CATALOG = {

  // ── GLASS (default look) ──────────────────────────────────
  glass: {
    label: 'Glass', icon: '🪟', category: 'Minimal',
    vars: {
      '--wt-bg':      'rgba(10,10,20,0.55)',
      '--wt-border':  'rgba(255,255,255,0.10)',
      '--wt-text':    'var(--text)',
      '--wt-muted':   'var(--text-muted)',
      '--wt-accent':  'var(--accent)',
      '--wt-radius':  '16px',
      '--wt-blur':    'var(--glass-blur)',
      '--wt-shadow':  'none',
    },
  },

  // ── MINIMAL ───────────────────────────────────────────────
  minimal: {
    label: 'Minimal', icon: '⬜', category: 'Minimal',
    vars: {
      '--wt-bg':      'rgba(255,255,255,0.04)',
      '--wt-border':  'rgba(255,255,255,0.06)',
      '--wt-text':    '#e8e8f0',
      '--wt-muted':   'rgba(232,232,240,0.45)',
      '--wt-accent':  '#ffffff',
      '--wt-radius':  '8px',
      '--wt-blur':    '4px',
      '--wt-shadow':  'none',
    },
  },

  ghost: {
    label: 'Ghost', icon: '👻', category: 'Minimal',
    vars: {
      '--wt-bg':      'rgba(255,255,255,0.02)',
      '--wt-border':  'rgba(255,255,255,0.04)',
      '--wt-text':    'rgba(255,255,255,0.75)',
      '--wt-muted':   'rgba(255,255,255,0.35)',
      '--wt-accent':  'rgba(255,255,255,0.6)',
      '--wt-radius':  '20px',
      '--wt-blur':    '2px',
      '--wt-shadow':  'none',
    },
  },

  // ── NEON ─────────────────────────────────────────────────
  neon: {
    label: 'Neon', icon: '💜', category: 'Neon',
    vars: {
      '--wt-bg':      'rgba(10,0,30,0.85)',
      '--wt-border':  '#b026ff',
      '--wt-text':    '#e8d5ff',
      '--wt-muted':   'rgba(232,213,255,0.5)',
      '--wt-accent':  '#b026ff',
      '--wt-radius':  '12px',
      '--wt-blur':    '20px',
      '--wt-shadow':  '0 0 18px rgba(176,38,255,0.45), inset 0 0 30px rgba(176,38,255,0.05)',
    },
  },

  neonGreen: {
    label: 'Cyber Green', icon: '💚', category: 'Neon',
    vars: {
      '--wt-bg':      'rgba(0,20,10,0.88)',
      '--wt-border':  '#00ff88',
      '--wt-text':    '#afffcf',
      '--wt-muted':   'rgba(175,255,207,0.5)',
      '--wt-accent':  '#00ff88',
      '--wt-radius':  '6px',
      '--wt-blur':    '16px',
      '--wt-shadow':  '0 0 20px rgba(0,255,136,0.35), inset 0 0 30px rgba(0,255,136,0.05)',
    },
  },

  neonPink: {
    label: 'Neon Pink', icon: '🩷', category: 'Neon',
    vars: {
      '--wt-bg':      'rgba(25,0,20,0.88)',
      '--wt-border':  '#ff2d87',
      '--wt-text':    '#ffd6ec',
      '--wt-muted':   'rgba(255,214,236,0.5)',
      '--wt-accent':  '#ff2d87',
      '--wt-radius':  '12px',
      '--wt-blur':    '18px',
      '--wt-shadow':  '0 0 20px rgba(255,45,135,0.4), inset 0 0 30px rgba(255,45,135,0.05)',
    },
  },

  neonBlue: {
    label: 'Neon Blue', icon: '🔵', category: 'Neon',
    vars: {
      '--wt-bg':      'rgba(0,10,30,0.88)',
      '--wt-border':  '#00b4ff',
      '--wt-text':    '#c8eeff',
      '--wt-muted':   'rgba(200,238,255,0.5)',
      '--wt-accent':  '#00b4ff',
      '--wt-radius':  '10px',
      '--wt-blur':    '18px',
      '--wt-shadow':  '0 0 20px rgba(0,180,255,0.38), inset 0 0 28px rgba(0,180,255,0.05)',
    },
  },

  // ── DARK ─────────────────────────────────────────────────
  darkHC: {
    label: 'Dark HC', icon: '⬛', category: 'Dark',
    vars: {
      '--wt-bg':      'rgba(0,0,0,0.92)',
      '--wt-border':  'rgba(255,255,255,0.20)',
      '--wt-text':    '#ffffff',
      '--wt-muted':   'rgba(255,255,255,0.55)',
      '--wt-accent':  '#ffffff',
      '--wt-radius':  '10px',
      '--wt-blur':    '0px',
      '--wt-shadow':  '0 0 0 1px rgba(255,255,255,0.12)',
    },
  },

  slate: {
    label: 'Slate', icon: '🪨', category: 'Dark',
    vars: {
      '--wt-bg':      'rgba(30,35,45,0.92)',
      '--wt-border':  'rgba(100,120,150,0.25)',
      '--wt-text':    '#cdd5e0',
      '--wt-muted':   'rgba(205,213,224,0.45)',
      '--wt-accent':  '#7eb3ff',
      '--wt-radius':  '12px',
      '--wt-blur':    '12px',
      '--wt-shadow':  '0 8px 32px rgba(0,0,0,0.5)',
    },
  },

  obsidian: {
    label: 'Obsidian', icon: '🖤', category: 'Dark',
    vars: {
      '--wt-bg':      'rgba(18,18,22,0.96)',
      '--wt-border':  'rgba(80,80,100,0.3)',
      '--wt-text':    '#d4d4d8',
      '--wt-muted':   'rgba(212,212,216,0.4)',
      '--wt-accent':  '#a78bfa',
      '--wt-radius':  '14px',
      '--wt-blur':    '0px',
      '--wt-shadow':  '0 4px 24px rgba(0,0,0,0.6)',
    },
  },

  // ── LOVE / WARM ───────────────────────────────────────────
  love: {
    label: 'Love', icon: '❤️', category: 'Love',
    vars: {
      '--wt-bg':      'rgba(60,10,25,0.82)',
      '--wt-border':  'rgba(255,100,130,0.35)',
      '--wt-text':    '#ffe4ed',
      '--wt-muted':   'rgba(255,228,237,0.5)',
      '--wt-accent':  '#ff6b9d',
      '--wt-radius':  '20px',
      '--wt-blur':    '20px',
      '--wt-shadow':  '0 8px 32px rgba(255,80,120,0.2)',
    },
  },

  rose: {
    label: 'Rose Gold', icon: '🌹', category: 'Love',
    vars: {
      '--wt-bg':      'rgba(50,20,25,0.80)',
      '--wt-border':  'rgba(212,160,140,0.30)',
      '--wt-text':    '#f5d6d0',
      '--wt-muted':   'rgba(245,214,208,0.5)',
      '--wt-accent':  '#e8a598',
      '--wt-radius':  '18px',
      '--wt-blur':    '16px',
      '--wt-shadow':  '0 8px 28px rgba(200,100,80,0.2)',
    },
  },

  // ── ANIME ─────────────────────────────────────────────────
  anime: {
    label: 'Anime', icon: '🌸', category: 'Anime',
    vars: {
      '--wt-bg':      'rgba(255,200,230,0.18)',
      '--wt-border':  'rgba(255,150,200,0.35)',
      '--wt-text':    '#fff0f8',
      '--wt-muted':   'rgba(255,200,230,0.6)',
      '--wt-accent':  '#ff85c2',
      '--wt-radius':  '22px',
      '--wt-blur':    '22px',
      '--wt-shadow':  '0 8px 32px rgba(255,100,180,0.25)',
    },
  },

  sakura: {
    label: 'Sakura', icon: '🌺', category: 'Anime',
    vars: {
      '--wt-bg':      'rgba(255,240,248,0.15)',
      '--wt-border':  'rgba(255,182,193,0.4)',
      '--wt-text':    '#ffe8f4',
      '--wt-muted':   'rgba(255,200,220,0.55)',
      '--wt-accent':  '#ffb7d5',
      '--wt-radius':  '24px',
      '--wt-blur':    '24px',
      '--wt-shadow':  '0 4px 24px rgba(255,150,200,0.2)',
    },
  },

  midnight: {
    label: 'Midnight Anime', icon: '🌙', category: 'Anime',
    vars: {
      '--wt-bg':      'rgba(10,5,30,0.88)',
      '--wt-border':  'rgba(140,100,255,0.35)',
      '--wt-text':    '#e0d8ff',
      '--wt-muted':   'rgba(224,216,255,0.45)',
      '--wt-accent':  '#9f7aea',
      '--wt-radius':  '16px',
      '--wt-blur':    '20px',
      '--wt-shadow':  '0 4px 28px rgba(120,80,255,0.25)',
    },
  },

  // ── NATURE ───────────────────────────────────────────────
  forest: {
    label: 'Forest', icon: '🌲', category: 'Nature',
    vars: {
      '--wt-bg':      'rgba(10,30,15,0.85)',
      '--wt-border':  'rgba(60,180,80,0.25)',
      '--wt-text':    '#d4f0da',
      '--wt-muted':   'rgba(212,240,218,0.45)',
      '--wt-accent':  '#4ade80',
      '--wt-radius':  '14px',
      '--wt-blur':    '16px',
      '--wt-shadow':  '0 6px 28px rgba(0,80,20,0.3)',
    },
  },

  ocean: {
    label: 'Ocean', icon: '🌊', category: 'Nature',
    vars: {
      '--wt-bg':      'rgba(0,20,50,0.82)',
      '--wt-border':  'rgba(30,150,220,0.25)',
      '--wt-text':    '#c8e8ff',
      '--wt-muted':   'rgba(200,232,255,0.45)',
      '--wt-accent':  '#38bdf8',
      '--wt-radius':  '16px',
      '--wt-blur':    '20px',
      '--wt-shadow':  '0 6px 28px rgba(0,60,120,0.35)',
    },
  },

  // ── RETRO ────────────────────────────────────────────────
  retro: {
    label: 'Retro', icon: '🕹️', category: 'Retro',
    vars: {
      '--wt-bg':      'rgba(20,10,5,0.92)',
      '--wt-border':  'rgba(255,140,0,0.4)',
      '--wt-text':    '#ffe8b0',
      '--wt-muted':   'rgba(255,232,176,0.45)',
      '--wt-accent':  '#ff8c00',
      '--wt-radius':  '4px',
      '--wt-blur':    '0px',
      '--wt-shadow':  '4px 4px 0 rgba(255,140,0,0.5)',
    },
  },

  terminal: {
    label: 'Terminal', icon: '💻', category: 'Retro',
    vars: {
      '--wt-bg':      'rgba(0,10,0,0.96)',
      '--wt-border':  'rgba(0,255,60,0.25)',
      '--wt-text':    '#00ff3c',
      '--wt-muted':   'rgba(0,255,60,0.45)',
      '--wt-accent':  '#00ff3c',
      '--wt-radius':  '4px',
      '--wt-blur':    '0px',
      '--wt-shadow':  '0 0 16px rgba(0,255,60,0.2)',
    },
  },

  vapor: {
    label: 'Vaporwave', icon: '🌆', category: 'Retro',
    vars: {
      '--wt-bg':      'rgba(30,0,40,0.85)',
      '--wt-border':  'rgba(255,100,200,0.30)',
      '--wt-text':    '#f0c0ff',
      '--wt-muted':   'rgba(240,192,255,0.45)',
      '--wt-accent':  '#ff71ce',
      '--wt-radius':  '0px',
      '--wt-blur':    '10px',
      '--wt-shadow':  '4px 4px 0 #01cdfe, -4px -4px 0 #ff71ce',
    },
  },
};

// Categories for grouped display
const WIDGET_THEME_CATEGORIES = ['Minimal', 'Neon', 'Dark', 'Love', 'Anime', 'Nature', 'Retro'];


// ============================================================
// WIDGET THEMES ENGINE
// ============================================================
const WidgetThemes = (() => {

  // ── Per-widget style overrides (stored in widgets[id].data.widgetStyle) ──
  // widgetStyle = {
  //   themeId: 'neon',
  //   customBg: null,        // hex or rgba string override
  //   customAccent: null,    // hex override
  //   fontSize: 'md',        // 'sm' | 'md' | 'lg'
  //   opacity: 1.0,          // 0.3 – 1.0
  //   borderRadius: null,    // px override (null = use theme)
  // }

  const FONT_SCALES = { sm: '0.85', md: '1', lg: '1.2' };
  
  // Debug flag - set to true to see console logs
  const DEBUG = true;
  function debug(...args) {
    if (DEBUG) console.log('[TabSpace:WidgetThemes]', ...args);
  }

  /** Apply current widgetStyle to a DOM element */
  function applyToElement(el, id, data) {
    try {
      if (!el) {
        debug('applyToElement: element not found for id', id);
        return;
      }
      
      const style = data?.widgetStyle || {};
      const themeId = style.themeId || 'glass';
      console.log('[WT] applyToElement called - id:', id, 'opacity in style:', style.opacity);
      const theme = WIDGET_THEME_CATALOG[themeId] || WIDGET_THEME_CATALOG.glass;
      
      if (!theme) {
        debug('Theme not found:', themeId, 'falling back to glass');
        const theme = WIDGET_THEME_CATALOG.glass;
      }

      debug('Applying theme to', id, '- themeId:', themeId);

      // Apply all theme CSS vars to element (sets CSS custom properties)
      Object.entries(theme.vars).forEach(([k, v]) => {
        el.style.setProperty(k, v);
      });

      // Custom overrides FIRST (before using them)
      if (style.customBg)     el.style.setProperty('--wt-bg',     style.customBg);
      if (style.customAccent) el.style.setProperty('--wt-accent', style.customAccent);
      if (style.customFontColor) {
        el.style.setProperty('--wt-text', style.customFontColor);
        const content = el.querySelector('.widget-content');
        if (content) content.style.color = style.customFontColor;
      }
      
      // Apply muted color
      const mutedColor = style.customSubFontColor || theme.vars['--wt-muted'];
      if (mutedColor) {
        console.log('[WT] Applying muted color:', mutedColor, 'customSubFont:', style.customSubFontColor);
        el.style.setProperty('--wt-muted', mutedColor);
      }
      
      // Apply muted color directly to known secondary text elements
      const secondarySelectors = [
        '.clock-date', '.clock-tz', '.weather-desc', '.weather-loc',
        '.widget-subtitle', '.widget-meta'
      ];
      secondarySelectors.forEach(sel => {
        const elements = el.querySelectorAll(sel);
        if (elements.length > 0 && mutedColor) {
          console.log('[WT] Found', elements.length, sel, 'elements, applying color:', mutedColor);
          elements.forEach(elem => {
            elem.style.color = mutedColor;
          });
        }
      });

      // NOW apply background with opacity modification
      const bgColor = style.customBg || theme.vars['--wt-bg'];
      const opacityVal = style.opacity ?? 1;
      
      console.log('[WT] Background color:', bgColor, 'Opacity:', opacityVal);
      
      // Modify background opacity if less than 1
      let finalBgColor = bgColor;
      if (opacityVal < 1 && bgColor && bgColor.includes('rgba')) {
        const rgbaMatch = bgColor.match(/rgba\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);
        if (rgbaMatch) {
          const [_, r, g, b, originalAlpha] = rgbaMatch;
          const newAlpha = parseFloat(originalAlpha) * opacityVal;
          finalBgColor = `rgba(${r}, ${g}, ${b}, ${newAlpha})`;
          console.log('[WT] Modified background rgba - original alpha:', originalAlpha, 'new alpha:', newAlpha);
        }
      }

      // Apply to actual widget element
      el.style.background     = finalBgColor;
      el.style.borderColor    = 'var(--wt-border)';
      el.style.borderWidth    = '1px';
      el.style.borderStyle    = 'solid';
      el.style.borderRadius   = style.borderRadius != null
        ? style.borderRadius + 'px'
        : 'var(--wt-radius)';
      el.style.boxShadow      = 'var(--wt-shadow)';
      el.style.color          = 'var(--wt-text)';
      el.style.backdropFilter = `blur(var(--wt-blur))`;
      el.style.webkitBackdropFilter = `blur(var(--wt-blur))`;

      // Font scale
      const scale = FONT_SCALES[style.fontSize || 'md'];
      if (scale !== '1') {
        el.style.fontSize = `calc(1em * ${scale})`;
      }
      
      // Force widget-content to inherit colors
      const content = el.querySelector('.widget-content');
      if (content) {
        content.style.color = 'inherit';
      }
      
      debug('Theme applied successfully');
    } catch(e) {
      console.error('[TabSpace:WidgetThemes] applyToElement failed', e);
    }
  }

  /** Re-apply theme to existing widget (call after style change) */
  function refresh(id) {
    console.log('[WT] refresh() called for id:', id);
    const el = document.getElementById(id);
    if (!el) {
      console.error('[WT] refresh: element not found for id:', id);
      return;
    }
    if (typeof widgets === 'undefined' || !widgets?.[id]) {
      console.error('[WT] refresh: widget data not found for id:', id);
      return;
    }
    console.log('[WT] refresh: calling applyToElement with style:', widgets[id].data?.widgetStyle);
    applyToElement(el, id, widgets[id].data);
  }

  /** Save style to widget data & persist */
  function saveStyle(id, stylePatch) {
    debug('saveStyle called for', id, stylePatch);
    
    // Access global widgets variable (not window.widgets!)
    if (typeof widgets === 'undefined') {
      console.error('[WT] ERROR: widgets global not available');
      return;
    }
    
    if (!widgets || !widgets[id]) {
      console.error('[WT] Widget not found:', id);
      return;
    }
    
    const data = widgets[id].data;
    if (!data) {
      console.error('[WT] Widget data not found:', id);
      return;
    }
    
    // Merge with existing widgetStyle
    data.widgetStyle = { ...(data.widgetStyle || {}), ...stylePatch };
    console.log('[WT] Updated widgetStyle:', data.widgetStyle);
    
    // Refresh immediately
    console.log('[WT] Calling refresh for', id);
    refresh(id);
    
    // Save state (with fallbacks)
    if (typeof debouncedSaveState === 'function') {
      debouncedSaveState();
      debug('State saved via debouncedSaveState');
    } else {
      debug('debouncedSaveState not available');
    }
    
    // Show notification (with fallback)
    if (typeof showNotification === 'function') {
      showNotification('🎨 Style applied');
    } else {
      debug('showNotification not available');
    }
  }

  // ── Panel UI ─────────────────────────────────────────────

  let _currentId = null;

  function openPanel(id) {
    _currentId = id;
    closePanel(); // remove old if any

    // Access global widgets variable properly
    const style = (typeof widgets !== 'undefined' && widgets[id]?.data?.widgetStyle) ? widgets[id].data.widgetStyle : {};
    const currentThemeId = (style.themeId && WIDGET_THEME_CATALOG[style.themeId]) ? style.themeId : 'glass';
    
    debug('openPanel for', id, 'current theme:', currentThemeId);

    // Build theme grid rows per category
    let themeGridHTML = '';
    WIDGET_THEME_CATEGORIES.forEach(cat => {
      const themes = Object.entries(WIDGET_THEME_CATALOG).filter(([tid, t]) => {
        return t && t.category === cat;  // Explicit check that theme object exists
      });
      
      if (!themes.length) {
        debug('No themes found for category:', cat);
        return;
      }
      
      themeGridHTML += `<div class="wt-cat-label">${cat}</div><div class="wt-theme-row">`;
      themes.forEach(([tid, theme]) => {
        if (!theme || !theme.label) {
          debug('Skipping invalid theme:', tid);
          return;
        }
        const active = tid === currentThemeId ? 'wt-chip--active' : '';
        themeGridHTML += `
          <button class="wt-chip ${active}" data-wt-theme="${tid}" title="${theme.label}">
            <span class="wt-chip-icon">${theme.icon || '◾'}</span>
            <span class="wt-chip-name">${theme.label}</span>
          </button>`;
      });
      themeGridHTML += '</div>';
    });

    const panel = document.createElement('div');
    panel.id = 'wt-panel';
    panel.className = 'wt-panel';
    panel.innerHTML = `
      <div class="wt-panel-header">
        <span>🎨 Widget Style</span>
        <button class="wt-close" id="wt-close-btn">✕</button>
      </div>
      <div class="wt-panel-body">

        <div class="wt-section-title">Themes</div>
        <div class="wt-theme-grid">${themeGridHTML}</div>

        <div class="wt-section-title" style="margin-top:14px;">Custom Colors</div>
        <div class="wt-row">
          <label class="wt-label">Background</label>
          <input type="color" class="wt-color-input" id="wt-custom-bg"
            value="${hexFromVar(style.customBg, '#0a0a14')}"
            title="Custom background color">
          <button class="wt-clear-btn" data-wt-clear="customBg">✕</button>
        </div>
        <div class="wt-row">
          <label class="wt-label">Accent</label>
          <input type="color" class="wt-color-input" id="wt-custom-accent"
            value="${hexFromVar(style.customAccent, '#e040fb')}"
            title="Custom accent color">
          <button class="wt-clear-btn" data-wt-clear="customAccent">✕</button>
        </div>        <div class="wt-row">
          <label class="wt-label">Font Color</label>
          <input type="color" class="wt-color-input" id="wt-custom-font"
            value="${hexFromVar(style.customFontColor, '#e8e8f0')}"
            title="Custom font/text color">
          <button class="wt-clear-btn" data-wt-clear="customFontColor">✕</button>
        </div>
        <div class="wt-row">
          <label class="wt-label">Sub Font Color</label>
          <input type="color" class="wt-color-input" id="wt-custom-subfont"
            value="${hexFromVar(style.customSubFontColor, '#cacad2')}"
            title="Secondary text (dates, location, etc.) color">
          <button class="wt-clear-btn" data-wt-clear="customSubFontColor">✕</button>
        </div>
        <div class="wt-section-title" style="margin-top:14px;">Typography & Layout</div>
        <div class="wt-row">
          <label class="wt-label">Font Size</label>
          <div class="wt-btn-group">
            <button class="wt-sz ${(style.fontSize||'md')==='sm'?'wt-sz--active':''}" data-wt-size="sm">S</button>
            <button class="wt-sz ${(style.fontSize||'md')==='md'?'wt-sz--active':''}" data-wt-size="md">M</button>
            <button class="wt-sz ${(style.fontSize||'md')==='lg'?'wt-sz--active':''}" data-wt-size="lg">L</button>
          </div>
        </div>
        <div class="wt-row">
          <label class="wt-label">Opacity</label>
          <input type="range" class="wt-range" id="wt-opacity"
            min="0.2" max="1" step="0.05" value="${style.opacity ?? 1}">
          <span class="wt-range-val" id="wt-opacity-val">${Math.round((style.opacity ?? 1) * 100)}%</span>
        </div>
        <div class="wt-row">
          <label class="wt-label">Roundness</label>
          <input type="range" class="wt-range" id="wt-radius"
            min="0" max="32" step="1"
            value="${style.borderRadius ?? 16}">
          <span class="wt-range-val" id="wt-radius-val">${style.borderRadius ?? 16}px</span>
        </div>

        <div style="margin-top:14px;display:flex;gap:8px;">
          <button class="wt-action-btn" id="wt-reset-btn">↺ Reset</button>
          <button class="wt-action-btn wt-action-btn--primary" id="wt-done-btn">✓ Done</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // Position near widget
    const widgetEl = document.getElementById(id);
    if (widgetEl) {
      const rect = widgetEl.getBoundingClientRect();
      const panelW = 280;
      let left = rect.right + 12;
      if (left + panelW > window.innerWidth - 10) left = rect.left - panelW - 12;
      panel.style.left = Math.max(10, left) + 'px';
      panel.style.top  = Math.max(10, Math.min(rect.top, window.innerHeight - panel.offsetHeight - 10)) + 'px';
    }

    // ── Bind events ──
    panel.querySelector('#wt-close-btn').onclick = closePanel;
    panel.querySelector('#wt-done-btn').onclick  = closePanel;

    // Theme chips
    panel.querySelectorAll('[data-wt-theme]').forEach(btn => {
      btn.onclick = () => {
        panel.querySelectorAll('.wt-chip').forEach(b => b.classList.remove('wt-chip--active'));
        btn.classList.add('wt-chip--active');
        saveStyle(id, { themeId: btn.dataset.wtTheme });
      };
    });

    // Color pickers
    const bgInput = panel.querySelector('#wt-custom-bg');
    const accentInput = panel.querySelector('#wt-custom-accent');
    const fontInput = panel.querySelector('#wt-custom-font');
    const subfontInput = panel.querySelector('#wt-custom-subfont');
    bgInput.oninput     = () => saveStyle(id, { customBg: bgInput.value });
    accentInput.oninput = () => saveStyle(id, { customAccent: accentInput.value });
    fontInput.oninput   = () => saveStyle(id, { customFontColor: fontInput.value });
    subfontInput.oninput = () => saveStyle(id, { customSubFontColor: subfontInput.value });

    // Clear custom colors
    panel.querySelectorAll('[data-wt-clear]').forEach(btn => {
      btn.onclick = () => {
        const key = btn.dataset.wtClear;
        saveStyle(id, { [key]: null });
      };
    });

    // Font size
    panel.querySelectorAll('[data-wt-size]').forEach(btn => {
      btn.onclick = () => {
        panel.querySelectorAll('.wt-sz').forEach(b => b.classList.remove('wt-sz--active'));
        btn.classList.add('wt-sz--active');
        saveStyle(id, { fontSize: btn.dataset.wtSize });
      };
    });

    // Opacity slider
    const opacitySlider = panel.querySelector('#wt-opacity');
    const opacityVal    = panel.querySelector('#wt-opacity-val');
    opacitySlider.oninput = () => {
      const v = parseFloat(opacitySlider.value);
      console.log('[WT] Opacity slider input - value:', v);
      opacityVal.textContent = Math.round(v * 100) + '%';
      console.log('[WT] Calling saveStyle with opacity:', v);
      saveStyle(id, { opacity: v });
    };

    // Radius slider
    const radiusSlider = panel.querySelector('#wt-radius');
    const radiusVal    = panel.querySelector('#wt-radius-val');
    radiusSlider.oninput = () => {
      const v = parseInt(radiusSlider.value);
      radiusVal.textContent = v + 'px';
      saveStyle(id, { borderRadius: v });
    };

    // Reset
    panel.querySelector('#wt-reset-btn').onclick = () => {
      saveStyle(id, { themeId: 'glass', customBg: null, customAccent: null, customFontColor: null,
                      customSubFontColor: null, fontSize: 'md', opacity: 1, borderRadius: null });
      closePanel();
      openPanel(id);
    };

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', _outsideClick);
    }, 50);
  }

  function _outsideClick(e) {
    const panel = document.getElementById('wt-panel');
    if (panel && !panel.contains(e.target) && !e.target.closest('.widget-btn')) {
      closePanel();
    }
  }

  function closePanel() {
    const panel = document.getElementById('wt-panel');
    if (panel) panel.remove();
    document.removeEventListener('click', _outsideClick);
  }

  // Helper: extract a usable hex from a possibly rgba/var() string
  function hexFromVar(val, fallback) {
    if (!val) return fallback;
    if (/^#[0-9a-f]{6}/i.test(val)) return val;
    return fallback;
  }

  return { applyToElement, refresh, saveStyle, openPanel, closePanel, CATALOG: WIDGET_THEME_CATALOG };
})();

// Explicitly expose to window for debugging and external access
window.WidgetThemes = WidgetThemes;
window.__wtDebug = true;

// Global debug helper
window.__wtLog = function(...args) {
  if (window.__wtDebug) console.log('[TabSpace:WidgetThemes]', ...args);
};

if (typeof window !== 'undefined') {
  console.log('[TabSpace:WidgetThemes] ✅ Widget Theming System loaded');
  console.log('[TabSpace:WidgetThemes] WidgetThemes API available:', typeof WidgetThemes);
  console.log('[TabSpace:WidgetThemes] Themes count:', Object.keys(WidgetThemes.CATALOG).length);
}


// ============================================================
// AUTO-INTEGRATE HOOK
// Patches createWidgetEl to inject themes automatically.
// ============================================================
(function initializePatching() {
  window.__wtLog('Initializing createWidgetEl patching...');
  
  // This runs after main.js is loaded (as evidenced by script order in HTML)
  const attemptPatch = () => {
    if (typeof createWidgetEl !== 'function') {
      window.__wtLog('createWidgetEl not ready, retrying in 100ms');
      setTimeout(attemptPatch, 100);
      return;
    }

    // Guard against double-patching
    if (window.__wtPatched) {
      window.__wtLog('Already patched, skipping');
      return;
    }

    window.__wtLog('createWidgetEl found, applying patch');
    const originalCreateWidgetEl = window.createWidgetEl;

    function patchedCreateWidgetEl(type, x, y, w, h, data, id) {
      // Call the original function
      originalCreateWidgetEl.call(this, type, x, y, w, h, data, id);
      
      // After the widget is created, apply theme and inject style button
      setTimeout(() => {
        try {
          const el = document.getElementById(id);
          if (!el) {
            window.__wtLog('Element not found after creation:', id);
            return;
          }
          
          window.__wtLog('Applying theme and style button to new widget:', id);
          
          // Apply theme
          if (typeof WidgetThemes !== 'undefined' && typeof WidgetThemes.applyToElement === 'function') {
            WidgetThemes.applyToElement(el, id, data || {});
          } else {
            console.warn('[TabSpace:WidgetThemes] WidgetThemes.applyToElement not available yet');
          }
          
          // Inject style button
          if (typeof _injectStyleBtn === 'function') {
            _injectStyleBtn(id);
          }
        } catch(e) {
          console.error('[TabSpace:WidgetThemes] Patch error:', e);
        }
      }, 0);  // Use 0 to run after DOM is updated but before next frame
    }

    // Copy properties from original to patched
    patchedCreateWidgetEl.__wtOriginal = originalCreateWidgetEl;
    
    // Replace the global function
    window.createWidgetEl = patchedCreateWidgetEl;
    window.__wtPatched = true;
    
    window.__wtLog('✅ createWidgetEl successfully patched');
  };
  
  attemptPatch();
})();

/** Inject a style button into a widget's controls bar */
function _injectStyleBtn(id) {
  try {
    const controls = document.querySelector(`#${id} .widget-controls`);
    if (!controls) {
      window.__wtLog('widget-controls not found for', id);
      return;
    }
    
    // Check if already injected
    if (controls.querySelector('.wt-style-btn')) {
      window.__wtLog('Style button already exists for', id);
      return;
    }

    const btn = document.createElement('div');
    btn.className = 'widget-btn wt-style-btn';
    btn.innerHTML = '🎨';
    btn.title = 'Style widget';
    btn.onclick = (e) => {
      e.stopPropagation();
      if (typeof WidgetThemes !== 'undefined' && typeof WidgetThemes.openPanel === 'function') {
        WidgetThemes.openPanel(id);
      }
    };
    
    controls.insertBefore(btn, controls.firstChild);
    window.__wtLog('Style button injected for', id);
  } catch(e) {
    console.error('[TabSpace:WidgetThemes] _injectStyleBtn error:', e);
  }
}

// Re-apply themes on state restore (when widgets are re-rendered from saved state)
document.addEventListener('DOMContentLoaded', () => {
  window.__wtLog('DOMContentLoaded: Re-applying themes to existing widgets');
  
  setTimeout(() => {
    try {
      if (typeof widgets !== 'undefined' && widgets) {
        window.__wtLog('Found', Object.keys(widgets).length, 'widgets to theme');
        Object.keys(widgets).forEach(id => {
          const el = document.getElementById(id);
          if (el && widgets[id]?.data?.widgetStyle) {
            window.__wtLog('Re-applying theme to existing widget:', id);
            WidgetThemes.applyToElement(el, id, widgets[id].data);
            _injectStyleBtn(id);
          }
        });
      } else {
        window.__wtLog('No widgets found at DOMContentLoaded');
      }
    } catch(e) {
      console.error('[TabSpace:WidgetThemes] DOMContentLoaded error:', e);
    }
  }, 800);
});
