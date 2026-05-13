# AI Career Copilot Infrastructure
# Terraform Configuration

## Overview

This directory contains Terraform configuration files to deploy the complete Azure infrastructure for the AI Career Copilot platform.

## Files

- `main.tf` - Main Terraform configuration
- `terraform.tfvars.example` - Variable template
- `variables.tf` - Variable definitions

## Prerequisites

1. Terraform 1.5+ installed
2. Azure CLI installed and configured
3. Azure subscription with contributor access

## Quick Start

```bash
# Login to Azure
az login

# Initialize Terraform
cd infra/terraform
terraform init

# Create terraform.tfvars
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Plan deployment
terraform plan -out=tfplan

# Apply deployment
terraform apply tfplan
```

## Resources Deployed

| Resource | Description |
|----------|-------------|
| Resource Group | Container for all resources |
| Azure OpenAI | GPT-4o for AI features |
| Cosmos DB | NoSQL database |
| Azure SQL | Relational database |
| Storage Account | Blob storage |
| Redis Cache | Session cache |
| App Service Plan | Hosting plan |
| Web App | Frontend |
| API App | Backend API |
| Application Insights | Monitoring |
| Key Vault | Secrets |

## Cost

Estimated cost: ~$180/month (excluding OpenAI usage)

## Cleanup

```bash
terraform destroy
```
