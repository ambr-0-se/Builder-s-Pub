"use client"

import { useEffect, useMemo, useState } from "react"
import countryList from "react-select-country-list"
import { getTimeZones } from "@vvo/tzdb"

export default function RegionTimezone({ initialRegion, initialTimezone }: { initialRegion?: string; initialTimezone?: string }) {
  const [region, setRegion] = useState(initialRegion || "")
  const [timezone, setTimezone] = useState(initialTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
  const countries = useMemo(() => countryList().getData(), [])

  useEffect(() => {
    const input = document.getElementById("region") as HTMLInputElement | null
    if (input) input.value = region
  }, [region])

  useEffect(() => {
    const input = document.getElementById("timezone") as HTMLInputElement | null
    if (input) input.value = timezone
  }, [timezone])

  // Build a client-side list of timezones with abbreviations
  const tzOptions = useMemo(() => {
    const zones = getTimeZones()
    const sorted = [...zones].sort((a: any, b: any) =>
      (a.currentTimeOffsetInMinutes ?? 0) - (b.currentTimeOffsetInMinutes ?? 0)
    )
    const toGmt = (mins: number) => {
      const sign = mins >= 0 ? "+" : "-"
      const abs = Math.abs(mins)
      const hh = String(Math.floor(abs / 60)).padStart(2, "0")
      const mm = String(abs % 60).padStart(2, "0")
      return `GMT${sign}${hh}:${mm}`
    }
    const now = new Date()
    return sorted.map((z: any) => {
      const offsetMins: number = z.currentTimeOffsetInMinutes ?? 0
      let abbr: string = z.abbreviation
      if (!abbr) {
        const parts = new Intl.DateTimeFormat("en-US", { timeZone: z.name, timeZoneName: "short" }).formatToParts(now)
        abbr = parts.find((p) => p.type === "timeZoneName")?.value || ""
      }
      return {
        value: z.name,
        label: `${toGmt(offsetMins)} — ${abbr || z.alternativeName || ""} — ${z.name}`,
      }
    })
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Hidden inputs to pass values to server action */}
      <input type="hidden" id="region" name="region" defaultValue={region} />
      <input type="hidden" id="timezone" name="timezone" defaultValue={timezone} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
        <select
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="">Select a country/region</option>
          {countries.map((c) => (
            <option key={c.value} value={c.label}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
        <select
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          {tzOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Shows current abbreviation (e.g., HKT, GMT) and IANA name.</p>
      </div>
    </div>
  )
}


