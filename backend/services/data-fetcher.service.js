/**
 * Data Fetcher Service — Real public data ingestion for Phoenix Data Portal
 * 
 * Fetches from keyless public APIs:
 *   1. SEC EDGAR EFTS (sec-filings)
 *   2. USASpending.gov (gov-contracts) 
 *   3. Chicago Building Permits via Socrata (building-permits)
 *   4. NYC DOB Permits via Socrata (building-permits)
 * 
 * All fetched records are normalized to the DataRecord schema and upserted.
 * Zero synthetic data — every record comes from a real public source.
 */

const mongoose = require('mongoose');
const https = require('https');
const http = require('http');

// User-Agent for SEC EDGAR (required by their Fair Access policy)
const SEC_USER_AGENT = 'Phoenix-Business hello@phoenixwebsites.ai';

// Reusable HTTP helpers
function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...headers
      },
      timeout: 15000
    };
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.end();
  });
}

function httpPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    const bodyStr = JSON.stringify(body);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'Accept': 'application/json',
        ...headers
      },
      timeout: 20000
    };
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.write(bodyStr);
    req.end();
  });
}

// ============================================================
//  Source 1: SEC EDGAR EFTS (sec-filings)
// ============================================================

async function fetchFromEDGAR(query = '', limit = 20, offset = 0) {
  try {
    const searchQuery = query || 'construction OR "capital expenditure" OR "real estate"';
    const params = new URLSearchParams({
      q: searchQuery,
      forms: '10-K,10-Q,8-K',
      from: offset.toString(),
      size: Math.min(limit, 50).toString()
    });

    const url = `https://efts.sec.gov/LATEST/search-index?${params}`;
    const result = await httpGet(url, { 'User-Agent': SEC_USER_AGENT });

    if (result.status !== 200 || !result.data?.hits?.hits) {
      console.error('[EDGAR] API error:', result.status);
      return [];
    }

    const records = [];
    for (const hit of result.data.hits.hits) {
      const src = hit._source;
      if (!src) continue;

      const displayName = (src.display_names?.[0] || '').replace(/\s*\(CIK.*$/, '').trim();
      const ticker = (src.display_names?.[0] || '').match(/\(([A-Z]+)\)/)?.[1] || '';
      const bizLocation = src.biz_locations?.[0] || '';
      const [city, state] = bizLocation.split(',').map(s => s.trim());

      if (!displayName) continue;

      records.push({
        sourceType: 'sec-filings',
        sourceId: `edgar-${src.adsh || hit._id}`,
        sourceUrl: `https://www.sec.gov/Archives/edgar/data/${(src.ciks?.[0] || '').replace(/^0+/, '')}/${(src.adsh || '').replace(/-/g, '')}`,
        structured: {
          companyName: displayName + (ticker ? ` (${ticker})` : ''),
          estimatedBudget: 0, // SEC filings don't have budget — enriched later
          projectType: `${src.form || '10-K'} Filing — ${src.file_description || src.file_type || 'Annual Report'}`,
          location: {
            city: city || '',
            state: state || '',
            zip: '',
            fullAddress: bizLocation
          },
          contactInfo: {
            name: '',
            email: '',
            phone: ''
          },
          executiveSummary: `${displayName} filed a ${src.form || '10-K'} with the SEC on ${src.file_date || 'N/A'}. CIK: ${src.ciks?.[0] || 'N/A'}. SIC code: ${src.sics?.[0] || 'N/A'}. Business location: ${bizLocation || 'N/A'}. Filing type: ${src.file_type || 'N/A'}.`,
          tags: [src.form || '10-K', 'sec-filing', 'public-company', ticker].filter(Boolean)
        },
        status: 'processed',
        processedAt: new Date(),
        publishedAt: new Date()
      });
    }

    return records;
  } catch (err) {
    console.error('[EDGAR] Fetch error:', err.message);
    return [];
  }
}

// ============================================================
//  Source 2: USASpending.gov (gov-contracts)
// ============================================================

async function fetchFromUSASpending(query = '', limit = 20, page = 1) {
  try {
    const filters = {
      award_type_codes: ['A', 'B', 'C', 'D'], // All contract types
      time_period: [{
        start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      }]
    };

    if (query) {
      filters.keywords = [query];
    }

    const body = {
      filters,
      fields: [
        'Award ID', 'Recipient Name', 'Award Amount',
        'Description', 'Awarding Agency', 'Awarding Sub Agency',
        'Place of Performance City Code', 'Place of Performance State Code',
        'recipient_id', 'Place of Performance Zip5',
        'Start Date', 'End Date', 'Contract Award Type'
      ],
      page: page,
      limit: Math.min(limit, 100),
      sort: 'Award Amount',
      order: 'desc'
    };

    const result = await httpPost('https://api.usaspending.gov/api/v2/search/spending_by_award/', body);

    if (result.status !== 200 || !result.data?.results) {
      console.error('[USASpending] API error:', result.status, typeof result.data === 'string' ? result.data.substring(0, 200) : '');
      return [];
    }

    const records = [];
    for (const award of result.data.results) {
      const recipientName = award['Recipient Name'] || '';
      const awardAmount = parseFloat(award['Award Amount']) || 0;
      if (!recipientName || awardAmount <= 0) continue;

      const awardId = award['Award ID'] || `usa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const agency = award['Awarding Agency'] || award['Awarding Sub Agency'] || '';
      const city = award['Place of Performance City Code'] || '';
      const state = award['Place of Performance State Code'] || '';

      records.push({
        sourceType: 'gov-contracts',
        sourceId: `usaspending-${awardId}`,
        sourceUrl: `https://www.usaspending.gov/award/${encodeURIComponent(awardId)}`,
        structured: {
          companyName: recipientName,
          estimatedBudget: Math.round(awardAmount),
          projectType: (award['Description'] || 'Federal Contract').substring(0, 200),
          location: {
            city: city,
            state: state,
            zip: award['Place of Performance Zip5'] || '',
            fullAddress: `${city}${state ? ', ' + state : ''}`
          },
          contactInfo: {
            name: '',
            email: '',
            phone: ''
          },
          executiveSummary: `${agency} awarded a $${awardAmount >= 1000000 ? (awardAmount / 1000000).toFixed(1) + 'M' : (awardAmount / 1000).toFixed(0) + 'K'} contract to ${recipientName}. ${award['Description'] || ''}. Contract type: ${award['Contract Award Type'] || 'N/A'}. Performance period: ${award['Start Date'] || 'N/A'} to ${award['End Date'] || 'N/A'}.`,
          tags: ['federal-contract', 'gov-contracts', agency.toLowerCase().replace(/[^a-z0-9]+/g, '-')].filter(Boolean)
        },
        status: 'processed',
        processedAt: new Date(),
        publishedAt: new Date()
      });
    }

    return records;
  } catch (err) {
    console.error('[USASpending] Fetch error:', err.message);
    return [];
  }
}

