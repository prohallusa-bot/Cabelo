/**
 * CSV to JSON Converter for Professionals Directory
 *
 * Usage: node scripts/convert-csv-to-json.js
 *
 * This script:
 * 1. Reads all CSV files from "what worked" folder
 * 2. Converts them to JSON format
 * 3. Outputs to public/data/directory/
 * 4. Creates an index.json with all cities
 */

const fs = require('fs')
const path = require('path')

// Paths
const INPUT_DIR = path.join(__dirname, '..', 'what worked')
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'directory')

// Helper to parse CSV
function parseCSV(csvContent) {
  const lines = csvContent.split('\n')
  const headers = parseCSVLine(lines[0])
  const data = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCSVLine(line)
    const row = {}

    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    data.push(row)
  }

  return data
}

// Parse a single CSV line (handles quoted fields with commas)
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

// Convert raw CSV data to our schema
function transformData(rawData, cityName) {
  return rawData
    .filter(row => row.title && row.title.trim()) // Must have a name
    .map((row, index) => ({
      id: `${slugify(cityName)}-${index + 1}`,
      name: row.title || '',
      type: categorizeType(row.categoryName),
      category: row.categoryName || '',
      phone: row.phone || '',
      rating: parseFloat(row.totalScore) || 0,
      reviewsCount: parseInt(row.reviewsCount) || 0,
      address: {
        street: row.street || '',
        city: row.city || cityName,
        state: row.state || '',
        country: row.countryCode || 'BR'
      },
      website: row.website || '',
      googleMapsUrl: row.url || '',
      // Default empty arrays for future use
      services: [],
      specialties: [],
      images: []
    }))
}

// Categorize as salon or professional
function categorizeType(categoryName) {
  const name = (categoryName || '').toLowerCase()
  if (name.includes('salão') || name.includes('salon') || name.includes('salao')) {
    return 'salon'
  }
  return 'professional'
}

// Create URL-friendly slug
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Extract city name from filename
function getCityFromFilename(filename) {
  // "Belém - Data.csv" -> "Belém"
  // "Hair Salons in SP - Data.csv" -> "São Paulo"
  const name = filename.replace(' - Data.csv', '').replace('.csv', '')

  // Special mappings
  const mappings = {
    'Hair Salons in SP': 'São Paulo',
    'SP': 'São Paulo',
    'RJ': 'Rio de Janeiro'
  }

  return mappings[name] || name
}

// Main function
async function main() {
  console.log('🚀 Starting CSV to JSON conversion...\n')

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    console.log(`📁 Created directory: ${OUTPUT_DIR}`)
  }

  // Get all CSV files
  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.csv'))
  console.log(`📄 Found ${files.length} CSV files\n`)

  const index = {
    cities: [],
    totalListings: 0,
    lastUpdated: new Date().toISOString()
  }

  // Process each CSV file
  for (const file of files) {
    const filePath = path.join(INPUT_DIR, file)
    const cityName = getCityFromFilename(file)
    const citySlug = slugify(cityName)

    console.log(`Processing: ${file}`)
    console.log(`  City: ${cityName} (${citySlug})`)

    // Read and parse CSV
    const csvContent = fs.readFileSync(filePath, 'utf-8')
    const rawData = parseCSV(csvContent)
    console.log(`  Raw records: ${rawData.length}`)

    // Transform data
    const listings = transformData(rawData, cityName)
    console.log(`  Valid listings: ${listings.length}`)

    // Count by type
    const salons = listings.filter(l => l.type === 'salon').length
    const professionals = listings.filter(l => l.type === 'professional').length
    console.log(`  Salons: ${salons}, Professionals: ${professionals}`)

    // Write city JSON file
    const cityData = {
      city: cityName,
      slug: citySlug,
      state: listings[0]?.address?.state || '',
      country: 'BR',
      totalCount: listings.length,
      salonsCount: salons,
      professionalsCount: professionals,
      listings: listings
    }

    const outputPath = path.join(OUTPUT_DIR, `${citySlug}.json`)
    fs.writeFileSync(outputPath, JSON.stringify(cityData, null, 2))
    console.log(`  ✅ Saved: ${citySlug}.json\n`)

    // Add to index
    index.cities.push({
      name: cityName,
      slug: citySlug,
      state: cityData.state,
      totalCount: listings.length,
      salonsCount: salons,
      professionalsCount: professionals
    })
    index.totalListings += listings.length
  }

  // Sort cities by name
  index.cities.sort((a, b) => a.name.localeCompare(b.name))

  // Write index file
  const indexPath = path.join(OUTPUT_DIR, 'index.json')
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2))
  console.log(`📋 Created index.json with ${index.cities.length} cities`)
  console.log(`📊 Total listings: ${index.totalListings}`)
  console.log('\n✅ Conversion complete!')
}

main().catch(console.error)
