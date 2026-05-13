# Azure Infrastructure for AI Career Copilot (AI4A)

This directory contains Infrastructure as Code (IaC) using Azure Bicep to deploy the complete infrastructure for the AI Career Copilot platform.

## Overview

The infrastructure includes:

- **Azure OpenAI Service** - GPT-4o for AI features
- **Azure Cosmos DB** - NoSQL database for user profiles, assessments, interviews
- **Azure SQL Database** - Relational database for structured data
- **Azure Blob Storage** - File storage for CVs, recordings
- **Azure Redis Cache** - Session and rate limiting cache
- **Azure App Service** - Hosting for Web and API
- **Application Insights** - Monitoring and analytics
- **Key Vault** - Secrets management

## Prerequisites

1. Azure CLI installed and configured
2. PowerShell 7+ or Azure CLI
3. Azure subscription with sufficient permissions

## Deployment

### Option 1: Deploy using PowerShell

```powershell
# Login to Azure
Connect-AzAccount

# Set variables
$resourceGroup = "rg-ai4a-dev"
$location = "eastus"

# Create resource group
New-AzResourceGroup -Name $resourceGroup -Location $location

# Deploy infrastructure
New-AzResourceGroupDeployment `
  -ResourceGroupName $resourceGroup `
  -TemplateFile ./main.bicep `
  -TemplateParameterFile ./parameters.json `
  -environment "dev" `
  -location $location `
  -uniquePrefix "ai4a"
```

### Option 2: Deploy using Azure CLI

```bash
# Login to Azure
az login

# Set variables
RESOURCE_GROUP="rg-ai4a-dev"
LOCATION="eastus"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Deploy infrastructure
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file ./main.bicep \
  --parameters ./parameters.json \
  --parameters environment=dev \
  --parameters location=$LOCATION \
  --parameters uniquePrefix=ai4a
```

## Resource Structure

```
rg-ai4a-dev/
├── cog-ai4a-dev/              # Azure OpenAI
│   └── deployments/
│       └── gpt-4o/
├── cosmos-ai4a-dev/           # Cosmos DB
│   └── sqlDatabases/
│       └── ai4a/
│           └── containers/
│               ├── users/
│               ├── assessments/
│               └── interviews/
├── sql-ai4a-dev/              # Azure SQL
│   └── databases/
│       └── ai4a/
├── storageai4adev/            # Blob Storage
│   └── blobServices/
│       └── containers/
│           ├── uploads/
│           └── profiles/
├── redis-ai4a-dev/            # Redis Cache
├── asp-ai4a-dev/              # App Service Plan
├── web-ai4a-dev/              # Web App (Frontend)
├── api-ai4a-dev/              # API App Service
├── appi-ai4a-dev/             # Application Insights
└── kv-ai4a-dev/               # Key Vault
```

## Environment Configuration

### Development (`dev`)

- Uses Basic/S0 tier resources
- Single region deployment
- Free tier Cosmos DB disabled

### Staging (`staging`)

- Standard tier resources
- Multi-region consideration
- Standard Cosmos DB

### Production (`prod`)

- Premium tier resources
- Multi-region with failover
- Zone-redundant storage

## Post-Deployment Steps

1. **Configure Azure AD B2C** (Authentication)
   ```bash
   az ad b2c tenant create --name ai4a-dev
   ```

2. **Set up Key Vault secrets**
   ```bash
   az keyvault secret set --vault-name kv-ai4a-dev --name "AZURE-AD-CLIENT-SECRET" --value "your-secret"
   ```

3. **Configure CORS** for the API
   ```bash
   az webapp cors add --resource-group rg-ai4a-dev --name api-ai4a-dev --allowed-origins "https://web-ai4a-dev.azurewebsites.net"
   ```

4. **Deploy application code**
   ```bash
   # Deploy web app
   az webapp deployment source config-zip --resource-group rg-ai4a-dev --name web-ai4a-dev --src ./apps/web/dist.zip

   # Deploy API
   az webapp deployment source config-zip --resource-group rg-ai4a-dev --name api-ai4a-dev --src ./services/api-gateway/dist.zip
   ```

## Cost Estimation

| Resource | Tier | Monthly Cost (Est.) |
|----------|------|-------------------|
| OpenAI | S0 | $50-500 (usage-based) |
| Cosmos DB | S0 | ~$25 |
| Azure SQL | S0 | ~$15 |
| Blob Storage | Standard | ~$5 |
| Redis | C0 | ~$20 |
| App Service | S1 x 2 | ~$50 |
| Application Insights | Basic | ~$10 |
| Key Vault | Standard | ~$3 |
| **Total** | | **~$180/month** |

*Note: Costs vary based on usage, especially OpenAI.*

## Troubleshooting

### Common Issues

1. **Deployment fails with "Resource not found"**
   - Ensure resource group exists
   - Check subscription permissions

2. **OpenAI deployment fails**
   - Verify OpenAI quota in region
   - Check model availability

3. **Connection string errors**
   - Wait for resource provisioning to complete
   - Re-run deployment if partial failure

## Security Considerations

1. All traffic uses HTTPS
2. TLS 1.2 minimum enforced
3. Key Vault for secrets management
4. RBAC enabled on Key Vault
5. Azure AD authentication required
6. Private endpoints recommended for production

## Monitoring

- Application Insights for application monitoring
- Azure Monitor for infrastructure
- Azure Advisor for recommendations

## Cleanup

To delete all resources:

```powershell
Remove-AzResourceGroup -Name "rg-ai4a-dev" -Force
```
