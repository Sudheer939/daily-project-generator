// generate-project.js
// Google Gemini API ni call chesi, oka chinna random project (idea + code files) generate chestundi.
// Output: project.json (repo name, description, files list)

const fs = require("fs");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const TOPICS = [
  "a responsive landing page using HTML, CSS and vanilla JavaScript",
  "a React mini app with 2-3 components and useState/useEffect",
  "a CSS animation/UI showcase (cards, loaders, hover effects) in HTML/CSS/JS",
  "a Node.js + Express REST API with in-memory or MySQL-backed data",
  "a full-stack mini app: React frontend + Node.js/Express backend + MySQL database",
  "a vanilla JavaScript interactive UI widget (form validator, tab switcher, accordion, modal)",
  "a Node.js + Express + MySQL CRUD app (simple resource like notes, tasks, or contacts)",
  "a React component library piece (reusable button/card/dropdown with props and variants)",
  "a JavaScript + HTML/CSS single-page dashboard UI with mock data",
  "a Node.js backend utility (auth middleware, MySQL connection helper, or API validation layer)",
  "a Django app with a simple model, view, and HTML template (e.g. a small CRUD resource)",
  "a Django REST API endpoint backed by MySQL or SQLite with a basic HTML test page",
  "a Python script using Pandas to clean and analyze a small sample dataset (CSV-based)",
  "a Python script using NumPy for a small numerical/data task (e.g. matrix ops, stats)",
  "a Python + MongoDB script (using pymongo) for simple CRUD on a MongoDB collection",
  "a Django + MongoDB mini app (using djongo or pymongo) with a simple HTML frontend",
  "a Python data-processing pipeline combining Pandas and NumPy on sample data, with a small HTML report output"
];

async function callGemini(systemPrompt, userPrompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 8192
        }
      })
    }
  );

  const data = await response.json();

  if (!data.candidates || !data.candidates[0]) {
    console.error("API Error:", JSON.stringify(data));
    process.exit(1);
  }

  const candidate = data.candidates[0];
  if (candidate.finishReason === "MAX_TOKENS") {
    console.error("Response was truncated (MAX_TOKENS). Will retry with a smaller ask.");
    return null;
  }

  let raw = candidate.content.parts[0].text.trim();
  raw = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return raw;
}

async function generateProject() {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

  const systemPrompt = `You generate small, complete, working demo/practice coding projects.
Respond ONLY with valid JSON, no markdown fences, no preamble. Schema:
{
  "repo_name": "kebab-case-name-max-4-words",
  "description": "one line description, max 100 chars",
  "files": [
    { "path": "README.md", "content": "concise README content in markdown, explaining what the project does and how to run it" },
    { "path": "relative/file/path.ext", "content": "full file content as a string" }
  ]
}
Keep it small: 3-4 files total (including README.md), each file under 60 lines and README under 40 lines. Be concise — short code, short comments, no filler. Make it something a beginner-to-intermediate frontend/backend developer would build to practice. README.md MUST be the first entry in the files array — do not omit it.
STRICT TECH CONSTRAINT: Only use these technologies: HTML, CSS, JavaScript, ReactJS, Node.js, MySQL, Python, Django, MongoDB, NumPy, Pandas. Never use any other language or framework (no Java, PHP, Ruby, Flask, etc). Match the tools to the topic given — e.g. a Pandas/NumPy topic should be pure Python with those libraries, a Django topic should use Django's structure, a Node.js topic should stay in JavaScript. If MySQL or MongoDB is used, include the schema/sample-data file and clearly document connection/setup steps in the README — do not require an actual running database for the demo to be readable.
MANDATORY: Every project MUST include at least one simple HTML file (with inline or linked CSS/JS) that acts as a frontend/demo page, a rendered report, or a test client — for example a simple form, a fetch()-based UI, or a Django template. A project with zero HTML/CSS/JS files is not acceptable, even for pure Python/Pandas/NumPy topics (in that case, include a small HTML file showing sample output/results).`;

  const userPrompt = `Generate ${topic}. Make it genuinely useful or interesting, not a "hello world". Pick a fresh, specific idea (not generic todo-list/calculator unless given a creative twist). Keep everything concise since there is a strict output size limit.`;

  let raw = await callGemini(systemPrompt, userPrompt);

  if (raw === null) {
    // Retry once with an even smaller ask
    const retryUserPrompt = userPrompt + " IMPORTANT: Keep this extremely minimal — only 3 files total, each under 35 lines, to fit a tight token budget.";
    raw = await callGemini(systemPrompt, retryUserPrompt);
    if (raw === null) {
      console.error("Response truncated even after retry. Exiting.");
      process.exit(1);
    }
  }

  let project;
  try {
    project = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse JSON from Gemini:", raw);
    process.exit(1);
  }

  // Add a date + unique run suffix to avoid repo name collisions (important for batch runs)
  const dateSuffix = new Date().toISOString().slice(0, 10);
  const runIndex = process.env.RUN_INDEX ? `-${process.env.RUN_INDEX}` : "";
  project.repo_name = `${project.repo_name}-${dateSuffix}${runIndex}`;

  fs.writeFileSync("project.json", JSON.stringify(project, null, 2));
  console.log("Generated project:", project.repo_name);
}

generateProject().catch(err => {
  console.error(err);
  process.exit(1);
});
