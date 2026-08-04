const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-5';

function buildSystemPrompt(financialContext) {
  return [
    'You are the AI Coach inside Boom Finance, a personal finance app.',
    'You have access to the user\'s real financial data below. Ground every answer in it — do not invent numbers.',
    'Be concise, calm, and specific. Never present yourself as a substitute for regulated financial advice.',
    'If the data below doesn\'t contain what you need to answer confidently, say so plainly rather than guessing.',
    '',
    '=== USER\'S CURRENT FINANCIAL DATA ===',
    JSON.stringify(financialContext, null, 2)
  ].join('\n');
}

async function askCoach(userMessage, financialContext, conversationHistory) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in your .env file — see .env.example.');
  }

  const messages = (conversationHistory || []).concat([
    { role: 'user', content: userMessage }
  ]);

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      system: buildSystemPrompt(financialContext),
      messages: messages
    })
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error('Claude API error (HTTP ' + response.status + '): ' + errBody.slice(0, 300));
  }

  const data = await response.json();
  const textBlock = (data.content || []).find(function (b) { return b.type === 'text'; });
  return textBlock ? textBlock.text : '(No text content in response)';
}

module.exports = { askCoach, buildSystemPrompt };
