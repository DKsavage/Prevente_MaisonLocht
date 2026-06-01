import { NextRequest, NextResponse } from 'next/server'

const PROVINCE_MAP: Record<string, string> = {
  'alberta': 'AB', 'british columbia': 'BC',
  'manitoba': 'MB', 'new brunswick': 'NB', 'nouveau-brunswick': 'NB',
  'newfoundland and labrador': 'NL', 'terre-neuve-et-labrador': 'NL',
  'nova scotia': 'NS', 'nouvelle-écosse': 'NS',
  'northwest territories': 'NT', 'territoires du nord-ouest': 'NT',
  'nunavut': 'NU', 'ontario': 'ON',
  'prince edward island': 'PE', 'île-du-prince-édouard': 'PE',
  'quebec': 'QC', 'québec': 'QC',
  'saskatchewan': 'SK', 'yukon': 'YT',
}

const CODE_TO_NAME: Record<string, string> = {
  AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba',
  NB: 'New Brunswick', NL: 'Newfoundland and Labrador',
  NS: 'Nova Scotia', NT: 'Northwest Territories', NU: 'Nunavut',
  ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec',
  SK: 'Saskatchewan', YT: 'Yukon',
}

function toProvinceCode(name: string): string {
  if (!name) return ''
  const key = name.toLowerCase().trim()
  return PROVINCE_MAP[key] ?? name.slice(0, 2).toUpperCase()
}

export async function GET(req: NextRequest) {
  const q        = req.nextUrl.searchParams.get('q') ?? ''
  const province = req.nextUrl.searchParams.get('province') ?? ''
  const city     = req.nextUrl.searchParams.get('city') ?? ''

  if (q.length < 3) return NextResponse.json([])

  // Enrichir la requête avec le contexte déjà rempli
  const parts = [q]
  if (city.trim())     parts.push(city.trim())
  if (province.trim()) parts.push(CODE_TO_NAME[province.trim()] ?? province.trim())
  const query = parts.join(', ')

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&countrycodes=ca&q=${encodeURIComponent(query)}`
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
        if (r.address?.country_code !== 'ca') return false
        // Filtrer strictement par province si déjà sélectionnée
        if (province) {
          const rp = toProvinceCode(r.address?.state ?? '')
          if (rp && rp !== province) return false
        }
        return true
      })
      .map(r => {
        const a          = r.address
        const streetNum  = a.house_number ?? ''
        const street     = a.road ?? a.pedestrian ?? a.cycleway ?? a.path ?? ''
        const fullStreet = [streetNum, street].filter(Boolean).join(' ')
        const resCity    = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? ''
        const resProvince = toProvinceCode(a.state ?? '')
        const postalCode  = a.postcode
          ? a.postcode.toUpperCase().replace(/([A-Z]\d[A-Z])(\d[A-Z]\d)/, '$1 $2')
          : ''
        return { label: r.display_name, address: fullStreet, city: resCity, province: resProvince, postalCode }
      })
      .filter(r => r.address)

    return NextResponse.json(results)
  } catch {
    return NextResponse.json([])
  }
}

type NominatimResult = {
  display_name: string
  address: {
    house_number?: string; road?: string; pedestrian?: string
    cycleway?: string; path?: string; city?: string; town?: string
    village?: string; municipality?: string; county?: string
    state?: string; postcode?: string; country_code?: string
  }
}
