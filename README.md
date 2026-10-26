# Pixel Weather

A small pixel-art weather app. Type a city and see today's temperature, the conditions and air quality. Built with plain HTML, CSS and JavaScript, so there is nothing to install.

Palette: chocolate brown, cream and a little burnt orange.

## Features

- Search any city by name, or use your current location
- Current temperature with a pixel gauge
- Feels-like temperature, humidity, wind, UV index and air quality
- Pixel icons for sun, moon, partly cloudy, cloud, rain, snow, thunder and fog, switching between day and night
- °C / °F toggle that remembers your choice
- Remembers the last city you searched
- Clear messages for unknown cities, bad keys and network problems

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `style.css` | Pixel-art styling and colours |
| `script.js` | API request, pixel icons and interactions |
| `pixel-weather-single.html` | Everything combined in one file (optional) |

Keep `index.html`, `style.css` and `script.js` in the same folder.

## Run it locally

1. Download the files into one folder.
2. Double-click `index.html` (or just `pixel-weather-single.html`) to open it in Chrome, Edge or Firefox.
3. Type a city and press Search.

You need an internet connection for the fonts and the weather data.

Prefer a local server? In the project folder run:

```
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Set up your API key

The app uses [WeatherAPI.com](https://www.weatherapi.com/). Create a free account, copy your key, and paste it into the top of `script.js`:

```js
const CONFIG = {
  API_KEY: "YOUR_KEY_HERE",
  ENDPOINT: "https://api.weatherapi.com/v1/current.json",
};
```

The key is visible to anyone who views the page source. Use a free-tier key, watch your usage, and regenerate it if it ever leaks.

## Add it to your website

- Upload the three files to a folder on your host, for example `/weather/`, then open `yoursite.com/weather/`.
- Or paste the `<main class="card">` block into an existing page, link `style.css` and `script.js`, and copy the two font `<link>` tags from the `<head>` of `index.html`.
- GitHub Pages, Netlify and Vercel all work: add the folder as a project and publish.

## Customise

- **Colours:** edit the variables at the top of `style.css` (`--choc`, `--cream`, `--orange` and so on).
- **Fonts:** Press Start 2P for headings and numbers, VT323 for body text.
- **Gauge range:** in `script.js`, the gauge maps -10°C to 45°C. Change the numbers in `drawGauge`.
- **Pixel icons:** each icon is a 12 × 12 grid of letters in `script.js`. Edit the letters or the `PALETTE` to redraw them.
- **Daily high and low:** switch `ENDPOINT` to `forecast.json` (add `&days=1`) and read `forecast.forecastday[0].day`.

## Troubleshooting

| Problem | Likely cause and fix |
| --- | --- |
| Page looks unstyled | `style.css` is missing or renamed. Keep the files together or use `pixel-weather-single.html`. |
| Search shows no result | Open the page from a file on your computer, not inside an editor or chat preview, which can block outside requests. |
| "API error 2006 / 2008" | Key is invalid or disabled. Check your WeatherAPI dashboard. |
| "API error 2007" | Monthly quota exceeded. Wait or upgrade the plan. |
| "Couldn't find that place" | Check the spelling or add the country, for example `Varanasi, India`. |
| Fonts look plain | You are offline, or Google Fonts is blocked. The app still works. |

For anything else, press F12, open the Console tab, search again and read the red error.

## Credits

Weather data from [WeatherAPI.com](https://www.weatherapi.com/). Fonts: Press Start 2P and VT323 from Google Fonts.
