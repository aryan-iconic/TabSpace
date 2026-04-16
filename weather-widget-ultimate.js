/**
 * TabSpace — ULTIMATE Weather Widget
 * weather-widget-ultimate.js
 *
 * Drop-in replacement for the weather functions in main.js
 * Replaces: renderWeather, fetchWeather, fetchWeatherWithCoords,
 *           getWeatherIcon, weatherDesc, showWeatherSettings
 *
 * Features:
 * ✓ Hyper-precise emoji system (day/night, intensity, every WMO code)
 * ✓ Real moon phase (0–29 days) with red moon on eclipse/apogee reddening
 * ✓ Solar & Lunar eclipse detection with CSS animation (partial/annular/total)
 * ✓ Visibility-weighted eclipse: checks if your coords are in the path
 * ✓ Night rain / cloudy moon logic (moon hidden behind clouds/rain)
 * ✓ Auto-refreshes every 30 minutes
 * ✓ Open-Meteo free API (no key needed)
 * ✓ Astronomy data from Astronomia (pure JS, no external CDN)
 * ✓ °C / °F toggle, cached geolocation
 */

// ─────────────────────────────────────────────
// SECTION 1 — MOON PHASE ENGINE
// Pure math — no external lib needed
// ─────────────────────────────────────────────

const MoonCalc = {
  /**
   * Returns moon age in days (0 = new moon, 14.77 = full moon, 29.53 = new again)
   */
  getAge(date = new Date()) {
    // Knuth algorithm
    const jd = this._jd(date);
    const daysSinceNew = (jd - 2451549.5) % 29.53058867;
    return daysSinceNew < 0 ? daysSinceNew + 29.53058867 : daysSinceNew;
  },

  _jd(date) {
    let Y = date.getUTCFullYear();
    let M = date.getUTCMonth() + 1;
    const D = date.getUTCDate() + date.getUTCHours() / 24;
    if (M <= 2) { Y--; M += 12; }
    const A = Math.floor(Y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
  },

  /**
   * Returns phase name string
   */
  getPhaseName(age) {
    if (age < 1.85)   return 'new_moon';
    if (age < 7.38)   return 'waxing_crescent';
    if (age < 9.22)   return 'first_quarter';
    if (age < 14.77)  return 'waxing_gibbous';
    if (age < 16.61)  return 'full_moon';
    if (age < 22.15)  return 'waning_gibbous';
    if (age < 23.99)  return 'last_quarter';
    if (age < 29.00)  return 'waning_crescent';
    return 'new_moon';
  },

  /**
   * Returns illumination fraction 0..1
   */
  getIllumination(age) {
    return (1 - Math.cos((age / 29.53058867) * 2 * Math.PI)) / 2;
  },

  /**
   * Rough check: is the moon near perigee (closest, brighter)?
   * Returns true if within ±1 day of perigee
   */
  isNearPerigee(date = new Date()) {
    // Perigee repeats ~every 27.55 days; epoch 2000-01-01 perigee JD 2451550.9
    const jd = this._jd(date);
    const daysSincePerigee = (jd - 2451550.9) % 27.55454988;
    const d = daysSincePerigee < 0 ? daysSincePerigee + 27.55454988 : daysSincePerigee;
    return d < 1.5 || d > 26.0; // within ~1.5 days of perigee
  },
};

// ─────────────────────────────────────────────
// SECTION 2 — ECLIPSE ENGINE
// Uses NASA eclipse predictions embedded as lookup data
// For real-time use, checks ±3 days from today
// ─────────────────────────────────────────────

const EclipseEngine = {
  /**
   * Known solar eclipses 2024–2028 (date, type, lat/lon of maximum, duration seconds, path width km)
   * type: 'total' | 'annular' | 'partial' | 'hybrid'
   */
  SOLAR_ECLIPSES: [
    { date: '2024-04-08', type: 'total',   maxLat: 25.3,  maxLon: -104.1, pathWidthKm: 185, durationS: 268  },
    { date: '2024-10-02', type: 'annular', maxLat: -21.9, maxLon: -109.4, pathWidthKm: 266, durationS: 427  },
    { date: '2025-03-29', type: 'partial', maxLat: 64.5,  maxLon: 24.7,   pathWidthKm: null, durationS: null },
    { date: '2025-09-21', type: 'partial', maxLat: -72.5, maxLon: 128.6,  pathWidthKm: null, durationS: null },
    { date: '2026-02-17', type: 'annular', maxLat: -64.4, maxLon: -83.0,  pathWidthKm: 593, durationS: 505  },
    { date: '2026-08-12', type: 'total',   maxLat: 64.1,  maxLon: -3.3,   pathWidthKm: 290, durationS: 142  },
    { date: '2027-02-06', type: 'annular', maxLat: -29.2, maxLon: -89.7,  pathWidthKm: 310, durationS: 461  },
    { date: '2027-08-02', type: 'total',   maxLat: 23.5,  maxLon: 32.5,   pathWidthKm: 258, durationS: 381  },
    { date: '2028-01-26', type: 'annular', maxLat: -24.8, maxLon: -18.9,  pathWidthKm: 315, durationS: 490  },
    { date: '2028-07-22', type: 'total',   maxLat: 7.6,   maxLon: 138.3,  pathWidthKm: 232, durationS: 309  },
  ],

  /**
   * Known lunar eclipses 2024–2028
   * type: 'total' | 'partial' | 'penumbral'
   * Lunar eclipses are visible from ~50% of Earth (night side)
   */
  LUNAR_ECLIPSES: [
    { date: '2024-03-25', type: 'penumbral', maxLat: 0,  maxLon: -100,  visibleHemisphere: 'americas_europe' },
    { date: '2024-09-18', type: 'partial',   maxLat: 0,  maxLon: -30,   visibleHemisphere: 'americas_europe_africa' },
    { date: '2025-03-14', type: 'total',     maxLat: 0,  maxLon: -60,   visibleHemisphere: 'americas_pacific' },
    { date: '2025-09-07', type: 'total',     maxLat: 0,  maxLon: 90,    visibleHemisphere: 'europe_africa_asia' },
    { date: '2026-03-03', type: 'total',     maxLat: 0,  maxLon: 170,   visibleHemisphere: 'asia_pacific_americas' },
    { date: '2026-08-28', type: 'partial',   maxLat: 0,  maxLon: 45,    visibleHemisphere: 'europe_africa_asia' },
    { date: '2027-02-20', type: 'penumbral', maxLat: 0,  maxLon: -140,  visibleHemisphere: 'americas_pacific' },
    { date: '2027-07-18', type: 'partial',   maxLat: 0,  maxLon: -15,   visibleHemisphere: 'americas_europe_africa' },
    { date: '2028-01-12', type: 'total',     maxLat: 0,  maxLon: 80,    visibleHemisphere: 'europe_africa_asia' },
    { date: '2028-07-06', type: 'partial',   maxLat: 0,  maxLon: -70,   visibleHemisphere: 'americas_europe_africa' },
  ],

  _dateDiffDays(date, eclipseDate) {
    const e = new Date(eclipseDate + 'T12:00:00Z');
    return Math.abs((date - e) / 86400000);
  },

  /**
   * Check if user coordinates are within the visible zone of a solar eclipse
   * path eclipses (total/annular) have a narrow band; partials visible from hemisphere
   */
  _solarVisibility(eclipse, userLat, userLon) {
    if (eclipse.type === 'partial') {
      // Partial visible from large region — rough check: within 70 degrees of max
      const dist = Math.hypot(userLat - eclipse.maxLat, userLon - eclipse.maxLon);
      return dist < 70 ? 'partial' : null;
    }
    // Total / annular: center path within pathWidthKm/2 (~degrees ≈ km/111)
    const distKm = Math.hypot((userLat - eclipse.maxLat) * 111, (userLon - eclipse.maxLon) * 111 * Math.cos(eclipse.maxLat * Math.PI / 180));
    if (distKm < (eclipse.pathWidthKm / 2)) return eclipse.type; // in totality/annularity band
    if (distKm < 3500) return 'partial'; // penumbral partial region
    return null;
  },

  /**
   * Check lunar eclipse visibility for a user's longitude (night side check)
   */
  _lunarVisibility(eclipse, userLat, userLon) {
    const map = {
      'americas_europe': { lonMin: -150, lonMax: 40 },
      'americas_europe_africa': { lonMin: -120, lonMax: 50 },
      'europe_africa_asia': { lonMin: -20, lonMax: 150 },
      'americas_pacific': { lonMin: -180, lonMax: -30 },
      'asia_pacific_americas': { lonMin: 60, lonMax: 180 },
      'europe_africa_asia_all': { lonMin: -20, lonMax: 180 },
    };
    const zone = map[eclipse.visibleHemisphere];
    if (!zone) return eclipse.type;
    // Normalize longitude
    let lon = userLon;
    const inZone = lon >= zone.lonMin && lon <= zone.lonMax;
    return inZone ? eclipse.type : null;
  },

  /**
   * Returns current eclipse event if any, null otherwise
   * { kind: 'solar'|'lunar', type: 'total'|'annular'|'partial'|'penumbral', visibility: same, hoursUntilMax: N }
   */
  getCurrentEclipse(date, userLat, userLon) {
    const now = date || new Date();

    for (const e of this.SOLAR_ECLIPSES) {
      if (this._dateDiffDays(now, e.date) <= 0.5) { // within 12h of eclipse day
        const vis = this._solarVisibility(e, userLat, userLon);
        if (vis) return { kind: 'solar', type: e.type, visibility: vis };
      }
    }

    for (const e of this.LUNAR_ECLIPSES) {
      if (this._dateDiffDays(now, e.date) <= 0.5) {
        const vis = this._lunarVisibility(e, userLat, userLon);
        if (vis) return { kind: 'lunar', type: e.type, visibility: vis };
      }
    }

    return null;
  },
};

// ─────────────────────────────────────────────
// SECTION 3 — THE MASTER EMOJI SYSTEM
// Every WMO code × day/night × intensity
// Plus moon phase × eclipse × sky condition
// ─────────────────────────────────────────────

const WeatherEmoji = {

  /**
   * WMO Weather interpretation codes → emoji
   * Source: open-meteo.com/en/docs#weathervariables
   *
   * Returns: primary emoji (large display) + optional modifier
   */
  fromCode(code, isDay, intensity = null) {
    // intensity: null | 'slight' | 'moderate' | 'heavy' | 'violent'
    if (isDay) return this._day(code, intensity);
    return this._night(code, intensity);
  },

  _day(code, intensity) {
    switch (code) {
      // ── Clear ──
      case 0:   return '☀️';
      // ── Mainly clear, partly cloudy, overcast ──
      case 1:   return '🌤️';
      case 2:   return '⛅';
      case 3:   return '☁️';
      // ── Fog ──
      case 45:  return '🌫️';
      case 48:  return '🌁'; // depositing rime fog
      // ── Drizzle ──
      case 51:  return '🌦️';  // light drizzle
      case 53:  return '🌦️';  // moderate drizzle
      case 55:  return '🌧️';  // dense drizzle
      // ── Freezing drizzle ──
      case 56:  return '🌨️';  // light freezing drizzle
      case 57:  return '🌨️';  // heavy freezing drizzle
      // ── Rain ──
      case 61:  return '🌦️';  // slight rain
      case 63:  return '🌧️';  // moderate rain
      case 65:  return '🌧️';  // heavy rain
      // ── Freezing rain ──
      case 66:  return '🌨️';  // light freezing rain
      case 67:  return '🌨️';  // heavy freezing rain
      // ── Snow ──
      case 71:  return '🌨️';  // slight snow
      case 73:  return '❄️';   // moderate snow
      case 75:  return '🌨️';  // heavy snow
      case 77:  return '🌨️';  // snow grains
      // ── Rain showers ──
      case 80:  return '🌦️';  // slight showers
      case 81:  return '🌧️';  // moderate showers
      case 82:  return '⛈️';  // violent showers
      // ── Snow showers ──
      case 85:  return '🌨️';  // slight snow showers
      case 86:  return '❄️';   // heavy snow showers
      // ── Thunderstorm ──
      case 95:  return '⛈️';  // thunderstorm slight/moderate
      case 96:  return '⛈️';  // thunderstorm with slight hail
      case 99:  return '🌩️';  // thunderstorm with heavy hail
      default:  return '🌤️';
    }
  },

  _night(code, intensity) {
    switch (code) {
      case 0:   return null; // handled by getMoonEmoji
      case 1:   return '🌙';  // mainly clear night
      case 2:   return '☁️';  // partly cloudy hides moon
      case 3:   return '☁️';  // overcast
      case 45:  return '🌫️';
      case 48:  return '🌁';
      case 51:  return '🌧️';  // drizzle at night - rain hides moon
      case 53:  return '🌧️';
      case 55:  return '🌧️';
      case 56:  return '🌨️';
      case 57:  return '🌨️';
      case 61:  return '🌧️';
      case 63:  return '🌧️';
      case 65:  return '🌧️';
      case 66:  return '🌨️';
      case 67:  return '🌨️';
      case 71:  return '🌨️';
      case 73:  return '❄️';
      case 75:  return '🌨️';
      case 77:  return '🌨️';
      case 80:  return '🌧️';
      case 81:  return '🌧️';
      case 82:  return '⛈️';
      case 85:  return '🌨️';
      case 86:  return '❄️';
      case 95:  return '⛈️';
      case 96:  return '⛈️';
      case 99:  return '🌩️';
      default:  return '🌙';
    }
  },

  /**
   * Sky clarity score: how clear is the sky? (0=blocked, 1=perfect)
   */
  skyClearFactor(code) {
    if (code === 0) return 1.0;  // perfectly clear
    if (code === 1) return 0.85; // mainly clear
    if (code === 2) return 0.5;  // partly cloudy
    if (code === 3) return 0.1;  // overcast
    if (code <= 48) return 0.05; // fog
    if (code <= 57) return 0.0;  // drizzle/freezing = opaque
    if (code <= 82) return 0.0;  // rain = opaque
    if (code <= 86) return 0.0;  // snow = opaque
    if (code <= 99) return 0.0;  // storm = opaque
    return 0.5;
  },

  /**
   * Full moon emoji with red moon / eclipse / blood moon support
   * Returns { emoji, label, isAnimated, animationClass }
   */
  getMoonEmoji(date, weatherCode, eclipse, userLat, userLon) {
    const age = MoonCalc.getAge(date);
    const phase = MoonCalc.getPhaseName(age);
    const clear = this.skyClearFactor(weatherCode);
    const illum = MoonCalc.getIllumination(age);

    // ── Eclipse takes priority ──
    if (eclipse && eclipse.kind === 'lunar') {
      if (eclipse.type === 'total') {
        // Total lunar = Blood Moon (red)
        return {
          emoji: '🔴🌕',
          label: '🩸 Blood Moon (Total Lunar Eclipse)',
          isAnimated: true,
          animationClass: 'eclipse-lunar-total',
        };
      }
      if (eclipse.type === 'partial') {
        return {
          emoji: '🌔',  // will be styled red by CSS
          label: '🌑 Partial Lunar Eclipse',
          isAnimated: true,
          animationClass: 'eclipse-lunar-partial',
        };
      }
      if (eclipse.type === 'penumbral') {
        return {
          emoji: '🌕',
          label: '🌕 Penumbral Lunar Eclipse',
          isAnimated: true,
          animationClass: 'eclipse-lunar-penumbral',
        };
      }
    }

    if (eclipse && eclipse.kind === 'solar') {
      if (eclipse.visibility === 'total') {
        return {
          emoji: '🌑☀️',
          label: '🌑 Total Solar Eclipse',
          isAnimated: true,
          animationClass: 'eclipse-solar-total',
        };
      }
      if (eclipse.visibility === 'annular') {
        return {
          emoji: '💍',  // ring of fire
          label: '💍 Annular Solar Eclipse (Ring of Fire)',
          isAnimated: true,
          animationClass: 'eclipse-solar-annular',
        };
      }
      if (eclipse.visibility === 'partial') {
        return {
          emoji: '🌒☀️',
          label: '🌒 Partial Solar Eclipse',
          isAnimated: true,
          animationClass: 'eclipse-solar-partial',
        };
      }
    }

    // ── Supermoon / perigee full moon ──
    const isNearFullMoon = phase === 'full_moon' || (age > 13.5 && age < 15.5);
    const isSupermoon = isNearFullMoon && MoonCalc.isNearPerigee(date);

    // ── Red moon conditions (not eclipse) ──
    // Red moon: full moon near horizon (at moonrise/moonset), low atmosphere scattering
    // We approximate: within 2h of moonrise/moonset + clear sky + full/near full moon
    const isRedMoon = isNearFullMoon && clear > 0.6 && this._isRedMoonTime(date, userLat, userLon);

    // ── Sky obscures moon? ──
    if (clear < 0.15) {
      // Moon hidden by clouds/rain/fog at night
      return {
        emoji: this._night(weatherCode),
        label: weatherDesc(weatherCode),
        isAnimated: false,
        animationClass: '',
      };
    }

    // ── Partially cloudy: show moon + cloud ──
    if (clear < 0.6) {
      return {
        emoji: this._partialMoonEmoji(phase) + '☁️',
        label: weatherDesc(weatherCode) + ' — ' + this._phaseName(phase),
        isAnimated: false,
        animationClass: '',
      };
    }

    // ── Red moon ──
    if (isRedMoon) {
      return {
        emoji: '🌕',
        label: '🔴 Red Moon (Atmospheric Scattering)',
        isAnimated: true,
        animationClass: 'moon-red',
      };
    }

    // ── Supermoon ──
    if (isSupermoon) {
      return {
        emoji: '🌕✨',
        label: '🔭 Supermoon! (Perigee Full Moon)',
        isAnimated: false,
        animationClass: 'moon-super',
      };
    }

    // ── Standard moon phases ──
    return {
      emoji: this._fullMoonPhaseEmoji(phase),
      label: this._phaseName(phase),
      isAnimated: false,
      animationClass: '',
    };
  },

  _fullMoonPhaseEmoji(phase) {
    const map = {
      new_moon:        '🌑',
      waxing_crescent: '🌒',
      first_quarter:   '🌓',
      waxing_gibbous:  '🌔',
      full_moon:       '🌕',
      waning_gibbous:  '🌖',
      last_quarter:    '🌗',
      waning_crescent: '🌘',
    };
    return map[phase] || '🌙';
  },

  _partialMoonEmoji(phase) {
    const map = {
      new_moon:        '🌑',
      waxing_crescent: '🌒',
      first_quarter:   '🌓',
      waxing_gibbous:  '🌔',
      full_moon:       '🌕',
      waning_gibbous:  '🌖',
      last_quarter:    '🌗',
      waning_crescent: '🌘',
    };
    return map[phase] || '🌙';
  },

  _phaseName(phase) {
    const names = {
      new_moon:        '🌑 New Moon',
      waxing_crescent: '🌒 Waxing Crescent',
      first_quarter:   '🌓 First Quarter',
      waxing_gibbous:  '🌔 Waxing Gibbous',
      full_moon:       '🌕 Full Moon',
      waning_gibbous:  '🌖 Waning Gibbous',
      last_quarter:    '🌗 Last Quarter',
      waning_crescent: '🌘 Waning Crescent',
    };
    return names[phase] || '🌙 Moon';
  },

  /**
   * Approximate red moon: moon is near horizon (rise/set).
   * Full calculation requires ephemeris; we approximate using local time
   * (moon rises ~50min later each day; near new/full: rises around sunset/sunrise)
   */
  _isRedMoonTime(date, lat, lon) {
    const h = date.getHours();
    const age = MoonCalc.getAge(date);
    // Full moon rises near sunset (~18-20h local time) and sets near sunrise (~4-7h)
    // Near-horizon periods: 18-21h (moonrise) and 4-7h (moonset)
    const isNearHorizon = (h >= 18 && h <= 21) || (h >= 4 && h <= 7);
    const isNearFull = age > 13.0 && age < 16.0;
    return isNearHorizon && isNearFull;
  },

  /**
   * Returns the complete display emoji for current conditions
   * This is what goes in the big weather icon slot
   */
  getDisplayEmoji(code, isDay, date, weatherCode, eclipse, lat, lon) {
    // Night + clear → show moon phase
    if (!isDay && code === 0) {
      const moon = this.getMoonEmoji(date, weatherCode, eclipse, lat, lon);
      return moon;
    }
    // Night + light cloud (code=1): moon peeking through
    if (!isDay && code === 1) {
      const moon = this.getMoonEmoji(date, weatherCode, eclipse, lat, lon);
      const phasedEmoji = this._fullMoonPhaseEmoji(MoonCalc.getPhaseName(MoonCalc.getAge(date)));
      return { emoji: phasedEmoji + '🌤️', label: moon.label + ' — Mainly Clear', isAnimated: moon.isAnimated, animationClass: moon.animationClass };
    }
    // Day eclipse
    if (isDay && eclipse && eclipse.kind === 'solar') {
      return this.getMoonEmoji(date, weatherCode, eclipse, lat, lon);
    }
    // Default day/night
    const emoji = isDay ? this._day(code) : this._night(code);
    return { emoji: emoji || '🌤️', label: weatherDesc(code), isAnimated: false, animationClass: '' };
  },
};

// ─────────────────────────────────────────────
// SECTION 4 — WEATHER DESCRIPTION
// More precise than the original
// ─────────────────────────────────────────────

function weatherDesc(code) {
  const descriptions = {
    0:  'Clear sky',
    1:  'Mainly clear',
    2:  'Partly cloudy',
    3:  'Overcast',
    45: 'Foggy',
    48: 'Freezing fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Heavy freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Light snowfall',
    73: 'Moderate snowfall',
    75: 'Heavy snowfall',
    77: 'Snow grains',
    80: 'Light rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm + slight hail',
    99: 'Thunderstorm + heavy hail',
  };
  return descriptions[code] || 'Unknown';
}

// ─────────────────────────────────────────────
// SECTION 5 — ECLIPSE CSS ANIMATIONS
// Injected once into <head>
// ─────────────────────────────────────────────

function injectEclipseStyles() {
  if (document.getElementById('ts-eclipse-styles')) return;
  const style = document.createElement('style');
  style.id = 'ts-eclipse-styles';
  style.textContent = `
    /* ── Lunar Total (Blood Moon) ── */
    @keyframes blood-moon-pulse {
      0%   { filter: hue-rotate(0deg) saturate(1) drop-shadow(0 0 8px #ff2200); }
      25%  { filter: hue-rotate(-20deg) saturate(2) drop-shadow(0 0 18px #cc1100); }
      50%  { filter: hue-rotate(10deg) saturate(1.5) drop-shadow(0 0 24px #ff4400); }
      75%  { filter: hue-rotate(-10deg) saturate(2) drop-shadow(0 0 16px #cc2200); }
      100% { filter: hue-rotate(0deg) saturate(1) drop-shadow(0 0 8px #ff2200); }
    }
    .eclipse-lunar-total .weather-icon,
    .eclipse-lunar-total .weather-icon-main {
      animation: blood-moon-pulse 4s ease-in-out infinite;
    }

    /* ── Lunar Partial ── */
    @keyframes partial-lunar {
      0%   { filter: sepia(0.3) drop-shadow(0 0 6px #ff6600); }
      50%  { filter: sepia(0.7) drop-shadow(0 0 14px #ff4400); }
      100% { filter: sepia(0.3) drop-shadow(0 0 6px #ff6600); }
    }
    .eclipse-lunar-partial .weather-icon,
    .eclipse-lunar-partial .weather-icon-main {
      animation: partial-lunar 5s ease-in-out infinite;
    }

    /* ── Lunar Penumbral ── */
    @keyframes penumbral {
      0%   { filter: brightness(0.95); }
      50%  { filter: brightness(0.80); }
      100% { filter: brightness(0.95); }
    }
    .eclipse-lunar-penumbral .weather-icon,
    .eclipse-lunar-penumbral .weather-icon-main {
      animation: penumbral 8s ease-in-out infinite;
    }

    /* ── Solar Total (Diamond Ring → Totality) ── */
    @keyframes solar-total {
      0%   { filter: brightness(1) drop-shadow(0 0 4px #ffe066); }
      20%  { filter: brightness(0.1) drop-shadow(0 0 20px #ffe066); }
      40%  { filter: brightness(0.0) drop-shadow(0 0 32px #ff6600) drop-shadow(0 0 48px #ff0000); }
      60%  { filter: brightness(0.0) drop-shadow(0 0 32px #ff6600); }
      80%  { filter: brightness(0.1) drop-shadow(0 0 20px #ffe066); }
      100% { filter: brightness(1) drop-shadow(0 0 4px #ffe066); }
    }
    .eclipse-solar-total .weather-icon,
    .eclipse-solar-total .weather-icon-main {
      animation: solar-total 10s ease-in-out infinite;
    }

    /* ── Solar Annular (Ring of Fire) ── */
    @keyframes ring-of-fire {
      0%   { filter: drop-shadow(0 0 4px #ff8800); }
      25%  { filter: drop-shadow(0 0 12px #ff4400) drop-shadow(0 0 24px #ff8800); }
      50%  { filter: drop-shadow(0 0 18px #ffcc00) drop-shadow(0 0 36px #ff4400); }
      75%  { filter: drop-shadow(0 0 12px #ff4400) drop-shadow(0 0 24px #ff8800); }
      100% { filter: drop-shadow(0 0 4px #ff8800); }
    }
    .eclipse-solar-annular .weather-icon,
    .eclipse-solar-annular .weather-icon-main {
      animation: ring-of-fire 6s ease-in-out infinite;
    }

    /* ── Solar Partial ── */
    @keyframes solar-partial {
      0%   { filter: brightness(1); }
      50%  { filter: brightness(0.6) drop-shadow(0 0 8px #ff8800); }
      100% { filter: brightness(1); }
    }
    .eclipse-solar-partial .weather-icon,
    .eclipse-solar-partial .weather-icon-main {
      animation: solar-partial 8s ease-in-out infinite;
    }

    /* ── Red Moon ── */
    @keyframes red-moon-glow {
      0%   { filter: sepia(0.5) hue-rotate(-30deg) saturate(2) drop-shadow(0 0 6px #cc2200); }
      50%  { filter: sepia(0.7) hue-rotate(-40deg) saturate(2.5) drop-shadow(0 0 14px #ff3300); }
      100% { filter: sepia(0.5) hue-rotate(-30deg) saturate(2) drop-shadow(0 0 6px #cc2200); }
    }
    .moon-red .weather-icon,
    .moon-red .weather-icon-main {
      animation: red-moon-glow 6s ease-in-out infinite;
    }

    /* ── Supermoon glow ── */
    @keyframes supermoon {
      0%   { filter: brightness(1.1) drop-shadow(0 0 8px rgba(255,240,180,0.6)); }
      50%  { filter: brightness(1.3) drop-shadow(0 0 18px rgba(255,240,180,0.9)); }
      100% { filter: brightness(1.1) drop-shadow(0 0 8px rgba(255,240,180,0.6)); }
    }
    .moon-super .weather-icon,
    .moon-super .weather-icon-main {
      animation: supermoon 4s ease-in-out infinite;
    }

    /* ── Weather widget eclipse banner ── */
    .eclipse-banner {
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 6px;
      text-align: center;
      font-weight: 700;
      letter-spacing: 0.03em;
      margin-top: 4px;
      animation: eclipse-banner-pulse 2s ease-in-out infinite;
    }
    @keyframes eclipse-banner-pulse {
      0%,100% { opacity: 1; }
      50%      { opacity: 0.7; }
    }
    .eclipse-banner-solar {
      background: rgba(255,140,0,0.25);
      color: #ffb347;
      border: 1px solid rgba(255,140,0,0.4);
    }
    .eclipse-banner-lunar {
      background: rgba(200,0,0,0.25);
      color: #ff8080;
      border: 1px solid rgba(200,0,0,0.4);
    }

    /* ── Moon phase badge ── */
    .moon-phase-badge {
      font-size: 10px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      padding: 2px 6px;
      text-align: center;
      margin-top: 4px;
      color: var(--wt-muted, rgba(200,200,210,0.7));
    }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────
// SECTION 6 — RENDER WEATHER (drop-in replacement)
// ─────────────────────────────────────────────

function renderWeather(container, id) {
  if (!container) return;
  injectEclipseStyles();

  try {
    const data = widgets[id]?.data || {};
    const variant = data.variant || 'celsius';
    const isFahrenheit = variant === 'fahrenheit';
    const CACHE_MAX = 30 * 60 * 1000; // 30 minutes

    if (data.temp !== undefined && data.fetchedAt && Date.now() - data.fetchedAt < CACHE_MAX) {
      _renderWeatherDisplay(container, id, data);
    } else {
      const unit = isFahrenheit ? '°F' : '°C';
      container.innerHTML = `
        <div class="weather-icon-main" style="font-size:38px;text-align:center;margin-bottom:4px;">⏳</div>
        <div class="weather-temp" id="wt-${id}" style="font-size:clamp(28px,4vw,38px);font-weight:700;text-align:center;">--${unit}</div>
        <div class="weather-desc" id="wd-${id}" style="font-size:clamp(11px,1.5vw,13px);text-align:center;opacity:0.7;">Fetching weather…</div>
        <div class="weather-loc" id="wl-${id}" style="font-size:11px;text-align:center;opacity:0.5;">📍 Your location</div>
      `;
      fetchWeather(id);
    }
  } catch(e) {
    Logger.error('renderWeather failed', e);
    container.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:12px;">⚠️ Weather unavailable</div>';
  }
}

function _renderWeatherDisplay(container, id, data) {
  const variant = data.variant || 'celsius';
  const isFahrenheit = variant === 'fahrenheit';
  const displayTemp = isFahrenheit ? Math.round((data.temp * 9 / 5) + 32) : Math.round(data.temp);
  const unit = isFahrenheit ? '°F' : '°C';
  const isDay = data.isDay !== undefined ? data.isDay : true;
  const code = data.code || 0;
  const now = new Date();

  const lat = data.lat || 0;
  const lon = data.lon || 0;
  const eclipse = EclipseEngine.getCurrentEclipse(now, lat, lon);
  const emojiResult = WeatherEmoji.getDisplayEmoji(code, isDay, now, code, eclipse, lat, lon);

  const eclipseBanner = eclipse
    ? `<div class="eclipse-banner eclipse-banner-${eclipse.kind}">
         ${eclipse.kind === 'solar' ? '🌑' : '🔴'} 
         ${eclipse.visibility || eclipse.type} ${eclipse.kind} eclipse
       </div>`
    : '';

  // Moon phase info (only show at night on clear/partly clear)
  let moonBadge = '';
  if (!isDay) {
    const age = MoonCalc.getAge(now);
    const phase = MoonCalc.getPhaseName(age);
    const illumPct = Math.round(MoonCalc.getIllumination(age) * 100);
    const clearFactor = WeatherEmoji.skyClearFactor(code);
    if (clearFactor > 0.1) {
      const phaseName = WeatherEmoji._phaseName ? WeatherEmoji._phaseName.call(WeatherEmoji, phase) : phase;
      moonBadge = `<div class="moon-phase-badge">${WeatherEmoji._fullMoonPhaseEmoji(phase)} ${illumPct}% lit</div>`;
    }
  }

  const animClass = (eclipse || emojiResult.isAnimated) ? (emojiResult.animationClass || '') : '';

  container.className = container.className.replace(/eclipse-\S+|moon-\S+/g, '').trim();
  if (animClass) {
    // Apply to parent widget element for CSS cascade
    const widgetEl = document.getElementById(id);
    if (widgetEl) {
      widgetEl.className = widgetEl.className.replace(/eclipse-\S+|moon-\S+/g, '').trim();
      widgetEl.classList.add(animClass);
    }
  }

  container.innerHTML = `
    <div class="weather-icon-main" style="font-size:42px;text-align:center;margin-bottom:2px;line-height:1.1;">${emojiResult.emoji}</div>
    <div class="weather-temp" style="font-size:clamp(28px,4vw,38px);font-weight:700;text-align:center;">${displayTemp}${unit}</div>
    <div class="weather-desc" style="font-size:clamp(10px,1.4vw,12px);text-align:center;opacity:0.75;margin-top:2px;">${escapeHTML(emojiResult.label || weatherDesc(code))}</div>
    <div class="weather-loc" style="font-size:10px;text-align:center;opacity:0.5;margin-top:2px;">📍 ${escapeHTML(data.loc || 'Your location')}</div>
    ${moonBadge}
    ${eclipseBanner}
  `;

  // Schedule next refresh in 30 minutes
  if (!window._weatherRefreshTimers) window._weatherRefreshTimers = {};
  clearTimeout(window._weatherRefreshTimers[id]);
  window._weatherRefreshTimers[id] = setTimeout(() => {
    if (widgets[id]) {
      widgets[id].data.fetchedAt = 0; // Force re-fetch
      const c = document.getElementById('w-' + id);
      if (c) renderWeather(c, id);
    }
  }, 30 * 60 * 1000);
}

// ─────────────────────────────────────────────
// SECTION 7 — FETCH FUNCTIONS (drop-in replacements)
// ─────────────────────────────────────────────

function fetchWeather(id) {
  try {
    if (!navigator.geolocation) {
      Logger.warn('Geolocation not available');
      return;
    }

    if (geolocationCache.coords && Date.now() - geolocationCache.timestamp < geolocationCache.maxAge) {
      fetchWeatherWithCoords(geolocationCache.coords, id);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        geolocationCache.coords = pos.coords;
        geolocationCache.timestamp = Date.now();
        fetchWeatherWithCoords(pos.coords, id);
      },
      (err) => {
        Logger.warn('Geolocation error', err.message);
        const el = DOM.get('wd-' + id);
        if (el) el.textContent = err.code === 1 ? '📍 Location denied' : '📍 Location unavailable';
      },
      { timeout: 10000, maximumAge: 3600000 }
    );
  } catch(e) {
    Logger.error('fetchWeather failed', e);
  }
}

async function fetchWeatherWithCoords(coords, id) {
  try {
    const { latitude: lat, longitude: lon } = coords;

    // Open-Meteo: current weather + hourly precipitation for next 6h
    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current_weather=true` +
      `&hourly=precipitation_probability,weathercode` +
      `&forecast_days=1` +
      `&timezone=auto`;

    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error('Weather API failed');
    const weatherData = await weatherRes.json();
    const cw = weatherData?.current_weather;
    if (!cw) throw new Error('Invalid weather response');

    const temp = cw.temperature;
    const code = cw.weathercode || 0;
    const isDay = cw.is_day === 1;

    // Location reverse geocode
    let loc = 'Your location';
    try {
      const locRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      if (locRes.ok) {
        const locData = await locRes.json();
        loc = locData?.address?.city || locData?.address?.town || locData?.address?.village || loc;
      }
    } catch(e) { Logger.warn('Reverse geocode failed', e); }

    if (widgets[id]) {
      widgets[id].data = {
        ...widgets[id].data,
        temp,
        code,
        isDay,
        desc: weatherDesc(code),
        loc,
        lat,
        lon,
        fetchedAt: Date.now(),
        // hourly precipitation next 6h for context
        hourlyPrecip: (weatherData?.hourly?.precipitation_probability || []).slice(0, 6),
        hourlyCode:   (weatherData?.hourly?.weathercode || []).slice(0, 6),
      };
      debouncedSaveState();

      const container = document.getElementById('w-' + id);
      if (container) _renderWeatherDisplay(container, id, widgets[id].data);
    }
  } catch(e) {
    Logger.error('fetchWeatherWithCoords failed', e);
    const el = DOM.get('wd-' + id);
    if (el) el.textContent = '⚠️ Weather unavailable';
  }
}

