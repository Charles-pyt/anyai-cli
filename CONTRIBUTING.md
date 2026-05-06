# Contributing to anyai-cli

Thank you for your interest in contributing to anyai-cli! This document provides guidelines and instructions for contributing.

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check the issue list as you might find out that you don't need to create one. When you create a bug report, include:

- **Title**: A clear, descriptive title
- **Description**: What you expected to happen and what actually happened
- **Steps to Reproduce**: Exact steps which reproduce the problem
- **Environment**: Your OS, Node.js version, and any relevant package versions
- **Logs/Screenshots**: Any error messages or screenshots if applicable

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub Issues. When creating an enhancement suggestion, include:

- **Title**: A clear, descriptive title
- **Description**: A detailed description of the suggested enhancement
- **Use Case**: Explain why this enhancement would be useful
- **Examples**: Show example output or how the feature would work

### Adding a New Provider

To add support for a new AI provider:

1. Create a new file in `src/providers/` (e.g., `new-provider.js`)
2. Extend the `Provider` base class from `src/providers/base.js`
3. Implement all required methods:
   - `getDefaultModel()` - Return default model name
   - `getModels()` - Return array of available models
   - `validate()` - Validate API key
   - `generate(prompt, options)` - Generate AI response

Example:

```javascript
// src/providers/new-provider.js
const Provider = require('./base');
const axios = require('axios');

class NewProviderClass extends Provider {
  constructor() {
    super('newprovider');
    this.baseUrl = 'https://api.newprovider.com/v1';
    this.models = ['model-1', 'model-2'];
  }

  getDefaultModel() {
    return 'model-1';
  }

  getModels() {
    return this.models;
  }

  async validate() {
    if (!this.apiKey) throw new Error('API key not set');
    // Validate the API key
    return true;
  }

  async generate(prompt, options = {}) {
    const model = options.model || this.model || this.getDefaultModel();
    // Call the API and return the response
  }
}

module.exports = NewProviderClass;
```

4. Register the provider in `src/providers/index.js`:

```javascript
const NewProviderClass = require('./new-provider');

const PROVIDERS = {
  // ... existing providers
  newprovider: NewProviderClass,
};
```

5. Add the provider's API key environment variable to the README and documentation
6. Create tests if possible
7. Submit a pull request with a clear description of the changes

### Submitting Changes

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'Add your feature'`
5. Push to the branch: `git push origin feature/your-feature-name`
6. Open a Pull Request

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/anyai-cli.git
   cd anyai-cli
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Test your changes:
   ```bash
   npm run dev -- ask "test prompt"
   npm run dev -- configure
   npm run dev -- chat
   ```

## Code Style

- Use 2 spaces for indentation
- Use camelCase for variable names
- Use PascalCase for class names
- Include comments for complex logic
- Use meaningful variable and function names
- Keep functions small and focused

## Testing

- Test all new commands before submitting
- Ensure no breaking changes to existing commands
- Test with multiple providers if possible
- Verify error handling works as expected

## Documentation

- Update README.md if adding new features
- Add inline comments for complex code
- Update error messages to be user-friendly
- Add usage examples for new commands

## Pull Request Process

1. Update README.md with any new features or changes
2. Ensure all commands work correctly
3. Add a clear description of your changes
4. Reference any related issues
5. Wait for review and feedback

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue with the label `question` if you have any questions about contributing.

Thank you for contributing to anyai-cli! 🎉