// ============================================================
//  Source 3: Chicago Building Permits (Socrata SODA)
// ============================================================

async function fetchFromChicago(query = '', limit = 20, offset = 0) {
  try {
    let url = `https://data.cityofchicago.org/resource/ydr8-5enu.json?$limit=${Math.min(limit, 50)}&$offset=${offset}&$order=issue_date DESC`;

    if (query) {
      // Socrata SoQL $where clause for text search
      const escaped = query.replace(/'/g, "''");
      url += `&$where=upper(work_description) like upper('%25${encodeURIComponent(escaped)}%25') OR upper(contact_3_name) like upper('%25${encodeURIComponent(escaped)}%25')`;
    }

    const result = await httpGet(url);
    if (result.status !== 200 || !Array.isArray(result.data)) {
      console.error('[Chicago] API error:', result.status);
      return [];
    }

    const records = [];
    for (const permit of result.data) {
      const contractor = permit.contact_3_name || permit.contact_1_name || '';
      const owner = permit.contact_1_name || '';
      if (!contractor && !owner) continue;

      const address = [
        permit.street_number,
        permit.street_direction,
        permit.street_name
      ].filter(Boolean).join(' ');

      records.push({
        sourceType: 'building-permits',
        sourceId: `chicago-${permit.id || permit.permit_ || Date.now()}`,
        sourceUrl: `https://data.cityofchicago.org/resource/ydr8-5enu.json?id=${permit.id || ''}`,
        structured: {
          companyName: contractor || owner,
          estimatedBudget: parseInt(permit.reported_cost) || parseInt(permit.total_fee) || 0,
          projectType: permit.work_type || 'Building Permit',
          location: {
            city: 'Chicago',
            state: 'IL',
            zip: permit.contact_1_zipcode || '',
            fullAddress: address ? `${address}, Chicago, IL` : 'Chicago, IL'
          },
          contactInfo: {
            name: owner || contractor,
            email: '', // Not in public data
            phone: ''
          },
          executiveSummary: `Building permit ${permit.permit_ || 'N/A'} issued on ${permit.issue_date ? permit.issue_date.split('T')[0] : 'N/A'} in Chicago, IL. ${permit.work_description || ''}. Reported cost: $${parseInt(permit.reported_cost || 0).toLocaleString()}. Owner: ${owner}. Contractor: ${contractor}. Status: ${permit.permit_status || 'N/A'}.`,
          tags: ['building-permit', 'chicago', permit.work_type?.toLowerCase().replace(/[^a-z0-9]+/g, '-')].filter(Boolean)
        },
        status: 'processed',
        processedAt: new Date(),
        publishedAt: new Date()
      });
    }

    return records;
  } catch (err) {
    console.error('[Chicago] Fetch error:', err.message);
    return [];
  }
}

// ============================================================
//  Source 4: NYC DOB Permits (Socrata SODA)
// ============================================================

async function fetchFromNYC(query = '', limit = 20, offset = 0) {
  try {
    let url = `https://data.cityofnewyork.us/resource/ipu4-2q9a.json?$limit=${Math.min(limit, 50)}&$offset=${offset}&$order=issuance_date DESC`;

    if (query) {
      const escaped = query.replace(/'/g, "''");
      url += `&$where=upper(job_description) like upper('%25${encodeURIComponent(escaped)}%25') OR upper(owner_s_first_name) like upper('%25${encodeURIComponent(escaped)}%25') OR upper(owner_s_last_name) like upper('%25${encodeURIComponent(escaped)}%25')`;
    }

    const result = await httpGet(url);
    if (result.status !== 200 || !Array.isArray(result.data)) {
      console.error('[NYC] API error:', result.status);
      return [];
    }

    const records = [];
    for (const permit of result.data) {
      const ownerFirst = permit.owner_s_first_name || '';
      const ownerLast = permit.owner_s_last_name || '';
      const ownerBiz = permit.owner_s_business_name || '';
      const companyName = ownerBiz || `${ownerFirst} ${ownerLast}`.trim();
      if (!companyName) continue;

      const borough = permit.borough || '';
      const boroughNames = { MANHATTAN: 'Manhattan', BROOKLYN: 'Brooklyn', QUEENS: 'Queens', BRONX: 'Bronx', 'STATEN ISLAND': 'Staten Island' };

      const address = [
        permit.house__,
        permit.street_name
      ].filter(Boolean).join(' ');

      records.push({
        sourceType: 'building-permits',
        sourceId: `nyc-${permit.job__ || permit.bin__ || Date.now()}-${permit.issuance_date || ''}`,
        sourceUrl: `https://data.cityofnewyork.us/resource/ipu4-2q9a.json?job__=${permit.job__ || ''}`,
        structured: {
          companyName: companyName,
          estimatedBudget: parseFloat(permit.initial_cost) || parseFloat(permit.total_est__fee) || 0,
          projectType: permit.job_description || permit.job_type || 'Building Permit',
          location: {
            city: boroughNames[borough.toUpperCase()] || borough || 'New York',
            state: 'NY',
            zip: permit.zip_code || '',
            fullAddress: address ? `${address}, ${boroughNames[borough.toUpperCase()] || 'New York'}, NY ${permit.zip_code || ''}`.trim() : `New York, NY`
          },
          contactInfo: {
            name: `${ownerFirst} ${ownerLast}`.trim() || ownerBiz,
            email: '',
            phone: permit.owner_s_phone__ || ''
          },
          executiveSummary: `NYC DOB permit (Job #${permit.job__ || 'N/A'}) issued ${permit.issuance_date ? permit.issuance_date.split('T')[0] : 'N/A'} in ${boroughNames[borough.toUpperCase()] || 'New York'}, NY. ${permit.job_description || ''}. Filing type: ${permit.filing_status || 'N/A'}. Initial cost: $${(parseFloat(permit.initial_cost) || 0).toLocaleString()}. Owner: ${companyName}.`,
          tags: ['building-permit', 'nyc', (boroughNames[borough.toUpperCase()] || '').toLowerCase(), permit.job_type?.toLowerCase()].filter(Boolean)
        },
        status: 'processed',
        processedAt: new Date(),
        publishedAt: new Date()
      });
    }

    return records;
  } catch (err) {
    console.error('[NYC] Fetch error:', err.message);
    return [];
  }
}

// ============================================================
//  Unified Fetch + Upsert
// ============================================================

/**
 * Fetch from a specific source and upsert into MongoDB.
 * Returns array of upserted DataRecord documents.
 */
async function fetchAndUpsert(source, query, limit, offsetOrPage) {
  let DataRecord;
  try { DataRecord = mongoose.model('DataRecord'); } catch (e) { return []; }

  let rawRecords = [];
  switch (source) {
    case 'sec-filings':
    case 'edgar':
      rawRecords = await fetchFromEDGAR(query, limit, offsetOrPage || 0);
      break;
    case 'gov-contracts':
    case 'usaspending':
      rawRecords = await fetchFromUSASpending(query, limit, offsetOrPage || 1);
      break;
    case 'building-permits-chicago':
    case 'chicago':
      rawRecords = await fetchFromChicago(query, limit, offsetOrPage || 0);
      break;
    case 'building-permits-nyc':
    case 'nyc':
      rawRecords = await fetchFromNYC(query, limit, offsetOrPage || 0);
      break;
    case 'building-permits':
      // Split between Chicago and NYC
      const half = Math.ceil(limit / 2);
      const chicago = await fetchFromChicago(query, half, offsetOrPage || 0);
      const nyc = await fetchFromNYC(query, limit - half, offsetOrPage || 0);
      rawRecords = [...chicago, ...nyc];
      break;
    default:
      console.error(`[DataFetcher] Unknown source: ${source}`);
      return [];
  }

  const upserted = [];
  for (const record of rawRecords) {
    try {
      const doc = await DataRecord.findOneAndUpdate(
        { sourceType: record.sourceType, sourceId: record.sourceId },
        { $setOnInsert: record },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      upserted.push(doc);
    } catch (err) {
      // Duplicate key errors are expected (already exists) — skip silently
      if (err.code !== 11000) {
        console.error(`[DataFetcher] Upsert error for ${record.sourceId}:`, err.message);
      }
    }
  }

  console.log(`[DataFetcher] ${source}: fetched ${rawRecords.length}, upserted ${upserted.length} new`);
  return upserted;
}

/**
 * Fetch a single random real record from any source.
 * Used for purchase → replacement.
 */
async function fetchRandom() {
  const sources = ['edgar', 'usaspending', 'chicago', 'nyc'];
  const source = sources[Math.floor(Math.random() * sources.length)];
  const randomOffset = Math.floor(Math.random() * 500);

  console.log(`[DataFetcher] Fetching random record from ${source} at offset ${randomOffset}`);
  const records = await fetchAndUpsert(source, '', 1, randomOffset);
  return records[0] || null;
}

/**
 * Fetch from all sources. Used for initial population.
 */
async function fetchFromAllSources(perSource = 50) {
  console.log(`[DataFetcher] Fetching ${perSource} records per source...`);
  
  const results = await Promise.allSettled([
    fetchAndUpsert('edgar', '', perSource, 0),
    fetchAndUpsert('usaspending', '', perSource, 1),
    fetchAndUpsert('chicago', '', perSource, 0),
    fetchAndUpsert('nyc', '', perSource, 0)
  ]);

  let total = 0;
  for (const r of results) {
    if (r.status === 'fulfilled') total += r.value.length;
    else console.error('[DataFetcher] Source failed:', r.reason?.message);
  }

  console.log(`[DataFetcher] Total new records inserted: ${total}`);
  return total;
}

module.exports = {
  fetchFromEDGAR,
  fetchFromUSASpending,
  fetchFromChicago,
  fetchFromNYC,
  fetchAndUpsert,
  fetchRandom,
  fetchFromAllSources
};
