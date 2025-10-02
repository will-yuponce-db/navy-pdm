#!/usr/bin/env node
/**
 * Test script to import Databricks parts data from CSV
 */

const csvData = `NSN,type,width,height,weight,stock_available,stock_location,production_time,sensors,stock_location_id,lat,long
87115871,Valve - Fuel / Oil,425,278,4145,9,FLC San Diego,4,"[""sensor_D"",""sensor_C""]",supply_5,32.684722,-117.13
51393328,Filter - Fuel / Oil,709,1205,5965,9,FLC Norfolk,3,"[""sensor_B""]",supply_2,36.945,-76.313056
66048763,Vane - Turbine,1075,1125,18089,2,FLC Puget Sound,0,"[""sensor_F""]",supply_4,47.6,-122.4
16097537,Pump - Fuel,273,1527,15991,1,FLC Pearl Harbor,4,"[""sensor_D""]",supply_3,21.3647,-157.9498
87115871,Valve - Fuel / Oil,1983,740,12924,2,FLC Norfolk,2,"[""sensor_C"",""sensor_B""]",supply_2,36.945,-76.313056
66048763,Vane - Turbine,480,664,4162,7,FLC Jacksonville,4,"[""sensor_F""]",supply_1,30.39349,-81.410574
16097537,Pump - Fuel,217,1238,3546,1,FLC Norfolk,2,"[""sensor_D""]",supply_2,36.945,-76.313056
42194897,Fuel Nozzle,899,1746,9245,5,FLC Puget Sound,2,"[""sensor_C""]",supply_4,47.6,-122.4
42194897,Fuel Nozzle,1427,775,3028,10,FLC Pearl Harbor,4,"[""sensor_A"",""sensor_B""]",supply_3,21.3647,-157.9498
16097537,Pump - Fuel,371,1996,5190,5,FLC Puget Sound,2,"[""sensor_A"",""sensor_B""]",supply_4,47.6,-122.4
42194897,Fuel Nozzle,500,164,16644,9,FLC San Diego,3,"[""sensor_E""]",supply_5,32.684722,-117.13
16097537,Pump - Fuel,556,1016,12862,2,FLC San Diego,2,"[""sensor_E"",""sensor_B""]",supply_5,32.684722,-117.13
42194897,Fuel Nozzle,1129,1019,1852,4,FLC Norfolk,5,"[""sensor_A"",""sensor_B""]",supply_2,36.945,-76.313056
24115780,Seal,1991,1757,15132,7,FLC Jacksonville,4,"[""sensor_B""]",supply_1,30.39349,-81.410574
24115780,Seal,574,956,15639,2,FLC Pearl Harbor,2,"[""sensor_D"",""sensor_A""]",supply_3,21.3647,-157.9498
24115780,Seal,1074,676,18324,10,FLC Puget Sound,5,"[""sensor_C""]",supply_4,47.6,-122.4
24115780,Seal,1853,812,1059,6,FLC San Diego,2,"[""sensor_C"",""sensor_B""]",supply_5,32.684722,-117.13
24115780,Seal,1531,916,1885,4,FLC Norfolk,4,"[""sensor_D"",""sensor_C""]",supply_2,36.945,-76.313056
47593824,Blade - Turbine,1390,433,18327,1,FLC Pearl Harbor,3,"[""sensor_F""]",supply_3,21.3647,-157.9498
15659385,controller card #1 - ECU,852,1598,5360,10,FLC Pearl Harbor,1,"[""sensor_E"",""sensor_C""]",supply_3,21.3647,-157.9498
66048763,Vane - Turbine,1597,1711,16022,1,FLC Pearl Harbor,2,"[""sensor_F""]",supply_3,21.3647,-157.9498
77840806,controller card #2 - ECU,1081,729,3177,3,FLC Pearl Harbor,3,"[""sensor_E""]",supply_3,21.3647,-157.9498
42194897,Fuel Nozzle,768,1712,13011,1,FLC Jacksonville,4,"[""sensor_A"",""sensor_D""]",supply_1,30.39349,-81.410574
16097537,Pump - Fuel,147,1811,15698,8,FLC Jacksonville,2,"[""sensor_D"",""sensor_B""]",supply_1,30.39349,-81.410574
66048763,Vane - Turbine,1245,1574,18995,4,FLC San Diego,4,"[""sensor_F""]",supply_5,32.684722,-117.13
15659385,controller card #1 - ECU,935,515,8577,0,FLC San Diego,0,"[""sensor_C"",""sensor_D""]",supply_5,32.684722,-117.13
15659385,controller card #1 - ECU,1134,1234,7217,8,FLC Jacksonville,1,"[""sensor_E""]",supply_1,30.39349,-81.410574
47593824,Blade - Turbine,1374,387,13146,0,FLC Jacksonville,4,"[""sensor_F""]",supply_1,30.39349,-81.410574
77840806,controller card #2 - ECU,369,1912,13562,7,FLC San Diego,4,"[""sensor_D"",""sensor_E""]",supply_5,32.684722,-117.13
15659385,controller card #1 - ECU,819,175,14865,4,FLC Norfolk,1,"[""sensor_C""]",supply_2,36.945,-76.313056
47593824,Blade - Turbine,953,858,11413,6,FLC San Diego,2,"[""sensor_F""]",supply_5,32.684722,-117.13
77840806,controller card #2 - ECU,563,1681,17494,5,FLC Jacksonville,1,"[""sensor_C"",""sensor_A""]",supply_1,30.39349,-81.410574
47593824,Blade - Turbine,1399,997,13384,6,FLC Puget Sound,1,"[""sensor_F""]",supply_4,47.6,-122.4
77840806,controller card #2 - ECU,608,584,14488,9,FLC Norfolk,2,"[""sensor_A"",""sensor_D""]",supply_2,36.945,-76.313056
51393328,Filter - Fuel / Oil,1839,1084,6556,8,FLC Puget Sound,2,"[""sensor_B""]",supply_4,47.6,-122.4
51393328,Filter - Fuel / Oil,693,1202,15177,5,FLC Pearl Harbor,2,"[""sensor_B"",""sensor_D""]",supply_3,21.3647,-157.9498
51393328,Filter - Fuel / Oil,1942,1874,4262,10,FLC Jacksonville,2,"[""sensor_C"",""sensor_E""]",supply_1,30.39349,-81.410574
87115871,Valve - Fuel / Oil,747,1096,10920,4,FLC Pearl Harbor,4,"[""sensor_A"",""sensor_D""]",supply_3,21.3647,-157.9498
66048763,Vane - Turbine,821,227,6582,5,FLC Norfolk,1,"[""sensor_F""]",supply_2,36.945,-76.313056
77840806,controller card #2 - ECU,1122,1327,17140,3,FLC Puget Sound,4,"[""sensor_C"",""sensor_D""]",supply_4,47.6,-122.4
87115871,Valve - Fuel / Oil,1747,1845,16530,8,FLC Jacksonville,3,"[""sensor_E"",""sensor_D""]",supply_1,30.39349,-81.410574
47593824,Blade - Turbine,563,1921,15482,3,FLC Norfolk,2,"[""sensor_F""]",supply_2,36.945,-76.313056
15659385,controller card #1 - ECU,692,1153,6444,7,FLC Puget Sound,5,"[""sensor_C""]",supply_4,47.6,-122.4
87115871,Valve - Fuel / Oil,970,1398,1006,9,FLC Puget Sound,1,"[""sensor_E"",""sensor_C""]",supply_4,47.6,-122.4
51393328,Filter - Fuel / Oil,1713,311,9153,3,FLC San Diego,5,"[""sensor_B"",""sensor_D""]",supply_5,32.684722,-117.13`;

