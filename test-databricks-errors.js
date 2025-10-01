#!/usr/bin/env node

/**
 * Test script to demonstrate improved Databricks error handling
 * Run with: node test-databricks-errors.js
 */

const API_BASE_URL = 'http://localhost:3000/api';

async function testDatabricksEndpoints() {
  console.log('🔍 Testing Databricks API Error Handling\n');

  const endpoints = [
    { name: 'Health Check', url: '/databricks/health' },
    { name: 'Connection Test', url: '/databricks/test' },
    { name: 'Parts Query', url: '/databricks/parts?limit=5' },
    { name: 'Invalid Query', url: '/databricks/query', method: 'POST', body: { query: 'INVALID SQL' } }
  ];

  for (const endpoint of endpoints) {
    console.log(`📡 Testing ${endpoint.name}...`);
    
    try {
      const options = {
        method: endpoint.method || 'GET',
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint.url}`, options);
      const data = await response.json();
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Success: ${data.success !== false ? '✅' : '❌'}`);
      
      if (data.diagnostics) {
        console.log(`   Diagnostics:`, JSON.stringify(data.diagnostics, null, 2));
      }
      
      if (data.recommendations) {
        console.log(`   Recommendations:`, data.recommendations);
      }
      
      if (data.error) {
        console.log(`   Error: ${data.error}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
    
    console.log('');
  }
}

async function testHealthEndpoint() {
  console.log('🏥 Testing Enhanced Health Endpoint\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Overall Health: ${data.status}`);
    console.log(`Services:`, data.services);
    
    if (data.databricks) {
      console.log(`Databricks Status: ${data.databricks.status}`);
      if (data.databricks.diagnostics) {
        console.log(`Databricks Diagnostics:`, JSON.stringify(data.databricks.diagnostics, null, 2));
      }
    }
    
  } catch (error) {
    console.log(`❌ Health Check Error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Databricks Error Handling Test Suite\n');
  console.log('This script tests the improved error handling and diagnostics.\n');
  
  await testHealthEndpoint();
  console.log('\n' + '='.repeat(50) + '\n');
  await testDatabricksEndpoints();
  
  console.log('✨ Test completed! Check the output above for detailed error information.');
  console.log('\nKey improvements:');
  console.log('• Enhanced error logging with context');
  console.log('• Retry logic with exponential backoff');
  console.log('• Detailed diagnostics and recommendations');
  console.log('• Proper HTTP status codes');
  console.log('• Fallback to local database when available');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testDatabricksEndpoints, testHealthEndpoint };
