# Security Best Practices

## Authentication Methods

The Azure Voice Live API supports two authentication methods:

### 1. API Key Authentication (Currently Supported)

**Status**: ✅ Fully implemented in the library

**Use Cases**:
- Rapid prototyping and development
- Testing and demo applications
- Local development environments

**How it works**:
```typescript
const config = createVoiceLiveConfig('default', {
  connection: {
    resourceName: process.env.VITE_AZURE_AI_FOUNDRY_RESOURCE,
    apiKey: process.env.VITE_AZURE_SPEECH_KEY, // Via query string
  },
  // ... session config
});
```

**Security Considerations**:
- ⚠️ API keys are static secrets with broad access
- ⚠️ Difficult to scope granularly or audit per-user
- ⚠️ Cannot express user identity
- ✅ Query string parameters are encrypted when using `wss://`
- ✅ Suitable for development and testing

### 2. Microsoft Entra ID (Token-Based Authentication)

**Status**: ⚠️ Requires backend proxy (browser WebSocket limitation)

**Use Cases** (Recommended for production):
- Production workloads
- Multi-user applications
- Applications requiring audit trails
- Conditional Access and MFA requirements
- Least privilege access control

**Why not directly supported in browser**:
The browser's native WebSocket API does not support custom headers like `Authorization: Bearer <token>`. This is a browser security limitation, not a library limitation.

**Recommended Architecture for Production**:

```
┌─────────┐      HTTPS/WSS     ┌─────────────┐    WSS + Token    ┌────────────┐
│ Browser │ ──────────────────▶│   Backend   │ ────────────────▶│   Azure    │
│  React  │      API Key       │    Proxy    │   Authorization  │ Voice Live │
│   App   │                    │             │      Header      │     API    │
└─────────┘                    └─────────────┘                  └────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │  Entra ID    │
                              │ Token Auth   │
                              └──────────────┘
```

**Backend Proxy Implementation** (Node.js example):

```typescript
// backend/voice-live-proxy.ts
import { DefaultAzureCredential } from '@azure/identity';
import { WebSocket } from 'ws';

async function getEntraToken() {
  const credential = new DefaultAzureCredential();
  const token = await credential.getToken('https://cognitiveservices.azure.com/.default');
  return token.token;
}

export async function proxyVoiceLiveConnection(clientWs: WebSocket) {
  const token = await getEntraToken();

  const voiceLiveWs = new WebSocket(
    'wss://your-resource.services.ai.azure.com/voice-live/realtime?api-version=2025-10-01&model=gpt-realtime',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  // Proxy messages between client and Voice Live API
  clientWs.on('message', (data) => voiceLiveWs.send(data));
  voiceLiveWs.on('message', (data) => clientWs.send(data));

  // Handle connection lifecycle
  clientWs.on('close', () => voiceLiveWs.close());
  voiceLiveWs.on('close', () => clientWs.close());
}
```

**Required Azure Setup**:

1. Enable Managed Identity or Service Principal
2. Assign `Cognitive Services User` role:
   ```bash
   az role assignment create \
     --role "Cognitive Services User" \
     --assignee <your-app-service-or-user-principal-id> \
     --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<resource-name>
   ```
3. Generate token with scope:
   - `https://ai.azure.com/.default` (new), or
   - `https://cognitiveservices.azure.com/.default` (legacy)

## Security Best Practices

### For Development

✅ **DO:**
- Store API keys in `.env` files (never commit to git)
- Add `.env` to `.gitignore`
- Use environment variables:
  ```typescript
  apiKey: import.meta.env.VITE_AZURE_SPEECH_KEY
  ```
- Rotate API keys regularly
- Use separate keys for development and production

❌ **DON'T:**
- Hardcode API keys in source code
- Commit API keys to version control
- Share API keys in public repositories
- Use production keys in development

### For Production

✅ **DO:**
- Implement backend proxy with Microsoft Entra ID authentication
- Use managed identities for Azure-hosted applications
- Enable Conditional Access policies
- Implement rate limiting and quotas
- Monitor and audit API usage
- Rotate credentials automatically
- Use least privilege RBAC roles
- Disable API key authentication after Entra ID adoption

❌ **DON'T:**
- Expose API keys to client-side code
- Skip authentication in production
- Use the same credentials across environments
- Grant overly broad permissions

## Environment Variables

### Development Setup

Create `.env` file in your playground directory:

```bash
# .env (DO NOT COMMIT THIS FILE)
VITE_AZURE_AI_FOUNDRY_RESOURCE=your-resource-name
VITE_AZURE_SPEECH_KEY=your-api-key
```

Add to `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
```

### Using in Code

```typescript
const config = createVoiceLiveConfig('default', {
  connection: {
    resourceName: import.meta.env.VITE_AZURE_AI_FOUNDRY_RESOURCE,
    apiKey: import.meta.env.VITE_AZURE_SPEECH_KEY,
  },
  session: {
    // ... your config
  }
});
```

## Azure Key Vault Integration

For enhanced security, store secrets in Azure Key Vault:

```typescript
// server-side only
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential();
const client = new SecretClient(
  'https://your-keyvault.vault.azure.net',
  credential
);

const secret = await client.getSecret('voice-live-api-key');
const apiKey = secret.value;
```

## Migration Path to Production

### Phase 1: Development (Current)
- Use API keys via environment variables ✅
- Never commit credentials ✅
- Separate dev/prod keys ✅

### Phase 2: Staging
- Implement backend proxy
- Test Microsoft Entra ID authentication
- Set up managed identities

### Phase 3: Production
- Deploy backend proxy with Entra ID
- Enable Conditional Access policies
- Disable API key authentication
- Monitor and audit access

## Compliance & Certifications

Azure AI services have certifications including:
- SOC 2 Type 2
- ISO 27001
- HIPAA BAA
- FedRAMP (select services)

For compliance requirements, see:
- [Azure Compliance](https://azure.microsoft.com/en-us/explore/trusted-cloud/compliance/)
- [Azure AI services security baseline](https://learn.microsoft.com/en-us/security/benchmark/azure/baselines/cognitive-services-security-baseline)

## Resources

- [Azure AI services authentication](https://learn.microsoft.com/en-us/azure/ai-services/authentication)
- [Voice Live API authentication](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-how-to#authentication)
- [Microsoft Entra ID authentication](https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/authentication-options-ai-foundry)
- [Azure Key Vault best practices](https://learn.microsoft.com/en-us/azure/key-vault/general/best-practices)
- [Zero Trust security principles](https://learn.microsoft.com/en-us/security/zero-trust/develop/identity-iam-development-best-practices)

## Support

For security concerns or questions:
- Create an issue: [GitHub Issues](https://github.com/iLoveAgents/azure-voice-live-react/issues)
- Review security policies: [SECURITY.md](./SECURITY.md)
- Azure Support: [Azure Portal](https://portal.azure.com)
