const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

const state = {
  location: null,
  weather: null,
  unit: 'metric',
  selectedDay: 0,
};

const $ = (selector) => document.querySelector(selector);
const els = {
  form: $('#search-form'), input: $('#search-input'), searchBtn: $('#search-btn'), status: $('#status'),
  results: $('#weather-content'), loading: $('#loading'), unitsBtn: $('#units-btn'), unitsMenu: $('#units-menu'),
  daySelect: $('#day-select'), dayMenu: $('#day-menu'),
};

const weatherCodes = {
  0: ['Clear sky', 'icon-sunny.webp'],
  1: ['Mainly clear', 'icon-partly-cloudy.webp'],
  2: ['Partly cloudy', 'icon-partly-cloudy.webp'],
  3: ['Overcast', 'icon-overcast.webp'],
  45: ['Fog', 'icon-fog.webp'], 48: ['Depositing rime fog', 'icon-fog.webp'],
  51: ['Light drizzle', 'icon-drizzle.webp'], 53: ['Moderate drizzle', 'icon-drizzle.webp'], 55: ['Dense drizzle', 'icon-drizzle.webp'],
  56: ['Light freezing drizzle', 'icon-drizzle.webp'], 57: ['Dense freezing drizzle', 'icon-drizzle.webp'],
  61: ['Slight rain', 'icon-rain.webp'], 63: ['Moderate rain', 'icon-rain.webp'], 65: ['Heavy rain', 'icon-rain.webp'],
  66: ['Light freezing rain', 'icon-rain.webp'], 67: ['Heavy freezing rain', 'icon-rain.webp'],
  71: ['Slight snow', 'icon-snow.webp'], 73: ['Moderate snow', 'icon-snow.webp'], 75: ['Heavy snow', 'icon-snow.webp'], 77: ['Snow grains', 'icon-snow.webp'],
  80: ['Slight rain showers', 'icon-rain.webp'], 81: ['Moderate rain showers', 'icon-rain.webp'], 82: ['Violent rain showers', 'icon-rain.webp'],
  85: ['Slight snow showers', 'icon-snow.webp'], 86: ['Heavy snow showers', 'icon-snow.webp'],
  95: ['Thunderstorm', 'icon-storm.webp'], 96: ['Thunderstorm with slight hail', 'icon-storm.webp'], 99: ['Thunderstorm with heavy hail', 'icon-storm.webp'],
};

const getWeather = (code) => weatherCodes[code] || ['Unknown', 'icon-overcast.webp'];
const iconPath = (file) => `./assets/images/${file}`;
const cToF = (c) => c * 9 / 5 + 32;
const kmhToMph = (k) => k * 0.621371;
const mmToIn = (m) => m / 25.4;
const round = (n) => Math.round(n);