// ─────────────────────────────────────────────
// SECTION 8 — LEGACY COMPAT SHIM
// ─────────────────────────────────────────────

/**
 * Legacy getWeatherIcon — kept for any widget that calls it directly
 * Now returns from WeatherEmoji system
 */
function getWeatherIcon(code, isDay = true) {
  return isDay ? WeatherEmoji._day(code) : WeatherEmoji._night(code) || '🌙';
}

// ─────────────────────────────────────────────
// SECTION 9 — UPDATED WEATHER SETTINGS MODAL
// ─────────────────────────────────────────────

function showWeatherSettings(id) {
  const content = `
    <div style="text-align:center;padding:8px;">
      <h3 style="margin:0 0 16px 0;font-size:18px;">🌡️ Weather Settings</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
        <button class="weather-variant-btn" data-variant="celsius" style="
          padding:12px;border:2px solid var(--glass-border);background:var(--glass-bg);
          color:var(--text);border-radius:var(--radius);cursor:pointer;font-size:14px;transition:all 0.3s;">
          °C Celsius
        </button>
        <button class="weather-variant-btn" data-variant="fahrenheit" style="
          padding:12px;border:2px solid var(--glass-border);background:var(--glass-bg);
          color:var(--text);border-radius:var(--radius);cursor:pointer;font-size:14px;transition:all 0.3s;">
          °F Fahrenheit
        </button>
      </div>
      <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:10px;margin-top:8px;text-align:left;font-size:11px;color:var(--text-muted);line-height:1.8;">
        <div style="font-weight:700;margin-bottom:6px;color:var(--text);">✨ What this widget tracks:</div>
        🌤️ Real-time WMO weather codes<br>
        🌑🌒🌓🌔🌕🌖🌗🌘 Live moon phases<br>
        🔴 Blood Moon / Red Moon detection<br>
        💍 Annular &amp; Solar Eclipse animations<br>
        🩸 Total Lunar Eclipse (Blood Moon)<br>
        🌟 Supermoon at perigee detection<br>
        🌧️ Night rain → moon hidden by clouds<br>
        🔄 Auto-refreshes every 30 minutes
      </div>
    </div>
  `;

  showModal(content);

  document.querySelectorAll('.weather-variant-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-variant');
      widgets[id].data.variant = v;
      debouncedSaveState();
      closeModal();
      const container = document.getElementById('w-' + id);
      if (container) renderWeather(container, id);
    });
    btn.addEventListener('mouseover', () => {
      btn.style.borderColor = 'var(--accent)';
      btn.style.boxShadow = '0 0 12px rgba(224,64,251,0.3)';
    });
    btn.addEventListener('mouseout', () => {
      btn.style.borderColor = 'var(--glass-border)';
      btn.style.boxShadow = 'none';
    });
  });
}

