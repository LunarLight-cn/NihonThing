import fs from 'fs'
import path from 'path'

const OUT_FILE = path.join(process.cwd(), 'location-seed.sql')

async function fetchJson(url: string) {
  const res = await fetch(url)
  return res.json()
}

function escapeSql(str: string | null) {
  if (!str) return 'NULL'
  return `'${str.replace(/'/g, "''")}'`
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

async function run() {
  console.log('Fetching Thai location data...')
  
  const [provinces, districts, subdistricts] = await Promise.all([
    fetchJson('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest/province.json'),
    fetchJson('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest/district.json'),
    fetchJson('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest/sub_district.json')
  ])

  console.log(`Found ${provinces.length} provinces, ${districts.length} districts, ${subdistricts.length} subdistricts.`)

  let sql = `-- Location Seeding Script for NihonThing\n`
  sql += `-- Auto-generated from open source thai-province-data\n\n`
  
  sql += `DELETE FROM Subdistricts;\n`
  sql += `DELETE FROM Districts;\n`
  sql += `DELETE FROM Provinces;\n`
  sql += `DELETE FROM Countries;\n\n`

  sql += `INSERT INTO Countries (id, name_th, name_en, name_jp) VALUES (1, 'ประเทศไทย', 'Thailand', 'タイ');\n\n`

  // Provinces
  const provChunks = chunkArray(provinces, 100)
  for (const chunk of provChunks) {
    const values = chunk.map((p: any) => `(${p.id}, 1, ${escapeSql(p.name_th)}, ${escapeSql(p.name_en)}, NULL)`).join(',\n  ')
    sql += `INSERT INTO Provinces (id, country_id, name_th, name_en, name_jp) VALUES\n  ${values};\n`
  }

  // Districts
  const distChunks = chunkArray(districts, 100)
  for (const chunk of distChunks) {
    const values = chunk.map((d: any) => `(${d.id}, ${d.province_id}, ${escapeSql(d.name_th)}, ${escapeSql(d.name_en)}, NULL)`).join(',\n  ')
    sql += `INSERT INTO Districts (id, province_id, name_th, name_en, name_jp) VALUES\n  ${values};\n`
  }

  // Subdistricts
  const subChunks = chunkArray(subdistricts, 100)
  for (const chunk of subChunks) {
    const values = chunk.map((s: any) => `(${s.id}, ${s.district_id}, ${escapeSql(s.name_th)}, ${escapeSql(s.name_en)}, NULL, ${escapeSql(s.zip_code?.toString())})`).join(',\n  ')
    sql += `INSERT INTO Subdistricts (id, district_id, name_th, name_en, name_jp, postal_code) VALUES\n  ${values};\n`
  }

  fs.writeFileSync(OUT_FILE, sql, 'utf8')
  console.log(`\nSuccessfully generated: ${OUT_FILE}`)
  console.log('You can now run:')
  console.log('npx wrangler d1 execute nihonthing-db --local --file=location-seed.sql')
  console.log('npx wrangler d1 execute nihonthing-db --remote --file=location-seed.sql')
}

run().catch(console.error)
