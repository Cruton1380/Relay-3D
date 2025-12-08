# 🤖 LLM Configuration Guide: Customizing AI Models in Relay

## Executive Summary

Relay's AI Agent system provides a flexible framework for integrating large language models (LLMs) into the platform's functionality. This guide details how to configure and manage LLM integrations with a focus on user privacy, performance optimization, and choice flexibility. Unlike traditional AI implementations that force users into specific models, Relay's architecture supports multiple LLM providers (both cloud-based and local), encrypted API key management, and comprehensive privacy controls—giving users full control over their AI experiences while maintaining enterprise-grade security standards.

**Key Innovation**: Relay's multi-provider LLM framework creates a "bring your own key" approach to AI that balances powerful capabilities with privacy protection. By supporting local models, encrypted cloud credentials, and automatic fallbacks, users can leverage cutting-edge AI while maintaining sovereignty over their data and API access.

---

## 📋 Table of Contents

1. [🔍 Understanding LLM Integration](#-understanding-llm-integration)
   - [Configuration Architecture](#configuration-architecture)
   - [Provider Ecosystem](#provider-ecosystem)
   - [Privacy and Security Design](#privacy-and-security-design)

2. [🔑 API Key Management](#-api-key-management)
   - [Adding API Keys](#adding-api-keys)
   - [Managing Key Security](#managing-key-security)
   - [Key Rotation and Updates](#key-rotation-and-updates)

3. [⚙️ Model Selection and Configuration](#-model-selection-and-configuration)
   - [LLM Source Selection](#llm-source-selection)
   - [Provider-Specific Settings](#provider-specific-settings)
   - [Multi-Agent Configuration](#multi-agent-configuration)

4. [🏠 Local Model Setup](#-local-model-setup)
   - [Ollama Integration](#ollama-integration)
   - [LM Studio Configuration](#lm-studio-configuration)
   - [vLLM Deployment](#vllm-deployment)

5. [📊 Cost and Performance Management](#-cost-and-performance-management)
   - [Usage Monitoring](#usage-monitoring)
   - [Cost Optimization](#cost-optimization)
   - [Performance Tuning](#performance-tuning)

6. [🛡️ Privacy and Security Features](#-privacy-and-security-features)
   - [API Key Encryption](#api-key-encryption)
   - [Prompt Scrubbing](#prompt-scrubbing)
   - [Privacy Controls](#privacy-controls)

7. [🔍 Troubleshooting and Support](#-troubleshooting-and-support)
   - [Common Issues](#common-issues)
   - [Debug Mode](#debug-mode)
   - [Health Checks](#health-checks)

8. [🔮 Future Developments](#-future-developments)
   - [Federated Inference](#federated-inference-planned)
   - [Community Models](#community-models-roadmap)

---

## 🔍 Understanding LLM Integration

Relay's LLM integration system provides a flexible framework for connecting to various AI providers while maintaining strong privacy and security controls.

### Configuration Architecture

The system follows a layered approach that separates user configurations from system settings:

```
┌─────────────────────────────────────────┐
│ User Interface                          │
│  ┌───────────────┐    ┌───────────────┐ │
│  │ CLI Commands  │    │ Environment   │ │
│  │ & Arguments   │    │ Variables     │ │
│  └───────┬───────┘    └───────┬───────┘ │
└─────────┬───────────────────┬───────────┘
          │                   │
┌─────────▼───────────────────▼───────────┐
│ Configuration Manager                    │
│  ┌───────────────┐    ┌───────────────┐ │
│  │ User-Specific │    │ System-Wide   │ │
│  │ Settings      │    │ Settings      │ │
│  └───────┬───────┘    └───────┬───────┘ │
└─────────┬───────────────────┬───────────┘
          │                   │
┌─────────▼───────────────────▼───────────┐
│ Security Layer                           │
│  ┌───────────────┐    ┌───────────────┐ │
│  │ API Key       │    │ Prompt        │ │
│  │ Encryption    │    │ Scrubbing     │ │
│  └───────┬───────┘    └───────┬───────┘ │
└─────────┬───────────────────┬───────────┘
          │                   │
┌─────────▼───────────────────▼───────────┐
│ Provider Management                      │
│  ┌───────────────┐    ┌───────────────┐ │
│  │ Cloud         │    │ Local         │ │
│  │ Providers     │    │ Models        │ │
│  └───────────────┘    └───────────────┘ │
└───────────────────────────────────────┘
```

The separation of concerns allows for:
- **User sovereignty**: Each user can configure their own AI preferences
- **Privacy protection**: User API keys are never exposed in plaintext
- **Flexibility**: Support for multiple providers and deployment options
- **Fallback capability**: Graceful degradation when providers are unavailable

### Provider Ecosystem

Relay supports a diverse ecosystem of LLM providers:

**Cloud Providers**:
- OpenAI (GPT-4o, GPT-4, GPT-3.5)
- Anthropic (Claude 3.5 Sonnet, Claude 3)
- Google (Gemini 1.5 Pro, Gemini Pro)
- Mistral (Mistral Large, Mistral 7B)
- Cohere (Command R+, Command)
- Together AI (Various open models)

**Local Providers**:
- Ollama (Llama 3, Mistral 7B, CodeGemma)
- LM Studio (Various GGUF models)
- vLLM (High-performance inference)
- llama.cpp (Raw model inference)

This diversity ensures that users can select models based on their specific needs, whether prioritizing performance, privacy, cost, or specialized capabilities.

### Privacy and Security Design

The LLM configuration system implements several layers of security:

1. **Encryption at rest**: All API keys are AES-256-GCM encrypted
2. **Access control**: Keys are only decrypted when needed for API calls
3. **Isolation**: User configurations are segregated from each other
4. **Prompt scrubbing**: Personal information is removed before cloud transmission
5. **Audit logging**: Optional tracking of AI interactions for compliance

**Alice's Experience**: When Alice configures her own OpenAI API key, she can be confident that her key is securely encrypted, only accessible for her own AI interactions, and never exposed in logs or to other users of the system. She can also choose to use local models that never transmit her prompts to external services at all.

---

## 🔑 API Key Management

### Adding API Keys

Users can add their own API keys through various methods:

#### CLI Commands

```bash
# Add your OpenAI API key
node src/backend/ai-agent/aiAgentCLI.mjs add-api-key --provider=openai --key=sk-your-key-here

# Add your Anthropic API key
node src/backend/ai-agent/aiAgentCLI.mjs add-api-key --provider=anthropic --key=sk-ant-your-key-here

# Add your Google AI API key
node src/backend/ai-agent/aiAgentCLI.mjs add-api-key --provider=google --key=your-google-key-here
```

**Technical Implementation**:

```javascript
// From aiKeyManager.mjs
async function addApiKey(userId, provider, key) {
  // Generate random encryption IV
  const iv = crypto.randomBytes(12);
  
  // Derive encryption key from master key
  const encryptionKey = await deriveEncryptionKey(
    process.env.RELAY_ENCRYPTION_KEY, 
    userId
  );
  
  // Encrypt the API key
  const cipher = crypto.createCipheriv(
    'aes-256-gcm', 
    encryptionKey, 
    iv
  );
  
  let encryptedKey = cipher.update(key, 'utf8', 'hex');
  encryptedKey += cipher.final('hex');
  
  // Get auth tag for verification
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Store encrypted key with metadata
  await userKeyStore.set(userId, provider, {
    encryptedKey,
    iv: iv.toString('hex'),
    authTag,
    provider,
    createdAt: Date.now()
  });
  
  return { success: true, provider };
}
```

#### Environment Variables

Users can also set API keys via environment variables:

```bash
# Set user-specific API keys in your environment
export USER_OPENAI_API_KEY="sk-your-key-here"
export USER_ANTHROPIC_API_KEY="sk-ant-your-key-here"
export USER_GOOGLE_API_KEY="your-google-key-here"
```

### Managing Key Security

API keys are secured through multiple mechanisms:

1. **AES-256-GCM encryption**: Industry-standard encryption algorithm
2. **Per-user encryption keys**: Derived from master key and user ID
3. **Secure storage**: Keys stored in encrypted format only
4. **Memory protection**: Keys only decrypted in memory when needed
5. **Automatic clearing**: Keys removed from memory after use

**Implementation Example**:

```javascript
// Retrieving and using an API key securely
async function getDecryptedApiKey(userId, provider) {
  try {
    // Get encrypted key data
    const keyData = await userKeyStore.get(userId, provider);
    if (!keyData) return null;
    
    // Derive encryption key
    const encryptionKey = await deriveEncryptionKey(
      process.env.RELAY_ENCRYPTION_KEY, 
      userId
    );
    
    // Decrypt the key
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      encryptionKey,
      Buffer.from(keyData.iv, 'hex')
    );
    
    // Set auth tag for verification
    decipher.setAuthTag(Buffer.from(keyData.authTag, 'hex'));
    
    // Decrypt
    let decryptedKey = decipher.update(keyData.encryptedKey, 'hex', 'utf8');
    decryptedKey += decipher.final('utf8');
    
    return decryptedKey;
  } catch (error) {
    logger.error('Failed to decrypt API key:', error.message);
    return null;
  }
}
```

### Key Rotation and Updates

Regular key rotation is recommended for security:

```bash
# Update an existing API key
node src/backend/ai-agent/aiAgentCLI.mjs update-api-key --provider=openai --key=sk-new-key-here

# Remove a specific provider key
node src/backend/ai-agent/aiAgentCLI.mjs remove-api-key --provider=openai

# List your current API keys (shows only providers, not the keys themselves)
node src/backend/ai-agent/aiAgentCLI.mjs list-api-keys
```

**Bob's Experience**: Bob regularly rotates his API keys for additional security. When he generates a new OpenAI API key, he uses the CLI command to update his key in Relay. The system securely encrypts his new key and immediately begins using it for AI interactions, without any disruption to his workflow. The old key is securely erased from the system.

---

## ⚙️ Model Selection and Configuration

### LLM Source Selection

Users can specify which LLM provider to use through several methods:

#### CLI Flags

```bash
# Use OpenAI for both agents
node src/backend/ai-agent/aiAgentCLI.mjs chat --llm-source=openai

# Use Anthropic for both agents
node src/backend/ai-agent/aiAgentCLI.mjs chat --llm-source=anthropic

# Use local Ollama with Llama 3
node src/backend/ai-agent/aiAgentCLI.mjs chat --llm-source=ollama:llama3

# Use different models for each agent
node src/backend/ai-agent/aiAgentCLI.mjs chat --navigator-model=gpt-4o --architect-model=claude-3-5-sonnet
```

#### Environment Configuration

```bash
# Prefer local models
export RELAY_USE_LOCAL_LLM=true
export RELAY_LOCAL_LLM_MODEL=llama3:8b

# Prefer cloud models with specific provider
export RELAY_USE_LOCAL_LLM=false
export RELAY_CLOUD_PROVIDER=anthropic
```

### Provider-Specific Settings

Each provider can be configured with specific parameters:

```javascript
// Example configuration object
const providerConfig = {
  openai: {
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0
  },
  anthropic: {
    model: 'claude-3-5-sonnet-20240620',
    temperature: 0.5,
    maxTokens: 2000,
    topP: 0.9
  },
  mistral: {
    model: 'mistral-large-latest',
    temperature: 0.6,
    maxTokens: 2000
  }
};
```

### Multi-Agent Configuration

Relay's AI system uses a dual-agent architecture that can be configured independently:

```bash
# Configure different models for Navigator and Architect agents
node src/backend/ai-agent/aiAgentCLI.mjs chat \
  --navigator-model=gpt-4o \
  --architect-model=claude-3-5-sonnet \
  --navigator-temperature=0.8 \
  --architect-temperature=0.2
```

This allows for specialized configuration:
- **Navigator Agent**: Typically benefits from more creative models with higher temperature
- **Architect Agent**: Often works best with more precise models and lower temperature

**Carol's Experience**: Carol is developing a complex governance proposal and wants to maximize AI assistance. She configures the Navigator agent to use GPT-4o with higher temperature for creative brainstorming, while setting the Architect agent to use Claude 3.5 Sonnet with low temperature for precise code and policy language generation. This dual-agent setup gives her the best of both models' capabilities, helping her craft a comprehensive proposal with clear implementation details.

---

## 🏠 Local Model Setup

Running models locally provides privacy, cost savings, and offline capabilities.

### Ollama Integration

[Ollama](https://ollama.com) is a lightweight system for running LLMs locally:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull recommended models
ollama pull llama3:8b
ollama pull mistral:7b
ollama pull codegemma:7b

# Start Ollama service
ollama serve
```

**Technical Implementation**:

```javascript
// Integration with Ollama API
async function queryOllamaModel(prompt, model = 'llama3:8b') {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    });
    
    const result = await response.json();
    return result.response;
  } catch (error) {
    logger.error('Ollama API error:', error);
    return null;
  }
}
```

### LM Studio Configuration

[LM Studio](https://lmstudio.ai) provides a user-friendly UI for managing models:

1. Download LM Studio from [lmstudio.ai](https://lmstudio.ai)
2. Install and launch the application
3. Download models from the built-in browser
4. Start the local inference server (typically on port 1234)
5. Configure Relay to connect to this endpoint

```javascript
// Configuration for connecting to LM Studio
const lmStudioConfig = {
  endpoint: 'http://localhost:1234/v1',
  apiKey: 'lmstudio', // Default API key
  models: {
    // Map internal model names to LM Studio model names
    'llama3': 'Meta-Llama-3-8B-Instruct-GGUF',
    'mistral': 'Mistral-7B-Instruct-v0.2-GGUF'
  }
};
```

### vLLM Deployment

[vLLM](https://github.com/vllm-project/vllm) provides high-performance inference:

```bash
# Install vLLM
pip install vllm

# Start vLLM server with a model
python -m vllm.entrypoints.openai.api_server \
  --model microsoft/DialoGPT-medium \
  --port 8000
```

**David's Experience**: David is concerned about privacy and wants to keep all AI interactions on his local machine. He installs Ollama on his desktop computer, downloads the Llama 3 8B model, and configures Relay to use this local setup. Now, all his AI interactions happen entirely on his machine, with no data transmitted to external services. He appreciates the complete privacy, even though the model isn't quite as powerful as cloud alternatives.

---

## 📊 Cost and Performance Management

### Usage Monitoring

Track and analyze your LLM usage:

```bash
# View usage statistics
node src/backend/ai-agent/aiAgentCLI.mjs usage-stats

# View costs (if API provides billing info)
node src/backend/ai-agent/aiAgentCLI.mjs cost-report
```

**Sample Usage Report**:

```
AI Agent Usage Report (Last 30 days)
------------------------------------
Total prompts: 246
Total completions: 246
Total tokens: 892,153
  - Prompt tokens: 354,872
  - Completion tokens: 537,281

Provider Breakdown:
- OpenAI: 62% (153 requests)
- Anthropic: 26% (64 requests)
- Local models: 12% (29 requests)

Estimated Cost: $3.42
```

### Cost Optimization

Several strategies can reduce API costs:

1. **Use local models**: No API costs, complete privacy
2. **Smaller models**: Use GPT-3.5 instead of GPT-4 for simple tasks
3. **Prompt optimization**: Shorter prompts = lower costs
4. **Caching**: Enable response caching to avoid repeat API calls
5. **Fallback strategy**: Set cheaper models as fallbacks

**Implementation Example**:

```javascript
// Response caching to reduce API calls
async function getCachedOrFreshResponse(prompt, params) {
  // Generate cache key from prompt and params
  const cacheKey = createCacheKey(prompt, params);
  
  // Check cache first
  const cachedResponse = await responseCache.get(cacheKey);
  if (cachedResponse) {
    logger.debug('Cache hit for response');
    return cachedResponse;
  }
  
  // If not in cache, call the API
  const response = await callLLM(prompt, params);
  
  // Store in cache for future use
  await responseCache.set(cacheKey, response, CACHE_TTL);
  
  return response;
}
```

### Performance Tuning

Optimize performance based on your specific needs:

```bash
# Enable response caching
export RELAY_ENABLE_RESPONSE_CACHE=true
export RELAY_CACHE_TTL=3600 # 1 hour

# Configure concurrent request limits
export RELAY_MAX_CONCURRENT_REQUESTS=5

# Set timeout values
export RELAY_REQUEST_TIMEOUT=30000 # 30 seconds
```

**Emma's Experience**: Emma runs an active community channel and needs to optimize AI costs. She configures response caching for common queries, switches to local models for routine tasks, and reserves cloud models for only the most complex governance tasks. She monitors usage with the cost-report command and has reduced her monthly API costs by 70% while maintaining the essential AI capabilities her community needs.

---

## 🛡️ Privacy and Security Features

### API Key Encryption

All user API keys are secured with strong encryption:

- AES-256-GCM encryption algorithm
- Unique encryption key per user
- Secure key storage
- Memory protection measures
- Key rotation support

**Technical Implementation**:

```javascript
// Key derivation function
async function deriveEncryptionKey(masterKey, userId) {
  // Use PBKDF2 to derive a unique key for each user
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      masterKey,
      userId, // User ID as salt
      100000, // 100,000 iterations for security
      32, // 256-bit key
      'sha256',
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      }
    );
  });
}
```

### Prompt Scrubbing

When using cloud providers, prompts are automatically scrubbed to remove sensitive information:

```javascript
// Simplified prompt scrubbing implementation
function scrubPrompt(prompt) {
  return prompt
    // Remove user IDs
    .replace(/user-[a-z0-9]{24}/gi, '[USER_ID]')
    // Remove channel IDs
    .replace(/channel-[a-z0-9]{24}/gi, '[CHANNEL_ID]')
    // Remove location data
    .replace(/lat:\s*-?\d+\.\d+,\s*lng:\s*-?\d+\.\d+/gi, '[LOCATION]')
    // Remove email addresses
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[EMAIL]')
    // Remove phone numbers
    .replace(/\+?[0-9]{10,15}/gi, '[PHONE]');
}
```

### Privacy Controls

Configure privacy protections according to your preferences:

```bash
# Enable/disable prompt scrubbing
export RELAY_STRIP_USER_DATA=true

# Disable logging of prompts
export RELAY_LOG_PROMPTS=false

# Enable audit trail
export RELAY_ENABLE_AUDIT_TRAIL=true
```

**Frank's Experience**: Frank works with sensitive community data and is concerned about privacy. He configures Relay to use local models for maximum privacy, enables prompt scrubbing for cases where cloud models are needed, and disables prompt logging entirely. He regularly reviews the audit trail to ensure no sensitive information is being transmitted, giving him confidence that he can leverage AI capabilities without compromising his community's privacy.

---

## 🔍 Troubleshooting and Support

### Common Issues

**"No API key configured"**
- Ensure you've added the API key for the provider
- Check environment variables are set correctly
- Verify the API key format is correct

**"Local model unavailable"**
- Check if Ollama/LM Studio is running
- Verify the model is downloaded and available
- Test the endpoint directly: `curl http://localhost:11434/api/tags`

**"Model not available for agent"**
- Check the model registry configuration
- Ensure the model is listed in available models for the agent
- Try switching to a different model

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Enable detailed logging
export RELAY_ENABLE_AGENT_DEBUG=true
export LOG_LEVEL=debug

# Run with debug output
node src/backend/ai-agent/aiAgentCLI.mjs chat --debug
```

This will produce detailed logs showing:
- API requests and responses
- Model selection decisions
- Configuration values being used
- Error details and stack traces

### Health Checks

Verify your LLM configuration with built-in diagnostics:

```bash
# Comprehensive health check
node src/backend/ai-agent/aiAgentCLI.mjs health-check --verbose

# Check specific components
node src/backend/ai-agent/aiAgentCLI.mjs health-check --local-only
node src/backend/ai-agent/aiAgentCLI.mjs health-check --cloud-only
```

**Sample Health Check Output**:

```
AI Agent Health Check
---------------------
✅ Configuration: Valid
✅ OpenAI API: Connected (latency: 215ms)
❌ Anthropic API: Key invalid or expired
✅ Local Ollama: Connected (latency: 45ms)
❌ LM Studio: Not running
⚠️ vLLM: Connected but model load failed

Available Models:
- gpt-4o (OpenAI)
- gpt-3.5-turbo (OpenAI)
- llama3:8b (Ollama)
- mistral:7b (Ollama)

Recommendations:
- Update Anthropic API key
- Start LM Studio service
- Check vLLM model configuration
```

**Grace's Experience**: Grace encounters an error when trying to use Anthropic models. She runs the health check command, which identifies that her Anthropic API key has expired. She generates a new key on the Anthropic website and updates it in Relay using the update-api-key command. After running the health check again to confirm the new key works, she's back to using her preferred models without further issues.

---

## 🔮 Future Developments

### Federated Inference (Planned)

Relay is tracking developments in decentralized AI inference:

- **Peer-to-peer model sharing**: Community nodes providing inference
- **Bittensor integration**: Decentralized AI network participation  
- **Golem network**: Distributed computing for AI workloads
- **Custom model deployment**: Deploy your own fine-tuned models

These features will enable truly decentralized AI without dependency on corporate APIs.

### Community Models (Roadmap)

Future releases will enhance the AI ecosystem through:

- **Model sharing marketplace**: Community-contributed models
- **Specialized fine-tuning**: Models optimized for governance and community management
- **Reputation-based discovery**: Find the best models for specific tasks
- **Collaborative training**: Community-driven model improvements

**Hannah's Vision**: Hannah envisions a future where her community doesn't depend on commercial AI providers at all. She's excited about Relay's roadmap for federated inference, where community members can contribute computing resources to run models collectively. This aligns with her values of decentralization and digital sovereignty, and she plans to be among the first to implement these features when they become available.

---

## 🎯 Conclusion

Relay's LLM configuration system embodies the platform's core principles of user sovereignty, privacy, and adaptability. By providing flexible options for AI integration—from commercial cloud APIs to local open-source models—users can make their own choices about the tradeoffs between capability, cost, and privacy.

The multi-layered security approach ensures that even when cloud providers are used, sensitive information is protected through encryption, key management, and prompt scrubbing. Meanwhile, the support for local models provides a completely private option for those with the most stringent privacy requirements.

As AI technology continues to evolve rapidly, Relay's configuration framework is designed to adapt, incorporating new models and providers while maintaining backward compatibility with existing setups. The roadmap toward federated inference represents the next frontier—bringing the democratic principles of Relay to the AI layer itself.

Whether you're prioritizing cutting-edge capabilities, strict privacy, cost efficiency, or a balance of all three, the LLM configuration system gives you the tools to create the AI experience that best serves your community's needs.

---

**Last Updated**: June 21, 2025  
**Documentation Version**: 2.3.1  
**Compatible With**: Relay Agent System v1.4+