function showLoading(show) { els.loading.hidden = !show; }
function setStatus(message = '', type = '') { els.status.textContent = message; els.status.className = `status ${type}`; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function formatDate(dateString, options = {}) { return new Intl.DateTimeFormat('en-US', { timeZone: state.weather?.timezone || 'UTC', ...options }).format(new Date(`${dateString}T12:00:00`)); }
function formatShortDate(dateString) { return new Intl.DateTimeFormat('en-US', { timeZone: state.weather?.timezone || 'UTC', weekday:'long', month:'short', day:'numeric', year:'numeric' }).format(new Date(`${dateString}T12:00:00`)); }
function formatHour(iso) { const d = new Date(iso); return new Intl.DateTimeFormat('en-US', { hour:'numeric', hour12:true, timeZone: state.weather?.timezone || 'UTC' }).format(d); }
function unitTemp(value) { return `${round(state.unit === 'metric' ? value : cToF(value))}°`; }
function unitWind(value) { return `${round(state.unit === 'metric' ? value : kmhToMph(value))} ${state.unit === 'metric' ? 'km/h' : 'mph'}`; }
function unitPrecip(value) { const n = state.unit === 'metric' ? value : mmToIn(value); return `${n < 10 ? n.toFixed(1).replace(/\.0$/,'') : round(n)} ${state.unit === 'metric' ? 'mm' : 'in'}`; }

async function geocode(query) {
  const url = `${GEO_URL}?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Location search failed.');
  const data = await response.json();
  return data.results || [];
}

async function fetchWeather(place) {
  const params = new URLSearchParams({
    latitude: place.latitude, longitude: place.longitude, timezone: 'auto', forecast_days: '7',
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,weather_code,precipitation_probability,precipitation,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
  });
  const response = await fetch(`${WEATHER_URL}?${params}`);
  if (!response.ok) throw new Error('Weather service is unavailable right now.');
  return response.json();
}

async function search(query) {
  const trimmed = query.trim();
  if (!trimmed) { setStatus('Please enter a city or place.', 'error'); els.input.focus(); return; }
  setStatus('Searching...'); els.searchBtn.disabled = true; showLoading(true);
  try {
    const places = await geocode(trimmed);
    if (!places.length) { setStatus(`No results found for “${trimmed}”.`, 'error'); els.results.innerHTML = ''; return; }
    state.location = places[0];
    state.weather = await fetchWeather(state.location);
    state.selectedDay = 0;
    setStatus('');
    render();
  } catch (error) {
    setStatus(error.message || 'Something went wrong. Please try again.', 'error');
    els.results.innerHTML = '';
  } finally {
    els.searchBtn.disabled = false; showLoading(false);
  }
}

function locationName() {
  const parts = [state.location.name, state.location.country].filter(Boolean);
  return parts.join(', ');
}

function render() {
  const { current, daily } = state.weather;
  const currentWeather = getWeather(current.weather_code);
  const dailyCards = daily.time.map((date, i) => {
    const w = getWeather(daily.weather_code[i]);
    return `<button class="day-card" type="button" data-day="${i}" aria-label="Show hourly forecast for ${formatDate(date,{weekday:'long'})}" aria-pressed="${i === state.selectedDay}">
      <span class="day-name">${formatDate(date,{weekday:'short'})}</span><img class="day-icon" src="${iconPath(w[1])}" alt="${w[0]}"><span class="day-temps"><span>${unitTemp(daily.temperature_2m_max[i])}</span><span class="day-low">${unitTemp(daily.temperature_2m_min[i])}</span></span>
    </button>`;
  }).join('');

  els.results.innerHTML = `<div class="content">
    <section class="left-col" aria-label="Current and daily weather">
      <article class="current-card">
        <div class="current-info"><h2 class="location">${escapeHtml(locationName())}</h2><p class="date">${formatShortDate(state.weather.current.time.slice(0,10))}</p></div>
        <div class="temperature-wrap"><img class="current-icon" src="${iconPath(currentWeather[1])}" alt="${currentWeather[0]}"><span class="temperature">${unitTemp(current.temperature_2m)}</span></div>
      </article>
      <section class="metrics" aria-label="Weather details">
        <div class="metric"><span class="metric-label">Feels Like</span><strong class="metric-value">${unitTemp(current.apparent_temperature)}</strong></div>
        <div class="metric"><span class="metric-label">Humidity</span><strong class="metric-value">${round(current.relative_humidity_2m)}%</strong></div>
        <div class="metric"><span class="metric-label">Wind</span><strong class="metric-value">${unitWind(current.wind_speed_10m)}</strong></div>
        <div class="metric"><span class="metric-label">Precipitation</span><strong class="metric-value">${unitPrecip(current.precipitation)}</strong></div>
      </section>
      <h2 class="section-title">Daily forecast</h2>
      <section class="daily-grid" aria-label="7-day forecast">${dailyCards}</section>
    </section>
    <section class="hourly-card" aria-label="Hourly forecast">
      <div class="hourly-header"><h2 class="hourly-title">Hourly forecast</h2><select class="day-select" id="day-select" aria-label="Choose forecast day">${daily.time.map((d,i)=>`<option value="${i}" ${i===state.selectedDay?'selected':''}>${formatDate(d,{weekday:'long'})}</option>`).join('')}</select></div>
      <div class="hourly-list" id="hourly-list"></div>
    </section>
  </div>`;
  renderHourly();
  document.querySelectorAll('.day-card').forEach(btn => btn.addEventListener('click', () => { state.selectedDay = Number(btn.dataset.day); render(); }));
  $('#day-select').addEventListener('change', e => { state.selectedDay = Number(e.target.value); renderHourly(); document.querySelectorAll('.day-card').forEach((b,i)=>b.setAttribute('aria-pressed',i===state.selectedDay)); });
}

function renderHourly() {
  const list = $('#hourly-list'); if (!list) return;
  const targetDate = state.weather.daily.time[state.selectedDay];
  const entries = state.weather.hourly.time.map((time, i) => ({time,i})).filter(x => x.time.startsWith(targetDate));
  const now = new Date();
  let visible = entries;
  if (state.selectedDay === 0) {
    const currentHour = now.toLocaleString('en-CA', {timeZone: state.weather.timezone, hour:'2-digit', hourCycle:'h23'});
    const index = entries.findIndex(x => x.time.slice(11,13) >= currentHour);
    if (index >= 0) visible = entries.slice(index, index + 8);
  } else visible = entries.slice(0, 8);
  if (!visible.length) { list.innerHTML = '<div class="empty-state">Hourly data is not available for this day.</div>'; return; }
  list.innerHTML = visible.map(({time,i}) => {
    const w = getWeather(state.weather.hourly.weather_code[i]);
    return `<div class="hour-row"><div class="hour-left"><img class="hour-icon" src="${iconPath(w[1])}" alt="${w[0]}"><span class="hour-temp">${formatHour(time)}</span></div><span class="hour-temp-value">${unitTemp(state.weather.hourly.temperature_2m[i])}</span></div>`;
  }).join('');
}

function closeUnitsMenu() { els.unitsMenu.hidden = true; els.unitsBtn.setAttribute('aria-expanded','false'); }
els.unitsBtn.addEventListener('click', e => { e.stopPropagation(); const open = els.unitsMenu.hidden; els.unitsMenu.hidden = !open; els.unitsBtn.setAttribute('aria-expanded', String(open)); });
document.addEventListener('click', e => { if (!els.unitsMenu.contains(e.target) && e.target !== els.unitsBtn) closeUnitsMenu(); });
document.querySelectorAll('input[name="unit"]').forEach(radio => radio.addEventListener('change', e => { state.unit = e.target.value; closeUnitsMenu(); if (state.weather) render(); }));
els.form.addEventListener('submit', e => { e.preventDefault(); search(els.input.value); });

// Load a useful initial city so the interface is immediately demonstrable.
search('Berlin');
