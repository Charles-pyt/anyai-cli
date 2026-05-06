# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-05-06

### Added
- Initial release of anyai-cli
- Support for multiple AI providers:
  - OpenAI (GPT-4, GPT-3.5-turbo)
  - Anthropic (Claude models)
  - Mistral (Mistral models)
  - Google Gemini
  - Alibaba Qwen
- Core commands:
  - `anyai init` - Initialize configuration
  - `anyai configure` - Interactive setup wizard
  - `anyai config` - Display current configuration
  - `anyai model` - Select/change active model
  - `anyai ask` - One-shot query
  - `anyai chat` - Interactive chat mode
- Secure API key management:
  - Environment variable support
  - Keytar-based secure storage
- Modern CLI UX:
  - Styled banner with figlet
  - Loading spinners with ora
  - Colored output with chalk
  - Interactive prompts with inquirer
  - Box formatting with boxen
- Configuration storage in `~/.anyai/config.json`
- Comprehensive documentation and examples
- Open-source MIT license

### Features
- Multi-provider architecture for easy extensibility
- Support for environment variables for CI/CD
- Interactive and one-shot query modes
- Model selection per provider
- User-friendly error messages
- Cross-platform support (Windows, macOS, Linux)

## Future Plans

### [0.2.0] - Planned
- [ ] Conversation history storage
- [ ] Custom system prompts
- [ ] Output formatting options (JSON, markdown, etc.)
- [ ] Streaming responses
- [ ] Configuration profiles
- [ ] Plugin system for custom providers
- [ ] Tests and CI/CD integration

### [0.3.0] - Planned
- [ ] Web interface
- [ ] API server mode
- [ ] Multi-turn conversation memory
- [ ] Cost tracking and rate limiting
- [ ] Provider availability checking
- [ ] Config import/export

---

## How to Report Issues

If you find a bug or have a feature request, please open an issue on GitHub with:
- Clear description of the issue
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Your environment (OS, Node.js version, etc.)
