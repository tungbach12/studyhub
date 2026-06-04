const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1';
const MODEL = import.meta.env.VITE_NVIDIA_MODEL || 'nvidia/llama-3.1-nemotron-70b-instruct';
const VISION_MODEL = import.meta.env.VITE_NVIDIA_VISION_MODEL || 'nvidia/llama-3.2-90b-vision-instruct';

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

export async function parseTasksFromText(raw: string): Promise<RawTask[]> {
  const apiKey = getApiKey();
  const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: buildPrompt(raw) }],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NVIDIA API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No response from AI');
  return parseJSON(content);
}

export async function parseTasksFromImage(base64: string): Promise<RawTask[]> {
  const apiKey = getApiKey();
  const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract homework/task information from this image. Output as JSON array: [{ "title": "...", "description": "...", "assigneeName": "...", "subjectName": "...", "deadline": "..." }]. If no tasks found, return [].' },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NVIDIA Vision API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No response from AI');
  return parseJSON(content);
}

function parseJSON(raw: string): RawTask[] {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    // try to find JSON array via regex
    const match = cleaned.match(/\[\s*\{.*\}\s*\]/s);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return []; }
    }
    return [];
  }
}
