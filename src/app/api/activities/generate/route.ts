import Anthropic from "@anthropic-ai/sdk";
import { generateId } from "@/lib/utils/session";
import type { Activity, Slide, Checkpoint } from "@/types";

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are a physics activity designer for Rekhachitra, a Desmos-based interactive learning platform.
Your job is to generate structured multi-slide activities that guide students through physics concepts
using the Desmos Graphing Calculator.

DESMOS STATE FORMAT — use EXACTLY this JSON structure for any slide that needs a graph:
{
  "version": 11,
  "graph": { "viewport": { "xmin": -10, "ymin": -7, "xmax": 10, "ymax": 7 } },
  "expressions": {
    "list": [
      { "type": "expression", "id": "1", "color": "#1b7888", "latex": "y=2x+1" }
    ]
  }
}

SLIDER expressions — add separate expression entries for each slider variable:
{ "type": "expression", "id": "2", "latex": "a=0" }
Students will see "Add slider: a" automatically in Desmos.

COMMON PHYSICS SETUPS (use these as reference):

1. Point with sliders (Defining Motion):
   expressions list: [
     { "id":"1", "latex":"(a,b)", "color":"#c74440" },
     { "id":"2", "latex":"a=1" },
     { "id":"3", "latex":"b=1" }
   ]

2. Linear motion x = x₀ + vt (1D SUVAT):
   expressions list: [
     { "id":"1", "latex":"(x_0+v\\cdot t, 0)", "color":"#c74440" },
     { "id":"2", "latex":"t=0" },
     { "id":"3", "latex":"v=2" },
     { "id":"4", "latex":"x_0=0" }
   ]
   viewport: { "xmin": -2, "ymin": -3, "xmax": 20, "ymax": 3 }

3. SUVAT distance (s = ut + ½at²):
   expressions list: [
     { "id":"1", "latex":"s=u\\cdot t+\\frac{1}{2}a\\cdot t^2" },
     { "id":"2", "latex":"u=5" },
     { "id":"3", "latex":"a=2" }
   ]

4. Projectile / parabolic motion (2D):
   expressions list: [
     { "id":"1", "latex":"(v_0\\cos\\left(\\theta\\right)\\cdot t, v_0\\sin\\left(\\theta\\right)\\cdot t-4.9t^2)", "color":"#c74440" },
     { "id":"2", "latex":"t=0" },
     { "id":"3", "latex":"v_0=15" },
     { "id":"4", "latex":"\\theta=0.9" }
   ]
   viewport: { "xmin": -2, "ymin": -2, "xmax": 40, "ymax": 15 }

5. Velocity-time graph:
   expressions list: [
     { "id":"1", "latex":"y=a\\cdot x+u", "color":"#2d70b3" },
     { "id":"2", "latex":"a=2" },
     { "id":"3", "latex":"u=0" }
   ]
   axis labels — use separate text expressions for axis labels when helpful.

PEDAGOGICAL PATTERN — structure slides like this:
1. Setup/Explore — Desmos pre-loaded, instruction to observe (no question or free_response)
2. Observe — same or evolved Desmos + free_response ("What do you notice?")
3. Predict — mcq testing the key concept just explored
4. Generalise — evolved Desmos with new parameter + free_response
5. Challenge — open extension problem, mcq or free_response

RULES:
- Every slide MUST have a title and instructions (clear, student-facing language, age-appropriate)
- Instructions should be 1-3 sentences; conversational, encouraging
- Use free_response for reflection/observation questions
- Use mcq for concept-check questions; always 4 options with exactly one correct
- desmosState null is fine for pure question slides
- NEVER output prose outside the JSON. Return ONLY the JSON object.

OUTPUT SCHEMA:
{
  "title": "string — activity title",
  "description": "string — 1-2 sentence summary for teacher",
  "slides": [
    {
      "title": "string",
      "instructions": "string",
      "desmosState": { ...version 11 object... } | null,
      "checkpoint": {
        "type": "mcq" | "short_answer" | "none",
        "question": "string",
        "options": ["A text", "B text", "C text", "D text"],
        "correctIndex": 0,
        "timeLimit": 30,
        "points": 10
      } | null
    }
  ]
}
`.trim();

// ── User prompt builder ───────────────────────────────────────────────────────

function buildUserPrompt(body: {
  description: string;
  objectives: string;
  gradeLevel: string;
  numSlides: number;
  style: string;
}) {
  return `Create a ${body.numSlides}-slide physics activity.

Topic / Description:
${body.description}

Learning Objectives:
${body.objectives || "Not specified — infer from the description"}

Grade Level: ${body.gradeLevel}
Activity Style: ${body.style}

Follow the pedagogical pattern. Make sure at least half the slides have a Desmos graph configured.
Return ONLY valid JSON matching the schema above.`;
}

// ── Slide mapper ──────────────────────────────────────────────────────────────

interface RawSlide {
  title: string;
  instructions: string;
  desmosState: Record<string, unknown> | null;
  checkpoint: {
    type: "mcq" | "short_answer" | "none";
    question: string;
    options?: string[];
    correctIndex?: number;
    timeLimit?: number;
    points?: number;
  } | null;
}

function mapSlide(raw: RawSlide, index: number, activityId: string): Slide {
  let checkpoint: Checkpoint | null = null;

  if (raw.checkpoint && raw.checkpoint.type !== "none") {
    const cp = raw.checkpoint;
    if (cp.type === "mcq" && cp.options) {
      checkpoint = {
        type: "mcq",
        question: cp.question ?? "",
        options: cp.options.map((text, i) => ({
          id: generateId(),
          text,
          isCorrect: i === (cp.correctIndex ?? 0),
        })),
        timeLimit: cp.timeLimit ?? 30,
        points: cp.points ?? 10,
      };
    } else if (cp.type === "short_answer") {
      checkpoint = {
        type: "short_answer",
        question: cp.question ?? "",
        timeLimit: cp.timeLimit ?? 60,
        points: cp.points ?? 10,
      };
    }
  }

  return {
    id: generateId(),
    activityId,
    position: index,
    type: "graph",
    title: raw.title ?? `Slide ${index + 1}`,
    instructions: raw.instructions ?? "",
    graphState: null,
    desmosState: raw.desmosState ?? null,
    checkpoint,
    createdAt: new Date().toISOString(),
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "ANTHROPIC_API_KEY is not set. Add it to your .env.local file." },
        { status: 500 }
      );
    }

    const body = await req.json();

    if (!body.description?.trim()) {
      return Response.json({ error: "description is required" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(body) }],
    });

    const raw = (message.content[0] as { text: string }).text;

    // Extract the JSON object from the response (Claude sometimes adds a tiny preamble)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "AI returned an unexpected format. Please try again." }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      title: string;
      description: string;
      slides: RawSlide[];
    };

    const activityId = generateId();
    const activity: Activity = {
      id: activityId,
      teacherId: "local-teacher",
      title: parsed.title,
      description: parsed.description ?? null,
      isPublic: false,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slides: (parsed.slides ?? []).map((s, i) => mapSlide(s, i, activityId)),
    };

    return Response.json({ activity });
  } catch (err) {
    console.error("[generate activity]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
