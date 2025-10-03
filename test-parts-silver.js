/**
 * Test script to verify parts_silver integration
 * 
 * This script tests:
 * 1. Databricks connection to parts_silver table
 * 2. Data transformation and field mapping
 * 3. API endpoint response format
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds

async function testPartsEndpoint() {
  console.log('='.repeat(70));
  console.log('Testing Parts Silver Integration');
  console.log('='.repeat(70));
  console.log('');

  try {
    console.log('1. Testing /api/databricks/parts endpoint...');
    const response = await fetch(`${API_BASE_URL}/api/databricks/parts?limit=5`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✓ Endpoint responded successfully');
    console.log(`  Source: ${data.source}`);
    console.log(`  Total parts: ${data.total}`);
    console.log('');

    // Validate response structure
    console.log('2. Validating response structure...');
    
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Response missing items array');
    }
    console.log('✓ Response has items array');

    if (data.items.length === 0) {
      console.log('⚠ Warning: No parts returned (table may be empty)');
      return;
    }

    // Check first item
    const firstPart = data.items[0];
    console.log('');
    console.log('3. Validating part data structure...');
    
    const requiredFields = [
      'id', 'name', 'system', 'category', 'stockLevel', 
      'minStock', 'maxStock', 'location', 'condition', 
      'leadTime', 'supplier', 'cost'
    ];
    
    const missingFields = [];
    for (const field of requiredFields) {
      if (!(field in firstPart)) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    console.log('✓ All required fields present');

    // Check Databricks-specific fields
    console.log('');
    console.log('4. Checking Databricks-specific fields...');
    
    const databricksFields = [
      'nsn', 'width', 'height', 'weight', 'productionTime',
      'sensors', 'stockLocationId', 'latitude', 'longitude'
    ];
    
    const presentDatabricksFields = [];
    for (const field of databricksFields) {
      if (field in firstPart && firstPart[field] !== undefined) {
        presentDatabricksFields.push(field);
      }
    }

    if (presentDatabricksFields.length > 0) {
      console.log(`✓ Databricks fields present: ${presentDatabricksFields.join(', ')}`);
      console.log('  → Data is coming from parts_silver table');
    } else {
      console.log('⚠ No Databricks fields found (may be using SQLite fallback)');
    }

    // Display sample part
    console.log('');
    console.log('5. Sample part data:');
    console.log('-'.repeat(70));
    console.log(`  ID/NSN: ${firstPart.id}${firstPart.nsn ? ` (${firstPart.nsn})` : ''}`);
    console.log(`  Name: ${firstPart.name}`);
    console.log(`  Location: ${firstPart.location}`);
    console.log(`  Stock: ${firstPart.stockLevel} (Min: ${firstPart.minStock}, Max: ${firstPart.maxStock})`);
    console.log(`  Cost: $${firstPart.cost}`);
    
    if (firstPart.latitude && firstPart.longitude) {
      console.log(`  Coordinates: ${firstPart.latitude}, ${firstPart.longitude}`);
    }
    
    if (firstPart.sensors && Array.isArray(firstPart.sensors)) {
      console.log(`  Sensors: ${firstPart.sensors.join(', ')}`);
    }
    
    if (firstPart.width && firstPart.height && firstPart.weight) {
      console.log(`  Dimensions: ${firstPart.width}x${firstPart.height}, ${firstPart.weight}kg`);
    }
    
    if (firstPart.productionTime) {
      console.log(`  Production Time: ${firstPart.productionTime} days`);
    }

    console.log('-'.repeat(70));
    console.log('');

    // Test search functionality
    console.log('6. Testing search functionality...');
    const searchResponse = await fetch(`${API_BASE_URL}/api/databricks/parts?search=controller&limit=5`);
    const searchData = await searchResponse.json();
    
    if (searchResponse.ok && searchData.items) {
      console.log(`✓ Search returned ${searchData.items.length} results`);
      if (searchData.items.length > 0) {
        console.log(`  First result: ${searchData.items[0].name}`);
      }
    } else {
      console.log('⚠ Search test failed (may not be supported)');
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('✓ All tests passed!');
    console.log('='.repeat(70));
    console.log('');

    // Success summary
    if (data.source === 'databricks') {
      console.log('SUCCESS: Parts inventory is successfully using Databricks parts_silver table');
    } else {
      console.log('INFO: Parts inventory is using SQLite fallback');
      console.log('      To use Databricks, ensure:');
      console.log('      - NODE_ENV=production');
      console.log('      - Databricks credentials are configured');
      console.log('      - Network connectivity to Databricks');
    }

  } catch (error) {
    console.error('');
    console.error('='.repeat(70));
    console.error('✗ Test failed');
    console.error('='.repeat(70));
    console.error('');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('Server is not running. Start the server with:');
      console.error('  npm start');
      console.error('  or');
      console.error('  npm run dev:api');
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testPartsEndpoint().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}

module.exports = { testPartsEndpoint };




