import { NextRequest, NextResponse } from 'next/server'
import { getCountry } from '@/lib/countries'

const PROVINCE_MAP: Record<string, string> = {
  'alberta': 'AB', 'british columbia': 'BC', 'manitoba': 'MB',
  'new brunswick': 'NB', 'nouveau-brunswick': 'NB',
  'newfoundland and labrador': 'NL', 'terre-neuve-et-labrador': 'NL',
  'nova scotia': 'NS', 'nouvelle-écosse': 'NS',
  'northwest territories': 'NT', 'territoires du nord-ouest': 'NT',
  'nunavut': 'NU', 'ontario': 'ON',
  'prince edward island': 'PE', 'île-du-prince-édouard': 'PE',
  'quebec': 'QC', 'québec': 'QC', 'saskatchewan': 'SK', 'yukon': 'YT',
}

function toProvinceCode(name: string): string {
  if (!name) return ''
  return PROVINCE_MAP[name.toLowerCase().trim()] ?? ''
}

export async function GET(req: NextRequest) {
  const q        = req.nextUrl.searchParams.get('q') ?? ''
  const country  = req.nextUrl.searchParams.get('country') ?? ''
  const province = req.nextUrl.searchParams.get('province') ?? ''
  const city     = req.nextUrl.searchParams.get('city') ?? ''

  if (q.length < 3) return NextResponse.json([])

  const parts = [q]
  if (city.trim()) parts.push(city.trim())
  if (province.trim() && country === 'CA') {
    const names: Record<string, string> = {
      AB:'Alberta',BC:'British Columbia',MB:'Manitoba',NB:'New Brunswick',
      NL:'Newfoundland',NS:'Nova Scotia',NT:'Northwest Territories',NU:'Nunavut',
      ON:'Ontario',PE:'Prince Edward Island',QC:'Quebec',SK:'Saskatchewan',YT:'Yukon',
    }
    if (names[province]) parts.push(names[province])
  }
  const query = parts.join(', ')

  const countryInfo   = getCountry(country)
  const countryFilter = countryInfo?.nominatim ? `&countrycodes=${countryInfo.nominatim}` : ''

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8${countryFilter}&q=${encodeURIComponent(query)}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'MaisonLocht-PreSale/1.0 (bitoungui32@gmail.com)',
        'Accept-Language': 'fr,en',
      },
      next: { revalidate: 0 },
    })

    if (!res.ok) return NextResponse.json([])
    const raw: NominatimResult[] = await res.json()

    const results = raw
      .filter(r => {
        const a = r.address
        // Exiger une vraie rue — rejeter résultats administratifs (ville, province, pays)
        const street = a.road ?? a.pedestrian ?? a.cycleway ?? a.path ?? a.footway ?? a.street ?? ''
        if (!street.trim()) return false
        // Filtrer par province si Canada
        if (country === 'CA' && province) {
          const rp = toProvinceCode(a.state ?? '')
          if (rp && rp !== province) return false
        }
        return true
      })
      .map(r => {
        const a          = r.address
        const streetNum  = a.house_number ?? ''
        const street     = a.road ?? a.pedestrian ?? a.cycleway ?? a.path ?? a.footway ?? a.street ?? ''
        const fullStreet = [streetNum, street].filter(Boolean).join(' ')
        const resCity    = a.city ?? a.town ?? a.village ?? a.municipality ?? a.suburb ?? ''
        const resProvince = country === 'CA' ? toProvinceCode(a.state ?? '') : (a.state ?? '')
        const postalCode  = a.postcode
          ? (country === 'CA'
              ? a.postcode.toUpperCase().replace(/([A-Z]\d[A-Z])(\d[A-Z]\d)/, '$1 $2')
              : a.postcode)
          : ''
        return { address: fullStreet, city: resCity, province: resProvince, postalCode }
      })
      .filter(r => r.address.trim().length > 1)

    // Dédupliquer
    const seen = new Set<string>()
    const unique = results.filter(r => {
      const key = `${r.address}|${r.city}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return NextResponse.json(unique)
  } catch {
    return NextResponse.json([])
  }
}

type NominatimResult = {
  address: {
    house_number?: string; road?: string; pedestrian?: string; cycleway?: string
    path?: string; footway?: string; street?: string; city?: string; town?: string
    village?: string; municipality?: string; suburb?: string; state?: string
    postcode?: string; country_code?: string
  }
}
