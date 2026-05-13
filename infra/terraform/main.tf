# Terraform Backend Configuration
# Uncomment and configure for remote state management

# terraform {
#   backend "azurerm" {
#     resource_group_name  = "rg-ai4a-terraform"
#     storage_account_name = "tfstateai4a"
#     container_name       = "tfstate"
#     key                  = "ai4a/terraform.tfstate"
#   }
# }

# Provider Configuration
provider "azurerm" {
  features {}
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "unique_prefix" {
  description = "Unique prefix for resources"
  type        = string
  default     = "ai4a"
}

# Local values
locals {
  resource_prefix = "${var.unique_prefix}-${var.environment}"
  tags = {
    Project      = "AI4A"
    Environment = var.environment
    ManagedBy    = "Terraform"
  }
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "rg-${local.resource_prefix}"
  location = var.location
  tags     = local.tags
}

# Azure OpenAI Service
resource "azurerm_cognitive_account" "openai" {
  name                = "cog-${local.resource_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  kind               = "OpenAI"
  sku_name           = "S0"

  tags = local.tags

  public_network_access_enabled = true

  identity {
    type = "SystemAssigned"
  }
}

# OpenAI Deployment
resource "azurerm_cognitive_deployment" "gpt4o" {
  name                 = "gpt-4o"
  cognitive_account_id = azurerm_cognitive_account.openai.id
  location            = azurerm_resource_group.main.location
  rai_policy_name     = "Microsoft.Default.RAIPolicy"

  sku {
    name = "Standard"
    capacity = 10
  }

  model {
    format  = "OpenAI"
    name    = "gpt-4o"
    version = "2024-08-06"
  }
}

# Cosmos DB Account
resource "azurerm_cosmosdb_account" "main" {
  name                = "cosmos-${local.resource_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  consistency_policy {
    default_consistency_level = "Session"
  }

  geo_location {
    location          = var.location
    failover_priority = 0
  }

  tags = local.tags
}

# Cosmos DB Database
resource "azurerm_cosmosdb_sql_database" "ai4a" {
  name                = "ai4a"
  resource_group_name = azurerm_resource_group.main.name
  account_name       = azurerm_cosmosdb_account.main.name
}

# Cosmos DB Containers
resource "azurerm_cosmosdb_sql_container" "users" {
  name                = "users"
  resource_group_name = azurerm_resource_group.main.name
  account_name       = azurerm_cosmosdb_account.main.name
  database_name      = azurerm_cosmosdb_sql_database.ai4a.name
  partition_key_path = "/userId"
}

resource "azurerm_cosmosdb_sql_container" "assessments" {
  name                = "assessments"
  resource_group_name = azurerm_resource_group.main.name
  account_name       = azurerm_cosmosdb_account.main.name
  database_name      = azurerm_cosmosdb_sql_database.ai4a.name
  partition_key_path = "/userId"
}

resource "azurerm_cosmosdb_sql_container" "interviews" {
  name                = "interviews"
  resource_group_name = azurerm_resource_group.main.name
  account_name       = azurerm_cosmosdb_account.main.name
  database_name      = azurerm_cosmosdb_sql_database.ai4a.name
  partition_key_path = "/userId"
}

# Azure SQL Server
resource "azurerm_mssql_server" "main" {
  name                         = "sql-${local.resource_prefix}"
  location                     = azurerm_resource_group.main.location
  resource_group_name          = azurerm_resource_group.main.name
  administrator_login          = "sqladmin"
  administrator_login_password = "P@ssw0rd123456!"
  version                      = "12.0"

  tags = local.tags
}

# Azure SQL Database
resource "azurerm_mssql_database" "ai4a" {
  name           = "ai4a"
  server_id      = azurerm_mssql_server.main.id
  collation      = "SQL_Latin1_General_CP1_CI_AS"
  license_type   = "LicenseIncluded"
  max_size_gb   = 250
  sku_name      = "S0"

  tags = local.tags
}

# SQL Firewall Rule
resource "azurerm_mssql_firewall_rule" "azure_services" {
  server_id = azurerm_mssql_server.main.id
  name     = "AllowAllAzureIPs"
  start_ip = "0.0.0.0"
  end_ip   = "0.0.0.0"
}

# Storage Account
resource "azurerm_storage_account" "main" {
  name                     = "storage${replace(local.resource_prefix, "-", "")}"
  location                 = azurerm_resource_group.main.location
  resource_group_name       = azurerm_resource_group.main.name
  account_tier             = "Standard"
  account_replication_type = "LRS"
  access_tier              = "Hot"

  blob_properties {
    versioning_enabled       = true
    change_feed_enabled     = true
    min_tls_version         = "TLS1_2"
    public_network_access_enabled = false
  }

  tags = local.tags
}

# Storage Containers
resource "azurerm_storage_container" "uploads" {
  name                  = "uploads"
  storage_account_id    = azurerm_storage_account.main.id
  container_access_type = "private"
}

resource "azurerm_storage_container" "profiles" {
  name                  = "profiles"
  storage_account_id    = azurerm_storage_account.main.id
  container_access_type = "private"
}

# Redis Cache
resource "azurerm_redis_cache" "main" {
  name                = "redis-${local.resource_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = 1
  family              = "C"
  sku_name            = "Standard"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  tags = local.tags
}

# App Service Plan
resource "azurerm_service_plan" "main" {
  name                = "asp-${local.resource_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = "S1"
  worker_count        = 1

  tags = local.tags
}

# Web App
resource "azurerm_linux_web_app" "web" {
  name                = "web-${local.resource_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.main.id
  https_only         = true

  site_config {
    always_on        = true
    health_check_path = "/health"
    
    application_stack {
      node_version = "18"
    }
  }

  app_settings = {
    WEBSITE_RUN_FROM_PACKAGE = "1"
    VITE_API_URL            = "https://api-${local.resource_prefix}.azurewebsites.net"
    VITE_APP_NAME          = "AI Career Copilot"
  }

  tags = local.tags
}

# API App Service
resource "azurerm_linux_web_app" "api" {
  name                = "api-${local.resource_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.main.id
  https_only         = true

  site_config {
    always_on        = true
    health_check_path = "/health"
    
    application_stack {
      node_version = "18"
    }
  }

  app_settings = {
    Azure__OpenAI__Endpoint  = azurerm_cognitive_account.openai.endpoint
    Azure__OpenAI__Deployment = azurerm_cognitive_deployment.gpt4o.name
    CosmosDB__ConnectionString = azurerm_cosmosdb_account.main.connection_strings[0]
    CosmosDB__Database        = "ai4a"
    Redis__ConnectionString    = "${azurerm_redis_cache.main.hostname}:6380"
    Redis__AccessKey         = azurerm_redis_cache.main.primary_access_key
    NODE_ENV                 = "production"
    PORT                    = "4000"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = local.tags
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "appi-${local.resource_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "web"

  tags = local.tags
}

# Key Vault
resource "azurerm_key_vault" "main" {
  name                       = "kv-${local.resource_prefix}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  enable_rbac_authorization  = true
  enable_purge_protection    = false
  soft_delete_retention_days = 7

  tags = local.tags
}

# Outputs
output "web_app_url" {
  value = azurerm_linux_web_app.web.default_host_name
}

output "api_url" {
  value = azurerm_linux_web_app.api.default_host_name
}

output "openai_endpoint" {
  value = azurerm_cognitive_account.openai.endpoint
}

output "cosmosdb_endpoint" {
  value = azurerm_cosmosdb_account.main.document_endpoint
}

output "key_vault_name" {
  value = azurerm_key_vault.main.name
}
