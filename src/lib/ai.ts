const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1';
const MODEL = import.meta.env.VITE_NVIDIA_MODEL || 'moonshotai/kimi-k2.6';

function getApiKey(): string {
  const key = import.meta.env.VITE_NVIDIA_API_KEY;
  if (!key) throw new Error('Missing VITE_NVIDIA_API_KEY env var');
  return key;
}

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
  const apiKey = getApiKey();
  const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    body: JSON.stringify({ ...body, stream: false }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NVIDIA API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  if (!msg?.content) throw new Error('No response from AI');
  return msg.content;
}

export async function parseTasksFromText(raw: string): Promise<RawTask[]> {
  const content = await callNVIDIA({
    model: MODEL,
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
    model: MODEL,
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
