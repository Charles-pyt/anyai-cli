# anyai-cli 🤖

**Universal AI Command-Line Interface** — Interact with multiple AI providers using a single, elegant CLI tool.

![License](https://img.shields.io/badge/license-MIT-green)
![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-blue)

## Overview

`anyai-cli` is an open-source CLI tool that provides a unified interface to interact with multiple AI providers (OpenAI, Anthropic, Mistral, Google Gemini, Alibaba Qwen) using your own API keys. No vendor lock-in, no account creation needed — just your API credentials.

### Features

✨ **Multi-Provider Support** — Switch between OpenAI, Anthropic, Mistral, Gemini, and Qwen
🔐 **Secure API Key Storage** — Uses keytar for secure credential management
⚡ **One-Shot Queries** — `anyai ask "Your question"`
💬 **Interactive Chat** — Real-time conversational AI
🎨 **Modern CLI UX** — Styled banners, spinners, and colored output
🔧 **Easy Configuration** — Interactive setup wizard
🚀 **Fast & Lightweight** — Minimal dependencies, instant responses

---

## Installation

### Global Installation (Recommended)

```bash
npm install -g anyai-cli
```

Then use `anyai` from anywhere:

```bash
anyai ask "What is Node.js?"
```

### Local Installation

```bash
npm install anyai-cli
npx anyai ask "Your question"
```

---

## Quick Start

### 1. Initialize Configuration

```bash
anyai init
```

This creates a configuration directory at `~/.anyai/`.

### 2. Configure Your First Provider

```bash
anyai configure
```

The interactive wizard will:
- Ask you to select an AI provider
- Securely store your API key
- Save your configuration

### 3. Try It Out!

**One-shot query:**
```bash
anyai ask "Explain quantum computing in simple terms"
```

**Interactive chat:**
```bash
anyai chat
```

---

## Commands

### `anyai` (or `anyai --help`)

Displays the banner and help information.

```
$ anyai

┌─────────────────────────────────────────────────────────────┐
│                                                               │
│   ___   ___     _     _   _____    _                          │
│  / _ \ / _ \   / \   / | |_   _|  / \                         │
│ | |_| || | | | / _ \  | |   | |  / _ \                        │
│ |  _  || |_| |/ ___ \ | |   | | / ___ \                       │
│ |_| |_| \___//_/   \_\|_|   |_|/_/   \_\                      │
│                                                               │
│  Universal AI CLI — Interact with any AI provider            │
│  v0.1.0                                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘

Get started:

  1. Initialize your config:
     anyai init

  2. Configure your API key:
     anyai configure

  3. Try an AI provider:
     anyai ask "What is Node.js?"
```

### `anyai init`

Initialize the configuration directory and files.

```bash
$ anyai init

📦 Initializing anyai-cli
─────────────────────────────────────────────────────────────
✓ Configuration directory created at: /home/user/.anyai
ℹ Next: Run "anyai configure" to set up your API key
```

### `anyai configure`

Interactive setup wizard to configure an AI provider.

```bash
$ anyai configure

🔧 Configuring anyai-cli
─────────────────────────────────────────────────────────────
? Select an AI provider:
  ❯ openai
    anthropic
    mistral
    gemini
    qwen

? Enter your API key: ••••••••••••••••••••••••••

✓ API key stored securely for openai
✓ Configuration saved
```

### `anyai config`

Display your current configuration.

```bash
$ anyai config

      ┌─────────────────────────────────────────────────────────────┐
      │  Current Configuration:                                     │
      │                                                             │
      │  Provider: openai                                           │
      │  Model: gpt-4o                                              │
      │  Provider Models: {"openai":"gpt-4o","gemini":"gemini-1.5-pro","mistral":"mistral-large-latest"}
      │  Config File: /home/user/.anyai/config.json                 │
      └─────────────────────────────────────────────────────────────┘
```

### `anyai model`

Select or change the active model for your configured provider.

```bash
$ anyai model

? Select model for openai:
  ❯ gpt-4o
    gpt-4-turbo
    gpt-4
    gpt-3.5-turbo

✓ Model changed to: gpt-4o
```

### `anyai ask <prompt>`

Send a one-shot query to the AI.

```bash
$ anyai ask "What is the capital of France?"

⠙ Querying openai...
✓ Response received
─────────────────────────────────────────────────────────────
The capital of France is Paris, the most populous city in the
country and the center of French culture, politics, and economy.
─────────────────────────────────────────────────────────────
```

### `anyai chat`

Start an interactive chat session.

```bash
$ anyai chat

💬 Interactive Chat Mode
─────────────────────────────────────────────────────────────
ℹ Provider: openai | Model: gpt-4o
ℹ Type "exit" or "quit" to end the conversation

? You: What is quantum entanglement?

⠹ Thinking...
✓

AI: Quantum entanglement is a phenomenon in quantum mechanics
where two or more particles become correlated in such a way that...

? You: Can you explain it more simply?

⠹ Thinking...
✓

AI: Sure! Imagine two magic coins...
```

---

## Configuration File

Configuration is stored in `~/.anyai/config.json`:

```json
{
  "provider": "openai",
  "model": "gpt-4o",
  "providerModels": {
    "openai": "gpt-4o",
    "gemini": "gemini-1.5-pro",
    "mistral": "mistral-large-latest"
  }
}
```

### Manual Configuration

You can edit this file directly:

```bash
cat ~/.anyai/config.json
```

---

## Supported Providers

### OpenAI

**Models:**
- `gpt-4o` (recommended)
- `gpt-4-turbo`
- `gpt-4`
- `gpt-3.5-turbo`

**Setup:**
1. Get your API key from [platform.openai.com](https://platform.openai.com)
2. Run `anyai configure` and select `openai`

### Anthropic (Claude)

**Models:**
- `claude-3-5-sonnet-20241022` (recommended)
- `claude-3-5-haiku-20241022`
- `claude-3-opus-20250219`

**Setup:**
1. Get your API key from [console.anthropic.com](https://console.anthropic.com)
2. Run `anyai configure` and select `anthropic`

### Mistral

**Models:**
- `mistral-large-latest` (recommended)
- `mistral-medium-latest`
- `mistral-small-latest`

**Setup:**
1. Get your API key from [console.mistral.ai](https://console.mistral.ai)
2. Run `anyai configure` and select `mistral`

### Google Gemini

**Models:**
- `gemini-2.0-flash` (recommended)
- `gemini-1.5-pro`
- `gemini-1.5-flash`

**Setup:**
1. Get your API key from [aistudio.google.com](https://aistudio.google.com)
2. Run `anyai configure` and select `gemini`

### Alibaba Qwen

**Models:**
- `qwen-max` (recommended)
- `qwen-plus`
- `qwen-turbo`

**Setup:**
1. Get your API key from [dashscope.aliyuncs.com](https://dashscope.aliyuncs.com)
2. Run `anyai configure` and select `qwen`

---

## API Key Management

### Priority Order

anyai-cli looks for API keys in this order:

1. **Environment Variable** (highest priority)
   ```bash
   export ANYAI_OPENAI_API_KEY="sk-..."
   export ANYAI_ANTHROPIC_API_KEY="sk-ant-..."
   export ANYAI_MISTRAL_API_KEY="..."
   export ANYAI_GEMINI_API_KEY="..."
   export ANYAI_QWEN_API_KEY="..."
   ```

2. **Secure Keystore** (fallback)
   - Uses `keytar` for secure credential storage
   - Credentials stored in system keychain

### Security Best Practices

✅ **DO:**
- Use environment variables for CI/CD
- Use keystore for local development
- Rotate API keys regularly
- Never commit API keys to version control

❌ **DON'T:**
- Store API keys in plain text files
- Share your API keys with others
- Commit `.env` files to git

---

## Environment Variables

### API Keys

```bash
# OpenAI
export ANYAI_OPENAI_API_KEY="sk-..."

# Anthropic
export ANYAI_ANTHROPIC_API_KEY="sk-ant-..."

# Mistral
export ANYAI_MISTRAL_API_KEY="..."

# Google Gemini
export ANYAI_GEMINI_API_KEY="..."

# Alibaba Qwen
export ANYAI_QWEN_API_KEY="..."
```

### Debug Mode

Enable debug logging:

```bash
export DEBUG=1
anyai ask "Your question"
```

---

## Usage Examples

### Example 1: Code Explanation

```bash
$ anyai ask "Explain this code: const x = [1,2,3].map(n => n * 2)"
```

### Example 2: Quick Translation

```bash
$ anyai ask "Translate this to Spanish: Hello, how are you?"
```

### Example 3: Multiple Queries in Chat

```bash
$ anyai chat
? You: What's the weather?
AI: I don't have access to real-time weather data...

? You: Can you recommend a travel destination?
AI: Based on your interests...

? You: exit
Goodbye!
```

### Example 4: Switch Providers

```bash
# Currently using OpenAI
$ anyai config

# Switch to Mistral
$ anyai configure
? Select an AI provider: mistral
? Enter your API key: ...

# Now using Mistral
$ anyai ask "Hello!"
```

---

## Project Structure

```
anyai-cli/
├── bin/
│   └── anyai.js              # CLI entry point
├── src/
│   ├── commands/
│   │   ├── ask.js            # One-shot query command
│   │   ├── chat.js           # Interactive chat command
│   │   ├── config.js         # Display config command
│   │   ├── configure.js      # Setup wizard command
│   │   ├── init.js           # Initialize command
│   │   └── model.js          # Model selection command
│   ├── providers/
│   │   ├── base.js           # Abstract provider class
│   │   ├── openai.js         # OpenAI implementation
│   │   ├── anthropic.js      # Anthropic implementation
│   │   ├── mistral.js        # Mistral implementation
│   │   ├── gemini.js         # Google Gemini implementation
│   │   ├── qwen.js           # Alibaba Qwen implementation
│   │   └── index.js          # Provider factory
│   ├── config/
│   │   ├── manager.js        # Config file management
│   │   ├── keystore.js       # Keytar wrapper
│   │   └── apikeys.js        # API key management
│   ├── ui/
│   │   ├── banner.js         # Banner rendering
│   │   ├── colors.js         # Color definitions
│   │   ├── logger.js         # Logging utilities
│   │   └── spinner.js        # Loading spinner
│   └── utils/
│       └── helpers.js        # Utility functions
├── package.json
└── README.md
```

---

## Development

### Clone the Repository

```bash
git clone https://github.com/yourusername/anyai-cli.git
cd anyai-cli
```

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

```bash
npm run dev -- ask "Test question"
npm run dev -- configure
npm run dev -- chat
```

### Adding a New Provider

1. Create a new file in `src/providers/` (e.g., `newprovider.js`)
2. Extend the `Provider` base class
3. Implement required methods: `generate()`, `validate()`, `getModels()`, `getDefaultModel()`
4. Register in `src/providers/index.js`

Example:

```javascript
// src/providers/newprovider.js
const Provider = require('./base');

class NewProviderClass extends Provider {
  constructor() {
    super('newprovider');
  }

  getDefaultModel() {
    return 'default-model';
  }

  getModels() {
    return ['model-1', 'model-2'];
  }

  async validate() {
    // Validate API key
  }

  async generate(prompt, options) {
    // Generate response
  }
}

module.exports = NewProviderClass;
```

Then in `src/providers/index.js`:

```javascript
const NewProviderClass = require('./newprovider');

const PROVIDERS = {
  // ... existing providers
  newprovider: NewProviderClass,
};
```

---

## Troubleshooting

### "No provider configured"

```bash
$ anyai ask "test"
✗ No provider configured. Run "anyai configure" first.
```

**Solution:** Run `anyai configure` to set up your first provider.

### "Invalid API key"

```bash
✗ Invalid OpenAI API key
```

**Solution:** Check your API key and run `anyai configure` again.

### "Network/API errors"

```bash
✗ OpenAI API error: Request failed
```

**Solution:**
- Check your internet connection
- Verify your API key is valid
- Check provider API status
- Try a different provider

### Environment Variables Not Working

```bash
# Make sure to export, not just set
export ANYAI_OPENAI_API_KEY="sk-..."

# Verify it's set
echo $ANYAI_OPENAI_API_KEY
```

---

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with [Commander.js](https://github.com/tj/commander.js) for CLI framework
- UI styling with [Chalk](https://github.com/chalk/chalk) and [Boxen](https://github.com/sindresorhus/boxen)
- Loading spinners with [Ora](https://github.com/sindresorhus/ora)
- Secure key storage with [Keytar](https://github.com/atom/node-keytar)
- Interactive prompts with [Inquirer.js](https://github.com/SBoudrias/Inquirer.js)

---

## Support

For issues, feature requests, or questions:

- 📧 Email: support@example.com
- 🐛 GitHub Issues: [Report a bug](https://github.com/yourusername/anyai-cli/issues)
- 💬 Discussions: [Start a discussion](https://github.com/yourusername/anyai-cli/discussions)

---

## Disclaimer

anyai-cli is a third-party tool and is not affiliated with OpenAI, Anthropic, Mistral, Google, or Alibaba. Each provider has its own terms of service and pricing. Please review their documentation and pricing before using.

---

**Made with ❤️ for the AI developer community**
