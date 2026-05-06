class Provider {
  constructor(name) {
    this.name = name;
    this.apiKey = null;
    this.model = null;
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  setModel(model) {
    this.model = model;
  }

  getDefaultModel() {
    throw new Error('getDefaultModel() must be implemented by subclass');
  }

  async validate() {
    throw new Error('validate() must be implemented by subclass');
  }

  async generate(prompt, options = {}) {
    throw new Error('generate() must be implemented by subclass');
  }

  async chat(messages, options = {}) {
    const lastMessage = messages[messages.length - 1];
    return this.generate(lastMessage.content, options);
  }

  getModels() {
    throw new Error('getModels() must be implemented by subclass');
  }

  getName() {
    return this.name;
  }
}

module.exports = Provider;
