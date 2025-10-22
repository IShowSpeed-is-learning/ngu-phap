/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * This file is part of ngu-phap.
 *
 * Copyright (c) 2025 IShowSpeed-is-learning
 */

// ======= CONFIG =======
const openAIEndpoint = "https://api.openai.com/v1/chat/completions";
const geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models";
let apiKey = "";
let modelType = "gpt";
let modelName = "gpt-5"; // default model (latest)

// ======= PROMPT =======
const editorPrompt = `
You are an expert English editor.

Given the user's English text, produce up to three distinct rewritten versions according to these rules:

1️⃣ Grammar Correction Only — Fix only grammatical or spelling mistakes while preserving the original tone, mood, and word choice as much as possible.

2️⃣ Natural Paraphrase — Correct grammar and rephrase slightly so the sentence sounds fluent and natural to a native speaker, while keeping the same nuance and intent as the original.

3️⃣ Formalized Version (Conditional) — If the text contains slang, abbreviations, or overly casual phrasing, rewrite it into a grammatically correct and moderately formal version (not overly stiff). If the input is already formal enough, skip this version.

⚠️ Output only the rewritten sentences/paragraphs.
⚠️ Separate each version strictly with the delimiter:
\\n---\\n
⚠️ Do not add any explanation, titles, or introductions.
`;

// ======= ELEMENTS =======
const apiKeyInput = document.getElementById("api-key");
const modelSelect = document.getElementById("model-select");
const userInput = document.getElementById("user-input");
const resultContainer = document.getElementById("result");
const statusText = document.getElementById("status");

// ======= FUNCTIONS =======
async function generateText() {
  const text = userInput.value.trim();
  if (!apiKeyInput.value) {
    alert("Please enter your API key first!");
    return;
  }
  if (!text) return;

  apiKey = apiKeyInput.value;
  modelName = modelSelect.value;
  modelType = modelName.startsWith("gemini") ? "gemini" : "gpt";

  resultContainer.innerHTML = "";
  statusText.textContent = "Processing...";
  statusText.style.opacity = "1";

  try {
    let content = "";

    if (modelType === "gpt") {
      // ===== OPENAI GPT =====
      const response = await fetch(openAIEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: editorPrompt },
            { role: "user", content: text },
          ],
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      content = data.choices?.[0]?.message?.content?.trim() || "";
    } else {
      // ===== GEMINI =====
      const geminiModel = modelName;
      const response = await fetch(
        `${geminiEndpoint}/${geminiModel}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: `${editorPrompt}\n\nUser input:\n${text}` }] },
            ],
          }),
        }
      );
      const data = await response.json();
      content = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    }

    statusText.textContent = "";

    // Split by the delimiter "\n---\n"
    const parts = content.split(/\n---\n+/).filter(Boolean);
    if (!parts.length) {
      resultContainer.innerHTML =
        '<div class="result-block">⚠️ No valid output returned. Check API key or try again.</div>';
      return;
    }

    // Create blocks for each output
    parts.forEach((part, i) => {
      const div = document.createElement("div");
      div.className = "result-block";
      div.style.animationDelay = `${i * 0.2}s`;
      div.innerText = part.trim();
      resultContainer.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    statusText.textContent = "Error: " + err.message;
  }
}

// ======= EVENT LISTENERS =======
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    generateText();
  }
});
