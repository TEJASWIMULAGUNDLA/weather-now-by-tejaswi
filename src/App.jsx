import React, { useState } from 'react'

const OM = {
  async geocodeCity(name) {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search")
    url.searchParams.set("name", name)
    url.searchParams.set("count", "5")
    url.searchParams.set("language", "en")
    url.searchParams.set("format", "json")
    const res = await fetch(url)
    if (!res.ok) throw new Error("Geocoding failed")
    const data = await res.json()
    return (data.results || []).map(r => ({
      id: r.id ?? `${r.name}-${r.latitude}-${r.longitude}`,
      name: r.name,
      country: r.country,
      admin1: r.admin1 ?? "",
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone,
    }))
  },
  async currentWeather({ latitude, longitude }) {
    const url = new URL("https://api.open-meteo.com/v1/forecast")
    url.searchParams.set("latitude", latitude)
    url.searchParams.set("longitude", longitude)
    url.searchParams.set("timezone", "auto")
    url.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m")
    const res = await fetch(url)
    if (!res.ok) throw new Error("Weather lookup failed")
    return res.json()
  }
}

export default function App() {
  const [query, setQuery] = useState("")
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState(null)
  const [weather, setWeather] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    setError("")
    setWeather(null)
    setSelected(null)
    if (!query.trim()) return
    setLoading(true)
    try {
      const results = await OM.geocodeCity(query.trim())
      setPlaces(results)
      if (results.length === 0) setError("No matching places found.")
    } catch (err) {
      setError("Could not search places.")
    } finally {
      setLoading(false)
    }
  }

  async function pickPlace(place) {
    setSelected(place)
    setError("")
    setWeather(null)
    setLoading(true)
    try {
      const data = await OM.currentWeather(place)
      setWeather(data)
    } catch (err) {
      setError("Could not load weather.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Weather Now</h1>
      <form className="mt-4 flex gap-2" onSubmit={handleSearch}>
        <input
          className="flex-1 rounded bg-slate-800 px-4 py-2"
          placeholder="Search city..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className="bg-sky-500 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? "Loading..." : "Search"}
        </button>
      </form>

      {error && <p className="mt-4 text-red-400">{error}</p>}

      {places.map(p => (
        <div key={p.id} className="mt-2 flex justify-between items-center bg-slate-900 px-4 py-2 rounded">
          <div>{p.name}{p.admin1 ? ", " + p.admin1 : ""} ({p.country})</div>
          <button onClick={() => pickPlace(p)} className="bg-slate-700 px-2 py-1 rounded">
            See Weather
          </button>
        </div>
      ))}

      {selected && weather && (
        <div className="mt-6 p-4 bg-slate-900 rounded">
          <h2 className="text-xl font-semibold">{selected.name}, {selected.country}</h2>
          <p>Temperature: {weather.current.temperature_2m}°C</p>
          <p>Feels Like: {weather.current.apparent_temperature}°C</p>
          <p>Humidity: {weather.current.relative_humidity_2m}%</p>
          <p>Wind: {weather.current.wind_speed_10m} km/h</p>
        </div>
      )}
    </main>
  )
}
