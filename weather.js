(() => {
  "use strict";

  // ---------- config ----------
  const CONFIG = {
    API_KEY: "765b99ee37a94ebda6494153262610",
    ENDPOINT: "https://api.weatherapi.com/v1/current.json", // https avoids mixed-content errors on secure sites
  };

  // ---------- pixel sprites (12 x 12, one letter = one colour) ----------
  const PALETTE = {
    R: "#f6e8cf", // sun rays
    O: "#cc5500", // sun body, moon stars
    W: "#f6e8cf", // cloud
    S: "#c8a27a", // cloud shadow
    D: "#e8742a", // rain drops
    N: "#f6e8cf", // snow
    B: "#e8742a", // lightning
    F: "#c8a27a", // fog
    C: "#f6e8cf", // moon
  };

  const SUN = [
    ".....RR.....",
    ".R...RR...R.",
    "..R......R..",
    "....OOOO....",
    "...OOOOOO...",
    "RR.OOOOOO.RR",
    "RR.OOOOOO.RR",
    "...OOOOOO...",
    "....OOOO....",
    "..R......R..",
    ".R...RR...R.",
    ".....RR.....",
  ];

  const MOON = [
    "....CCCC....",
    "..CCCC......",
    ".CCCC.......",
    ".CCC........",
    "CCCC.....O..",
    "CCCC........",
    "CCCC........",
    "CCCC........",
    ".CCCC.......",
    ".CCCCC...O..",
    "..CCCCCCC...",
    "....CCCC....",
  ];

  const CLOUD = [
    "....WWW.....",
    "...WWWWW....",
    "..WWWWWWWWW.",
    ".WWWWWWWWWWW",
    "WWWWWWWWWWWW",
    "WWWWWWWWWWWW",
    ".SSSSSSSSSS.",
  ];

  const RAIN = [
    ".D..D..D....",
    "..D..D..D...",
    ".D..D..D....",
    "..D..D..D...",
    ".D..D..D....",
  ];

  const SNOW = [
    ".N...N...N..",
    "...N...N....",
    ".N...N...N..",
    "...N...N....",
    ".N...N...N..",
  ];

  const THUNDER = [
    ".....BB.....",
    "....BB......",
    "...BBBBB....",
    ".....BB.....",
    "....B.......",
  ];

  const FOG = [
    "............",
    "............",
    "............",
    ".FFFFFFFFFF.",
    "............",
    "..FFFFFFFFFF",
    "............",
    ".FFFFFFFFFF.",
    "............",
    "FFFFFFFFFF..",
    "............",
    "............",
  ];

  // paste `top` onto `base`, shifted down by dy rows (transparent "." pixels are skipped)
  const overlay = (base, top, dy) => {
    const grid = base.map((row) => row.split(""));
    top.forEach((row, y) => {
      row.split("").forEach((ch, x) => {
        if (ch !== "." && grid[y + dy]) grid[y + dy][x] = ch;
      });
    });
    return grid.map((row) => row.join(""));
  };

  const SPRITES = {
    sun: SUN,
    moon: MOON,
    partlyDay: overlay(SUN, CLOUD, 5),
    partlyNight: overlay(MOON, CLOUD, 5),
    cloud: [...CLOUD, ...Array(5).fill("............")],
    rain: [...CLOUD, ...RAIN],
    snow: [...CLOUD, ...SNOW],
    thunder: [...CLOUD, ...THUNDER],
    fog: FOG,
  };

  // WeatherAPI condition codes -> sprite
  const CODES = {
    thunder: [1087, 1273, 1276, 1279, 1282],
    fog: [1030, 1135, 1147],
    snow: [1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1255, 1258, 1261, 1264],
    rain: [1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246, 1249, 1252],
  };

  const pickSprite = (code, isDay) => {
    if (CODES.thunder.includes(code)) return SPRITES.thunder;
    if (CODES.fog.includes(code)) return SPRITES.fog;
    if (CODES.snow.includes(code)) return SPRITES.snow;
    if (CODES.rain.includes(code)) return SPRITES.rain;
    if (code === 1000) return isDay ? SPRITES.sun : SPRITES.moon;
    if (code === 1003) return isDay ? SPRITES.partlyDay : SPRITES.partlyNight;
    return SPRITES.cloud;
  };

  // ---------- elements & state ----------
  const $ = (id) => document.getElementById(id);
  const el = {
    form: $("searchForm"),
    input: $("cityInput"),
    locate: $("locateBtn"),
    btnC: $("btnC"),
    btnF: $("btnF"),
    status: $("status"),
    result: $("result"),
    canvas: $("sprite"),
    temp: $("temp"),
    unitLabel: $("unitLabel"),
    condition: $("condition"),
    gauge: $("gauge"),
    place: $("place"),
    time: $("time"),
    feels: $("feels"),
    humidity: $("humidity"),
    wind: $("wind"),
    uv: $("uv"),
    aqi: $("aqi"),
  };

  const AQI_LABELS = ["Good", "Moderate", "Unhealthy for some", "Unhealthy", "Very unhealthy", "Hazardous"];
  const GAUGE_SEGMENTS = 10;

  let unit = "c";
  let lastData = null;
  let requestId = 0;

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ } },
  };

  // ---------- drawing ----------
  const drawSprite = (rows) => {
    const ctx = el.canvas.getContext("2d");
    ctx.clearRect(0, 0, 12, 12);
    rows.forEach((row, y) => {
      row.split("").forEach((ch, x) => {
        if (PALETTE[ch]) {
          ctx.fillStyle = PALETTE[ch];
          ctx.fillRect(x, y, 1, 1);
        }
      });
    });
  };

  const drawGauge = (tempC) => {
    // maps -10°C ... 45°C onto 10 pixel segments
    const filled = Math.max(0, Math.min(GAUGE_SEGMENTS, Math.round(((tempC + 10) / 55) * GAUGE_SEGMENTS)));
    el.gauge.innerHTML = "";
    for (let i = 0; i < GAUGE_SEGMENTS; i++) {
      const seg = document.createElement("span");
      if (i < filled) seg.className = "on";
      el.gauge.appendChild(seg);
    }
  };

  const setStatus = (message, type) => {
    el.status.textContent = message;
    el.status.className = "status" + (type ? " " + type : "");
  };

  const render = (data) => {
    const { location: loc, current: cur } = data;
    const isC = unit === "c";

    drawSprite(pickSprite(cur.condition.code, cur.is_day === 1));
    drawGauge(cur.temp_c);

    el.temp.textContent = Math.round(isC ? cur.temp_c : cur.temp_f);
    el.unitLabel.textContent = isC ? "°C" : "°F";
    el.condition.textContent = cur.condition.text;

    el.place.textContent = [loc.name, loc.region, loc.country].filter(Boolean).join(", ");
    el.time.textContent = "Local time " + loc.localtime;

    el.feels.textContent = Math.round(isC ? cur.feelslike_c : cur.feelslike_f) + (isC ? "°C" : "°F");
    el.humidity.textContent = cur.humidity + "%";
    el.wind.textContent = isC ? Math.round(cur.wind_kph) + " km/h" : Math.round(cur.wind_mph) + " mph";
    el.uv.textContent = cur.uv;

    const epa = cur.air_quality && cur.air_quality["us-epa-index"];
    el.aqi.textContent = epa ? AQI_LABELS[epa - 1] : "Not available";

    el.result.hidden = false;
    setStatus("");
  };

  // ---------- data ----------
  const fetchWeather = async (query) => {
    const id = ++requestId;
    el.result.hidden = true;
    setStatus("Loading", "loading");

    try {
      const url = `${CONFIG.ENDPOINT}?key=${CONFIG.API_KEY}&q=${encodeURIComponent(query)}&aqi=yes`;
      const res = await fetch(url);
      const data = await res.json();
      if (id !== requestId) return; // a newer search replaced this one

      if (!res.ok || data.error) {
        const code = data.error && data.error.code;
        if (code === 1006) {
          setStatus("Couldn’t find that place. Check the spelling or add the country.", "error");
        } else if (code === 2006 || code === 2007 || code === 2008) {
          setStatus("The API key was rejected or has hit its limit.", "error");
        } else {
          setStatus("Something went wrong. Try again in a moment.", "error");
        }
        return;
      }

      lastData = data;
      store.set("pw-last-query", query);
      render(data);
    } catch (err) {
      if (id !== requestId) return;
      setStatus("Can’t reach the weather service. Check your connection.", "error");
    }
  };

  // ---------- interactions ----------
  const setUnit = (next) => {
    unit = next;
    store.set("pw-unit", next);
    el.btnC.classList.toggle("active", next === "c");
    el.btnF.classList.toggle("active", next === "f");
    el.btnC.setAttribute("aria-pressed", String(next === "c"));
    el.btnF.setAttribute("aria-pressed", String(next === "f"));
    if (lastData) render(lastData);
  };

  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = el.input.value.trim();
    if (q) fetchWeather(q);
  });

  el.btnC.addEventListener("click", () => setUnit("c"));
  el.btnF.addEventListener("click", () => setUnit("f"));

  el.locate.addEventListener("click", () => {
    if (!navigator.geolocation) {
      setStatus("This browser can’t share your location. Type a city instead.", "error");
      return;
    }
    setStatus("Finding you", "loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        el.input.value = "";
        fetchWeather(`${lat},${lon}`);
      },
      () => setStatus("Location access was blocked. Type a city instead.", "error"),
      { timeout: 10000 }
    );
  });

  // ---------- start ----------
  setUnit(store.get("pw-unit") === "f" ? "f" : "c");
  const last = store.get("pw-last-query");
  if (last && !/^-?\d/.test(last)) {
    el.input.value = last;
    fetchWeather(last);
  }
})();