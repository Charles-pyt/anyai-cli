// src/agent/index.js
const { toolSchemas } = require('../tools/index');
const { dispatch } = require('../executor/index');
const { buildSystemPrompt } = require('./systemPrompt');
const { loadContext } = require('./context');
const { renderError } = require('../ui/renderers');
const colors = require('../ui/colors');
const spinner = require('../ui/spinner');

const MAX_ITERATIONS = 10;

async function run(userMessage, history, provider, config) {
  const context = await loadContext();
  const systemPrompt = buildSystemPrompt(context);

  history.push({ role: 'user', content: userMessage });

  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    spinner.start('Thinking...');

    let response;
    try {
      response = await provider.chat(history, {
        model: config.model,
        system: systemPrompt,
        tools: toolSchemas,
      });
    } catch (err) {
      spinner.stop();
      renderError('agent', err.message);
      return;
    }

    spinner.stop();

    if (response.stop_reason === 'tool_use') {
      // Append assistant message FIRST (required for Anthropic alternation)
      history.push({ role: 'assistant', content: response.content });

      // Print any text the model included before tool calls
      if (response.text) {
        process.stdout.write('\n' + colors.accent('AI: ') + response.text + '\n\n');
      }

      // Execute all tool calls and collect results
      const toolResults = [];
      const toolCalls = response.content.filter(b => b.type === 'tool_use');

      for (const toolCall of toolCalls) {
        const result = await dispatch(toolCall.name, toolCall.input);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      // Batch all results into single user message
      history.push({ role: 'user', content: toolResults });

      // Continue loop
      continue;
    }

    // stop_reason === 'end_turn' — final response
    const text = typeof response === 'string' ? response : response.text;
    if (text) {
      process.stdout.write('\n' + colors.accent('AI: ') + text + '\n\n');
    }
    return;
  }

  // Max iterations reached
  process.stdout.write(colors.warning(`\nAgent stopped after ${MAX_ITERATIONS} tool calls.\n\n`));
}

module.exports = { run };