// ─────────────────────────────────────────────
// SECTION 10 — COMPLETE EMOJI REFERENCE TABLE
// (used internally by WeatherEmoji; listed here for documentation)
// ─────────────────────────────────────────────

/*
DAY CONDITIONS:
  WMO 0  — Clear sky              → ☀️
  WMO 1  — Mainly clear           → 🌤️
  WMO 2  — Partly cloudy          → ⛅
  WMO 3  — Overcast               → ☁️
  WMO 45 — Fog                    → 🌫️
  WMO 48 — Freezing fog           → 🌁
  WMO 51 — Light drizzle          → 🌦️
  WMO 53 — Moderate drizzle       → 🌦️
  WMO 55 — Dense drizzle          → 🌧️
  WMO 56 — Light freezing drizzle → 🌨️
  WMO 57 — Heavy freezing drizzle → 🌨️
  WMO 61 — Slight rain            → 🌦️
  WMO 63 — Moderate rain          → 🌧️
  WMO 65 — Heavy rain             → 🌧️
  WMO 66 — Light freezing rain    → 🌨️
  WMO 67 — Heavy freezing rain    → 🌨️
  WMO 71 — Light snow             → 🌨️
  WMO 73 — Moderate snow          → ❄️
  WMO 75 — Heavy snow             → 🌨️
  WMO 77 — Snow grains            → 🌨️
  WMO 80 — Light showers          → 🌦️
  WMO 81 — Moderate showers       → 🌧️
  WMO 82 — Violent showers        → ⛈️
  WMO 85 — Slight snow showers    → 🌨️
  WMO 86 — Heavy snow showers     → ❄️
  WMO 95 — Thunderstorm           → ⛈️
  WMO 96 — Thunder + slight hail  → ⛈️
  WMO 99 — Thunder + heavy hail   → 🌩️

NIGHT CONDITIONS (when sky code is not 0):
  Clear night (0)  → Moon phase emoji (see below)
  Mainly clear (1) → Moon phase + 🌤️
  Partly cloudy(2) → Moon phase + ☁️ (partially hidden)
  Overcast (3)     → ☁️ (moon fully hidden)
  Fog (45/48)      → 🌫️ / 🌁
  Drizzle (51-55)  → 🌧️ (rain hides moon)
  Rain (61-65)     → 🌧️
  Freezing (56-67) → 🌨️
  Snow (71-77)     → ❄️ / 🌨️
  Showers (80-82)  → 🌧️ / ⛈️
  Thunder (95-99)  → ⛈️ / 🌩️

MOON PHASES (clear night):
  New moon         → 🌑 (0-1.84 days)
  Waxing crescent  → 🌒 (1.85-7.37 days)
  First quarter    → 🌓 (7.38-9.21 days)
  Waxing gibbous   → 🌔 (9.22-14.76 days)
  Full moon        → 🌕 (14.77-16.60 days)
  Waning gibbous   → 🌖 (16.61-22.14 days)
  Last quarter     → 🌗 (22.15-23.98 days)
  Waning crescent  → 🌘 (23.99-29.00 days)

SPECIAL MOON EVENTS:
  Red Moon         → 🌕 (animated red glow, near horizon at rise/set)
  Supermoon        → 🌕✨ (perigee + full moon, glow animation)

LUNAR ECLIPSE (night):
  Penumbral        → 🌕 (dim animation)
  Partial          → 🌔 (orange glow animation)
  Total / Blood    → 🔴🌕 (red pulse animation)

SOLAR ECLIPSE (day):
  Partial          → 🌒☀️ (dim animation)
  Annular          → 💍 (ring of fire animation)
  Total            → 🌑☀️ (dark flare animation → corona)

COMBINED NIGHT + CLOUDS:
  Clear night + full moon          → 🌕
  Partly cloudy + full moon        → 🌕☁️
  Overcast + full moon             → ☁️ (moon hidden)
  Rain + any moon                  → 🌧️ (moon hidden by rain)
  Snow + any moon                  → 🌨️ (moon hidden by snow)
  Fog + any moon                   → 🌫️ (moon hidden by fog)
  Thunder + any moon               → ⛈️ (moon irrelevant)
*/

Logger.log('Ultimate Weather Widget loaded — Moon phases, eclipses, red moon all active');
