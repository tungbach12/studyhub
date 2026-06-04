const API_ENDPOINT = '/api/nvidia';

interface RawTask {
  title: string;
  description?: string;
  assigneeName?: string;
  subjectName?: string;
  deadline?: string;
}

function buildPrompt(raw: string): string {
  return `You are a task extraction assistant. Given raw study-related text below, extract structured tasks.

Rules:
- Each task must have at minimum a "title" field.
- "description" is optional free text.
- "assigneeName" should be a person's name if mentioned, otherwise null.
- "subjectName" should be a category/subject if mentioned, otherwise null.
- "deadline" should be a date string (YYYY-MM-DD) if mentioned, otherwise null.
- Output ONLY valid JSON as an array of objects: [{ "title": "...", "description": "...", "assigneeName": "...", "subjectName": "...", "deadline": "..." }]
- If no tasks can be extracted, return an empty array [].

Raw data:
${raw}`;
}

async function callNVIDIA(body: object): Promise<string> {
  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  if (!msg?.content) throw new Error('No response from AI');
  return msg.content;
}

export async function parseTasksFromText(raw: string): Promise<RawTask[]> {
  const content = await callNVIDIA({
    model: 'moonshotai/kimi-k2.6',
    messages: [{ role: 'user', content: buildPrompt(raw) }],
    temperature: 0.2,
    max_tokens: 4096,
    top_p: 1.00,
    chat_template_kwargs: { thinking: true },
  });
  return parseJSON(content);
}

export async function parseTasksFromImage(base64: string): Promise<RawTask[]> {
  const content = await callNVIDIA({
    model: 'moonshotai/kimi-k2.6',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract homework/task information from this image. Output as JSON array: [{ "title": "...", "description": "...", "assigneeName": "...", "subjectName": "...", "deadline": "..." }]. If no tasks found, return [].' },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 4096,
    top_p: 1.00,
    chat_template_kwargs: { thinking: true },
  });
  return parseJSON(content);
}

function parseJSON(raw: string): RawTask[] {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    const match = cleaned.match(/\[\s*\{.*\}\s*\]/s);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return []; }
    }
    return [];
  }
}
