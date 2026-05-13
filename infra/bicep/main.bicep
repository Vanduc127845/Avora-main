// AI Career Copilot for Disabled - Azure Infrastructure
// This Bicep template deploys the complete infrastructure to Azure

@description('Environment name (dev, staging, prod)')
param environment string = 'dev'

@description('Location for resources')
param location string = resourceGroup().location

@description('Unique prefix for resource names')
param uniquePrefix string = 'ai4a'

var resourcePrefix = '${uniquePrefix}-${environment}'

// Tags for all resources
var tags = {
  Project: 'AI4A'
  Environment: environment
  ManagedBy: 'Bicep'
}

// ============================================
// Resource Group
// ============================================
resource resourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: 'rg-${resourcePrefix}'
  location: location
  tags: tags
}

// ============================================
// Azure OpenAI Service
// ============================================
resource openAiAccount 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: 'cog-${resourcePrefix}'
  location: location
  tags: tags
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: 'cog-${resourcePrefix}'
    publicNetworkAccess: 'Enabled'
    capabilities: [
      {
        name: 'OpenAI'
        value: 'true'
      }
    ]
  }
}

resource openAiDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openAiAccount
  name: 'gpt-4o'
  location: location
  tags: tags
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4o'
      version: '2024-08-06'
    }
    capacity: 10
    raiPolicyName: 'Microsoft.Default.RAIPolicy'
  }
}

// ============================================
// Azure Cosmos DB
// ============================================
resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: 'cosmos-${resourcePrefix}'
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    databaseAccountOfferType: 'Standard'
    enableAutomaticFailover: true
    enableFreeTier: false
  }
}

resource cosmosDbDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosDbAccount
  name: 'ai4a'
  location: location
  properties: {
    resource: {
      id: 'ai4a'
    }
    options: {}
  }
}

resource cosmosDbContainerUsers 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDbDatabase
  name: 'users'
  location: location
  properties: {
    resource: {
      id: 'users'
      partitionKey: {
        paths: [
          '/userId'
        ]
        kind: 'Hash'
      }
      indexingPolicy: {
        automatic: true
      }
    }
  }
}

resource cosmosDbContainerAssessments 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDbDatabase
  name: 'assessments'
  location: location
  properties: {
    resource: {
      id: 'assessments'
      partitionKey: {
        paths: [
          '/userId'
        ]
        kind: 'Hash'
      }
    }
  }
}

resource cosmosDbContainerInterviews 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDbDatabase
  name: 'interviews'
  location: location
  properties: {
    resource: {
      id: 'interviews'
      partitionKey: {
        paths: [
          '/userId'
        ]
        kind: 'Hash'
      }
    }
  }
}

// ============================================
// Azure SQL Database
// ============================================
resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: 'sql-${resourcePrefix}'
  location: location
  tags: tags
  properties: {
    administratorLogin: 'sqladmin'
    administratorLoginPassword: 'P@ssw0rd123456!'
    version: '12.0'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: sqlServer
  name: 'ai4a'
  location: location
  tags: tags
  sku: {
    name: 'S0'
    tier: 'Standard'
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 268435456000
  }
}

resource sqlFirewallRule 'Microsoft.Sql/servers/firewallRules@2022-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAllAzureIPs'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ============================================
// Azure Blob Storage
// ============================================
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'storage${resourcePrefix}'
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
  }
}

resource storageContainerUploads 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: storageAccount
  name: 'uploads'
  properties: {
    publicAccess: 'Private'
    metadata: {}
  }
}

resource storageContainerProfiles 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: storageAccount
  name: 'profiles'
  properties: {
    publicAccess: 'Private'
  }
}

// ============================================
// Azure Redis Cache
// ============================================
resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: 'redis-${resourcePrefix}'
  location: location
  tags: tags
  sku: {
    name: 'Standard'
    family: 'C'
    capacity: 1
  }
  properties: {
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    redisVersion: 'latest'
  }
}

// ============================================
// App Service Plan
// ============================================
resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: 'asp-${resourcePrefix}'
  location: location
  tags: tags
  sku: {
    name: 'S1'
    tier: 'Standard'
    size: 'S1'
    family: 'S'
    capacity: 1
  }
  kind: 'app'
  properties: {
    reserved: false
  }
}

// ============================================
// Web App - Frontend
// ============================================
resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: 'web-${resourcePrefix}'
  location: location
  tags: tags
  kind: 'app'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'VITE_API_URL'
          value: 'https://api-${resourcePrefix}.azurewebsites.net'
        }
        {
          name: 'VITE_APP_NAME'
          value: 'AI Career Copilot'
        }
      ]
      healthCheckPath: '/health'
      minTlsVersion: '1.2'
      netFrameworkVersion: 'v8.0'
    }
    httpsOnly: true
  }
}

// ============================================
// API App Service
// ============================================
resource apiApp 'Microsoft.Web/sites@2022-03-01' = {
  name: 'api-${resourcePrefix}'
  location: location
  tags: tags
  kind: 'app'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'Azure__OpenAI__Endpoint'
          value: openAiAccount.properties.endpoint
        }
        {
          name: 'Azure__OpenAI__ApiKey'
          value: listKeys(openAiAccount.name, '2023-05-01').key1
        }
        {
          name: 'Azure__OpenAI__Deployment'
          value: openAiDeployment.name
        }
        {
          name: 'CosmosDB__ConnectionString'
          value: listConnectionStrings(cosmosDbAccount.name, '2023-04-15').connectionStrings[0].connectionString
        }
        {
          name: 'CosmosDB__Database'
          value: 'ai4a'
        }
        {
          name: 'SQL__ConnectionString'
          value: 'Server=tcp:sql-${resourcePrefix}.database.windows.net;Database=ai4a;User Id=sqladmin;Password=P@ssw0rd123456!;'
        }
        {
          name: 'Storage__ConnectionString'
          value: listKeys(storageAccount.name, '2023-01-01').keys[0].value
        }
        {
          name: 'Storage__ContainerName'
          value: 'uploads'
        }
        {
          name: 'Redis__ConnectionString'
          value: '${redisCache.name}.redis.cache.windows.net:6380'
        }
        {
          name: 'Redis__AccessKey'
          value: listKeys(redisCache.name, '2023-08-01').primaryKey
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'PORT'
          value: '4000'
        }
      ]
      healthCheckPath: '/health'
      minTlsVersion: '1.2'
      netFrameworkVersion: 'v8.0'
    }
    httpsOnly: true
  }
}

// ============================================
// Application Insights
// ============================================
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${resourcePrefix}'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Flow_Type: 'Redfield'
    Request_Source: 'IbizaAIExtension'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ============================================
// Key Vault
// ============================================
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-${resourcePrefix}'
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enablePurgeProtection: false
  }
}

// ============================================
// Outputs
// ============================================
output webAppUrl string = 'https://web-${resourcePrefix}.azurewebsites.net'
output apiUrl string = 'https://api-${resourcePrefix}.azurewebsites.net'
output openAiEndpoint string = openAiAccount.properties.endpoint
output cosmosDbEndpoint string = cosmosDbAccount.properties.documentEndpoint
output storageAccountName string = storageAccount.name
output keyVaultName string = keyVault.name
output applicationInsightsInstrumentationKey string = applicationInsights.properties.InstrumentationKey
output resourceGroupName string = resourceGroup.name