// Parse CSV to JSON
function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  const parts = [];

  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let insideQuotes = false;

    // Handle quoted values (especially for sensors array)
    for (let char of lines[i]) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    const part = {};
    headers.forEach((header, index) => {
      let value = values[index];
      
      // Parse numbers
      if (header === 'width' || header === 'height' || header === 'weight' || 
          header === 'stock_available' || header === 'production_time') {
        part[header] = parseInt(value);
      } else if (header === 'lat' || header === 'long') {
        part[header] = parseFloat(value);
      } else if (header === 'sensors') {
        // Parse sensors array
        try {
          part[header] = JSON.parse(value.replace(/""/g, '"'));
        } catch (e) {
          part[header] = [];
        }
      } else {
        part[header] = value;
      }
    });
    parts.push(part);
  }

  return parts;
}

// Main function
async function importParts() {
  try {
    console.log('Parsing CSV data...');
    const parts = parseCSV(csvData);
    console.log(`Parsed ${parts.length} parts from CSV`);

    console.log('\nSample part:');
    console.log(JSON.stringify(parts[0], null, 2));

    console.log('\nSending import request...');
    const response = await fetch('http://localhost:3000/api/parts/import/databricks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parts: parts,
        mode: 'upsert'
      })
    });

    const result = await response.json();
    console.log('\nImport results:');
    console.log(JSON.stringify(result, null, 2));

    if (result.results && result.results.errors && result.results.errors.length > 0) {
      console.log('\nErrors:');
      result.results.errors.forEach(error => {
        console.log(`- ${error.part}: ${error.error}`);
      });
    }

    // Verify import by fetching parts
    console.log('\nVerifying imported parts...');
    const verifyResponse = await fetch('http://localhost:3000/api/parts?limit=5&search=87115871');
    const verifyResult = await verifyResponse.json();
    
    console.log('\nSample imported parts:');
    verifyResult.items.forEach(part => {
      console.log(`- ${part.id}: ${part.name} (NSN: ${part.nsn}, Stock: ${part.stockLevel}, Location: ${part.location})`);
      if (part.sensors) {
        console.log(`  Sensors: ${part.sensors.join(', ')}`);
      }
      if (part.latitude && part.longitude) {
        console.log(`  Coordinates: ${part.latitude}, ${part.longitude}`);
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run import
console.log('=== Databricks Parts Import Test ===\n');
importParts();

