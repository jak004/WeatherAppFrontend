# Weather Now

A responsive weather application built from the Frontend Mentor Weather App design. It uses the Open-Meteo geocoding and forecast APIs and supports location search, current conditions, a 7-day forecast, hourly forecasts, responsive layouts, loading/error states, and metric/imperial units.

## Built with

- Semantic HTML5
- CSS custom properties, Flexbox and CSS Grid
- Vanilla JavaScript
- Open-Meteo API
- Local DM Sans and Bricolage Grotesque fonts

## Run locally

Because the app uses browser `fetch()` requests, serve the project through a local web server instead of opening `index.html` directly.

For example, with VS Code Live Server, open `index.html` and choose **Open with Live Server**.

Or with Python:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Features

- Search by city/place
- Current temperature, condition and location
- Feels-like temperature, humidity, wind and precipitation
- Seven-day forecast
- Selectable hourly forecast for each day
- Celsius/Fahrenheit with corresponding wind and precipitation conversion
- Responsive desktop, tablet and mobile layouts
- Loading, empty-result and API error feedback
- Keyboard focus states and accessible labels

## API

- Open-Meteo Geocoding API
- Open-Meteo Forecast API

No API key is required.

## Design

The implementation follows the supplied Frontend Mentor design references and style guide, including the provided image assets and fonts.
