// deploy-client.js - Automated client deployment script

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const clientName = process.argv[2];
if (!clientName) {
  console.error('Usage: node deploy-client.js <clientName>');
  process.exit(1);
}

// Assume customization data is in customization-data.json
const customizationPath = path.join(__dirname, '../../salesfunnel/customization-data.json');
if (!fs.existsSync(customizationPath)) {
  console.error('Customization data not found at', customizationPath);
  process.exit(1);
}

const customizationData = JSON.parse(fs.readFileSync(customizationPath, 'utf8'));
const clientData = customizationData[clientName];
if (!clientData) {
  console.error(`No data for client ${clientName}`);
  process.exit(1);
}

// Create client folder
const clientDir = path.join(__dirname, clientName);
if (!fs.existsSync(clientDir)) {
  fs.mkdirSync(clientDir);
}

// Generate config-{client}.js
const configTemplate = `
export const ${clientName.toUpperCase()}_SHARED_CONFIG = {
  client_id: '${clientName}',
  brand_name: '${clientData.brandName || clientName}',
  brand_voice: '${clientData.brandVoice || 'Professional AI assistant'}',
  default_tone: '${clientData.tone || 'professional'}',
  handles: ${JSON.stringify(clientData.handles || {})},
  features: ${JSON.stringify(clientData.features || [])},
  // Add more from customization data
};
`;

const configFile = path.join(clientDir, `config-${clientName}.js`);
fs.writeFileSync(configFile, configTemplate);

// Update orchestrator's wrangler.toml to add service binding
const orchestratorTomlPath = path.join(__dirname, '../wrangler-orchestrator.toml');
let orchestratorToml = fs.readFileSync(orchestratorTomlPath, 'utf8');
const newService = `
[[services]]
binding = "CLIENT_${clientName.toUpperCase()}"
service = "hub-${clientName}"
`;
orchestratorToml += newService;
fs.writeFileSync(orchestratorTomlPath, orchestratorToml);

// Update orchestrator.js to add client binding
const orchestratorJsPath = path.join(__dirname, '../orchestrator.js');
let orchestratorJs = fs.readFileSync(orchestratorJsPath, 'utf8');
const bindingLine = `    '${clientName}': env.CLIENT_${clientName.toUpperCase()},`;
orchestratorJs = orchestratorJs.replace(/(clientBindings = \{[\s\S]*?)(\};)/, `$1${bindingLine}\n$2`);
fs.writeFileSync(orchestratorJsPath, orchestratorJs);

// Deploy client worker
try {
  execSync(`cd ${clientDir} && npx wrangler deploy --config ${path.basename(tomlPath)}`, { stdio: 'inherit' });
  console.log(`Client worker ${clientName} deployed successfully!`);
} catch (error) {
  console.error('Client deployment failed:', error.message);
  process.exit(1);
}

// Redeploy orchestrator to include new binding
try {
  execSync(`cd ${path.join(__dirname, '..')} && npx wrangler deploy`, { stdio: 'inherit' });
  console.log(`Orchestrator redeployed with new client binding!`);
} catch (error) {
  console.error('Orchestrator redeployment failed:', error.message);
  process.exit(1);
}