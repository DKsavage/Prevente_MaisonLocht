// Pays prioritaires pour Maison Locht — racines culturelles + marchés cibles en premier
export const COUNTRIES = [
  // Canada en premier — marché principal
  { code: 'CA', name: 'Canada',           nameEn: 'Canada',           nominatim: 'ca', hasProvinces: true },

  // Racines culturelles de la fondatrice
  { code: 'HT', name: 'Haïti',            nameEn: 'Haiti',            nominatim: 'ht', hasProvinces: false },
  { code: 'SN', name: 'Sénégal',          nameEn: 'Senegal',          nominatim: 'sn', hasProvinces: false },
  { code: 'CD', name: 'Congo (RDC)',       nameEn: 'Congo (DRC)',      nominatim: 'cd', hasProvinces: false },
  { code: 'GN', name: 'Guinée',           nameEn: 'Guinea',           nominatim: 'gn', hasProvinces: false },

  // Europe francophone
  { code: 'BE', name: 'Belgique',         nameEn: 'Belgium',          nominatim: 'be', hasProvinces: false },
  { code: 'FR', name: 'France',           nameEn: 'France',           nominatim: 'fr', hasProvinces: false },
  { code: 'CH', name: 'Suisse',           nameEn: 'Switzerland',      nominatim: 'ch', hasProvinces: false },

  // Autres marchés
  { code: 'US', name: 'États-Unis',       nameEn: 'United States',    nominatim: 'us', hasProvinces: false },
  { code: 'GB', name: 'Royaume-Uni',      nameEn: 'United Kingdom',   nominatim: 'gb', hasProvinces: false },
  { code: 'DE', name: 'Allemagne',        nameEn: 'Germany',          nominatim: 'de', hasProvinces: false },
  { code: 'NL', name: 'Pays-Bas',         nameEn: 'Netherlands',      nominatim: 'nl', hasProvinces: false },
  { code: 'IT', name: 'Italie',           nameEn: 'Italy',            nominatim: 'it', hasProvinces: false },
  { code: 'ES', name: 'Espagne',          nameEn: 'Spain',            nominatim: 'es', hasProvinces: false },
  { code: 'PT', name: 'Portugal',         nameEn: 'Portugal',         nominatim: 'pt', hasProvinces: false },
  { code: 'AU', name: 'Australie',        nameEn: 'Australia',        nominatim: 'au', hasProvinces: false },
  { code: 'JP', name: 'Japon',            nameEn: 'Japan',            nominatim: 'jp', hasProvinces: false },
  { code: 'MA', name: 'Maroc',            nameEn: 'Morocco',          nominatim: 'ma', hasProvinces: false },
  { code: 'CI', name: 'Côte d\'Ivoire',   nameEn: 'Ivory Coast',      nominatim: 'ci', hasProvinces: false },
  { code: 'ZA', name: 'Afrique du Sud',   nameEn: 'South Africa',     nominatim: 'za', hasProvinces: false },
  { code: 'OTHER', name: 'Autre',         nameEn: 'Other',            nominatim: '',   hasProvinces: false },
] as const

export type CountryCode = typeof COUNTRIES[number]['code']

export function getCountry(code: string) {
  return COUNTRIES.find(c => c.code === code)
}

// Format code postal par pays
export const POSTAL_FORMATS: Record<string, { label: { fr: string; en: string }; placeholder: string; hint?: { fr: string; en: string } }> = {
  CA: { label: { fr: 'Code postal', en: 'Postal code' }, placeholder: 'H1A 1A1', hint: { fr: 'Format : A1A 1A1', en: 'Format: A1A 1A1' } },
  US: { label: { fr: 'ZIP code',    en: 'ZIP code'    }, placeholder: '10001' },
  GB: { label: { fr: 'Code postal', en: 'Postcode'    }, placeholder: 'SW1A 1AA' },
  FR: { label: { fr: 'Code postal', en: 'Postal code' }, placeholder: '75001' },
  BE: { label: { fr: 'Code postal', en: 'Postal code' }, placeholder: '1000' },
  CH: { label: { fr: 'Code postal', en: 'Postal code' }, placeholder: '1200' },
  DE: { label: { fr: 'Code postal', en: 'Postal code' }, placeholder: '10115' },
  AU: { label: { fr: 'Code postal', en: 'Postcode'    }, placeholder: '2000' },
}

export function getPostalFormat(countryCode: string) {
  return POSTAL_FORMATS[countryCode] ?? { label: { fr: 'Code postal', en: 'Postal code' }, placeholder: '' }
}

// Formater le code postal selon le pays
export function formatPostalCode(value: string, countryCode: string): string {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (countryCode === 'CA') {
    if (clean.length <= 3) return clean
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)}`
  }
  return value // autres pays : pas de formatage forcé
}
