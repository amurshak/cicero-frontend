#!/usr/bin/env node

/**
 * Frontend Health Check Script
 * Verifies that the frontend setup is correct and can connect to the backend
 */

const fs = require('fs');
const path = require('path');

console.log('🏥 Hololex Frontend Health Check');
console.log('================================\n');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: Run this script from the frontend directory');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
if (packageJson.name !== 'hololex-frontend') {
  console.error('❌ Error: This doesn\'t appear to be the Hololex frontend directory');
  process.exit(1);
}

console.log('✅ Correct directory confirmed');

// Check node_modules
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.error('❌ Error: node_modules not found. Run: npm install');
  process.exit(1);
}
console.log('✅ Dependencies installed');

// Check .env file
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env file not found. Run: cp .env.example .env');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const apiUrl = envContent.match(/VITE_API_URL=(.+)/)?.[1];
const wsUrl = envContent.match(/VITE_WS_URL=(.+)/)?.[1];

console.log('✅ Environment file exists');
console.log(`📍 API URL: ${apiUrl}`);
console.log(`📍 WebSocket URL: ${wsUrl}`);

// Check if essential dependencies are installed
const requiredDeps = [
  'react',
  'react-dom', 
  'react-router-dom',
  'tailwindcss',
  'lucide-react',
  'axios'
];

console.log('\n📦 Checking dependencies:');
requiredDeps.forEach(dep => {
  const depPath = path.join(nodeModulesPath, dep);
  if (fs.existsSync(depPath)) {
    console.log(`✅ ${dep}`);
  } else {
    console.log(`❌ ${dep} - missing!`);
  }
});

// Check source files
const srcPath = path.join(process.cwd(), 'src');
const essentialFiles = [
  'src/App.jsx',
  'src/main.jsx',
  'src/styles/index.css',
  'src/components/shared/GlassCard.jsx',
  'src/services/api.js'
];

console.log('\n📁 Checking source files:');
essentialFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - missing!`);
  }
});

// Test API connection (if specified)
if (process.argv.includes('--test-api')) {
  console.log('\n🔗 Testing API connection...');
  
  const axios = require('axios');
  const testUrl = apiUrl?.replace('localhost', '127.0.0.1');
  
  if (testUrl && testUrl !== 'http://localhost:8000') {
    axios.get(`${testUrl}/health`, { timeout: 5000 })
      .then(response => {
        console.log('✅ API connection successful');
        console.log(`📊 Response: ${response.status} ${response.statusText}`);
      })
      .catch(error => {
        console.log('❌ API connection failed');
        console.log(`🔍 Error: ${error.message}`);
        console.log('💡 Make sure the backend is running');
      });
  } else {
    console.log('⚠️  API URL is localhost - start backend first');
  }
}

console.log('\n🎉 Health check complete!');
console.log('\n🚀 To start development:');
console.log('   npm run dev');
console.log('\n🔧 To test API connection:');
console.log('   node scripts/health-check.cjs --test-api');