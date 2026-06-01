import { NextRequest, NextResponse } from 'next/server'

const PROVINCE_MAP: Record<string, string> = {
  'alberta': 'AB', 'british columbia': 'BC', 'colombia britanica': 'BC',
  'manitoba': 'MB', 'new brunswick': 'NB', 'nouveau-brunswick': 'NB',
  'newfoundland and labrador': 'NL', 'terre-neuve-et-labrador': 'NL',
  'nova scotia': 'NS', 'nouvelle-écosse': 'NS',
  'northwest territories': 'NT', 'territoires du nord-ouest': 'NT',
  'nunavut': 'NU', 'ontario': 'ON',
  'prince edward island': 'PE', 'île-du-prince-édouard': 'PE',
  'quebec': 'QC', 'québec': 'QC',
  'saskatchewan': 'SK', 'yukon': 'YT',
}

function toProvinceCode(name: string): string {
  if (!name) return ''
  const key = name.toLowerCase().trim()
  return PROVINCE_MAP[key] ?? name.slice(0, 2).toUpperCase()
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.length < 3) return NextResponse.json([])

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=ca&q=${encodeURIComponent(q)}`
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
      .filter(r => r.address?.country_code === 'ca')
      .map(r => {
        const a = r.address
        const streetNum  = a.house_number ?? ''
        const street     = a.road ?? a.pedestrian ?? a.cycleway ?? ''
        const fullStreet = [streetNum, street].filter(Boolean).join(' ')
        const city       = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? ''
        const province   = toProvinceCode(a.state ?? '')
        const postalCode = a.postcode
          ? a.postcode.toUpperCase().replace(/([A-Z]\d[A-Z])(\d[A-Z]\d)/, '$1 $2')
          : ''

        return {
          label:      r.display_name,
          address:    fullStreet,
          city,
          province,
          postalCode,
        }
      })
      .filter(r => r.address || r.city)

    return NextResponse.json(results)
  } catch {
    return NextResponse.json([])
  }
}

type NominatimResult = {
  display_name: string
  address: {
    house_number?: string
    road?: string
    pedestrian?: string
    cycleway?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    postcode?: string
    country_code?: string
  }
}
