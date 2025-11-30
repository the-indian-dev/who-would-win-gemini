import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

// --- DOM Element Getters ---
const charAInput = document.getElementById("charA") as HTMLInputElement;
const charBInput = document.getElementById("charB") as HTMLInputElement;
const fightButton = document.getElementById("fightButton") as HTMLButtonElement;
const loadingDiv = document.getElementById("loading");
const errorDiv = document.getElementById("error");
const resultsDiv = document.getElementById("results");

const winnerSpan = document.getElementById("winner");
const charANameDisplaySpan = document.getElementById("charANameDisplay");
const strengthASpan = document.getElementById("strength_a");
const specialAttackASpan = document.getElementById("special_attack_a");
const charBNameDisplaySpan = document.getElementById("charBNameDisplay");
const strengthBSpan = document.getElementById("strength_b");
const specialAttackBSpan = document.getElementById("special_attack_b");
const fightDescriptionP = document.getElementById("fight_description");

async function callGeminiAPI(characterA: string, characterB: string) {
  if (!API_KEY || API_KEY === "YOUR_API_KEY") {
    throw new Error(
      "API_KEY is not set. Please replace 'YOUR_API_KEY' in index.tsx with your actual Google AI Studio API key.",
    );
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY }); // Use the API_KEY constant
  const config = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      required: [
        "winner",
        "strength_a",
        "strength_b",
        "special_attack_a",
        "special_attack_b",
        "fight_description",
      ],
      properties: {
        winner: {
          type: Type.STRING,
        },
        strength_a: {
          type: Type.NUMBER,
        },
        strength_b: {
          type: Type.NUMBER,
        },
        special_attack_a: {
          // Assuming this should be a string as per schema, if it's an array, schema needs update
          type: Type.STRING,
        },
        special_attack_b: {
          // Assuming this should be a string as per schema
          type: Type.STRING,
        },
        fight_description: {
          type: Type.STRING,
        },
      },
    },
    systemInstruction: [
      {
        text: `Compare who would win in a fight,
winner : The winner of the fight
strength_a : The "amount" of strength of the first character in number
strength_b : The "amount" of strength of the second character in number
special_attack_a : Special attack of the first character (can be a single string or a comma-separated list)
special_attack_b : Special attack of the second character (can be a single string or a comma-separated list)
fight_description : A maximum of 100 word paragraph on how the fight is, make it intense and descriptive`,
      },
    ],
  };
  const model = "gemini-2.5-flash";
  const contents = [
    {
      role: "user",
      parts: [
        {
          // Dynamically set character names
          text: `["${characterA}", "${characterB}"]`,
        },
      ],
    },
  ];

  // The core logic for calling the API and streaming the response
  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });

  let fullResponseText = "";
  for await (const chunk of response) {
    fullResponseText += chunk.text;
  }
  return JSON.parse(fullResponseText); // Assuming the full response is a single JSON string
}

// --- Frontend Logic ---
async function handleFight() {
  if (
    !charAInput ||
    !charBInput ||
    !fightButton ||
    !loadingDiv ||
    !errorDiv ||
    !resultsDiv ||
    !winnerSpan ||
    !charANameDisplaySpan ||
    !strengthASpan ||
    !specialAttackASpan ||
    !charBNameDisplaySpan ||
    !strengthBSpan ||
    !specialAttackBSpan ||
    !fightDescriptionP
  ) {
    console.error("DOM element missing");
    if (errorDiv) {
      errorDiv.textContent = "frontend missing";
      errorDiv.style.display = "block";
    }
    return;
  }

  const charA = charAInput.value.trim();
  const charB = charBInput.value.trim();

  if (!charA || !charB) {
    errorDiv.textContent = "Please enter names for both characters.";
    errorDiv.style.display = "block";
    resultsDiv.style.display = "none";
    return;
  }

  loadingDiv.style.display = "block";
  errorDiv.style.display = "none";
  resultsDiv.style.display = "none";
  fightButton.disabled = true;

  try {
    const resultData = await callGeminiAPI(charA, charB);

    // Update DOM with results
    if (charANameDisplaySpan) charANameDisplaySpan.textContent = charA;
    if (charBNameDisplaySpan) charBNameDisplaySpan.textContent = charB;

    winnerSpan.textContent = resultData.winner;
    strengthASpan.textContent = resultData.strength_a.toString();
    strengthBSpan.textContent = resultData.strength_b.toString();
    specialAttackASpan.textContent = Array.isArray(resultData.special_attack_a)
      ? resultData.special_attack_a.join(", ")
      : resultData.special_attack_a;
    specialAttackBSpan.textContent = Array.isArray(resultData.special_attack_b)
      ? resultData.special_attack_b.join(", ")
      : resultData.special_attack_b;
    fightDescriptionP.textContent = resultData.fight_description;

    resultsDiv.style.display = "block";
  } catch (e: any) {
    console.error("Error during API call or processing:", e);
    errorDiv.textContent = `An error occurred: ${e.message || "Unknown error"}`;
    errorDiv.style.display = "block";
  } finally {
    loadingDiv.style.display = "none";
    fightButton.disabled = false;
  }
}

// --- Event Listener Setup ---
if (fightButton) {
  fightButton.addEventListener("click", handleFight);
} else {
  console.error("Fight button not found");
}
