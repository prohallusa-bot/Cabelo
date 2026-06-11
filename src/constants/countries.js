/**
 * Countries with flags, phone codes, and state lists
 * For use in signup forms and profile editing
 */

// Countries with flag emojis and phone codes
export const COUNTRIES = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', phoneCode: '+55' },
  { code: 'US', name: 'United States', flag: '🇺🇸', phoneCode: '+1' },
  { code: 'ES', name: 'España', flag: '🇪🇸', phoneCode: '+34' },
  { code: 'FR', name: 'France', flag: '🇫🇷', phoneCode: '+33' },
  { code: 'OTHER', name: 'Other', flag: '🌍', phoneCode: '' },
]

// Full list for phone code selector (keep all country codes for phone)
export const PHONE_COUNTRIES = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', phoneCode: '+55' },
  { code: 'US', name: 'United States', flag: '🇺🇸', phoneCode: '+1' },
  { code: 'ES', name: 'España', flag: '🇪🇸', phoneCode: '+34' },
  { code: 'FR', name: 'France', flag: '🇫🇷', phoneCode: '+33' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', phoneCode: '+351' },
  { code: 'MX', name: 'México', flag: '🇲🇽', phoneCode: '+52' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', phoneCode: '+54' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', phoneCode: '+57' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', phoneCode: '+56' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', phoneCode: '+51' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', phoneCode: '+44' },
  { code: 'DE', name: 'Deutschland', flag: '🇩🇪', phoneCode: '+49' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹', phoneCode: '+39' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', phoneCode: '+1' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', phoneCode: '+61' },
]

// Brazilian states
export const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
]

// US States
export const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
]

// Spanish regions
export const SPANISH_REGIONS = [
  { code: 'AN', name: 'Andalucía' }, { code: 'AR', name: 'Aragón' }, { code: 'AS', name: 'Asturias' },
  { code: 'IB', name: 'Islas Baleares' }, { code: 'CN', name: 'Canarias' }, { code: 'CB', name: 'Cantabria' },
  { code: 'CL', name: 'Castilla y León' }, { code: 'CM', name: 'Castilla-La Mancha' }, { code: 'CT', name: 'Cataluña' },
  { code: 'EX', name: 'Extremadura' }, { code: 'GA', name: 'Galicia' }, { code: 'MD', name: 'Madrid' },
  { code: 'MC', name: 'Murcia' }, { code: 'NC', name: 'Navarra' }, { code: 'PV', name: 'País Vasco' },
  { code: 'RI', name: 'La Rioja' }, { code: 'VC', name: 'Comunidad Valenciana' }
]

// French regions
export const FRENCH_REGIONS = [
  { code: 'IDF', name: 'Île-de-France' }, { code: 'CVL', name: 'Centre-Val de Loire' },
  { code: 'BFC', name: 'Bourgogne-Franche-Comté' }, { code: 'NOR', name: 'Normandie' },
  { code: 'HDF', name: 'Hauts-de-France' }, { code: 'GES', name: 'Grand Est' },
  { code: 'PDL', name: 'Pays de la Loire' }, { code: 'BRE', name: 'Bretagne' },
  { code: 'NAQ', name: 'Nouvelle-Aquitaine' }, { code: 'OCC', name: 'Occitanie' },
  { code: 'ARA', name: 'Auvergne-Rhône-Alpes' }, { code: 'PAC', name: 'Provence-Alpes-Côte d\'Azur' },
  { code: 'COR', name: 'Corse' }
]

// Helper to get states/regions by country code
export const getStatesByCountry = (countryCode) => {
  switch (countryCode) {
    case 'BR': return BRAZILIAN_STATES
    case 'US': return US_STATES
    case 'ES': return SPANISH_REGIONS
    case 'FR': return FRENCH_REGIONS
    default: return []
  }
}

// Helper to get country info by code (checks COUNTRIES first, then PHONE_COUNTRIES)
export const getCountryByCode = (code) => {
  return COUNTRIES.find(c => c.code === code) || PHONE_COUNTRIES.find(c => c.code === code) || null
}

// Map any country code to our simplified dropdown (BR, US, ES, FR, or OTHER)
export const mapToDropdownCountry = (countryCode) => {
  const supported = ['BR', 'US', 'ES', 'FR']
  if (supported.includes(countryCode)) return countryCode
  return 'OTHER'
}

// Default country (Brazil as requested)
export const DEFAULT_COUNTRY = 'BR'
