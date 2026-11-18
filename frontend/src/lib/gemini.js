const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

/**
 * Sends a base64 image to Gemini Vision and extracts the medicine name.
 * @param {string} base64Data - pure base64 string (no data: prefix)
 * @returns {Promise<string>} - e.g. "Metformin 500mg" or "UNREADABLE"
 */
export async function scanMedicineFromImage(base64Data) {
  const body = {
    contents: [
      {
        parts: [
          {
            text: `You are a medicine label reader. Look carefully at this image of a medicine packet, box, strip, or bottle. 
Extract the medicine name and dosage printed on it (for example: "Metformin 500mg", "Aspirin 81mg", "Vitamin C 1000mg").
Return ONLY the medicine name and dosage in this exact format: "Name Dosage".
Do not include any other text, explanation, or punctuation.
If you cannot clearly read a medicine name, return exactly: UNREADABLE`,
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 50,
    },
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || 'Gemini API request failed');
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text || 'UNREADABLE';
}

/**
 * Fuzzy match: checks if scanned name matches any medicine in the prescription list.
 * Case-insensitive, ignores spaces and special characters.
 * @param {string} scannedName
 * @param {string[]} prescriptionList
 * @returns {{ found: boolean, matchedMed: string|null }}
 */
export function matchMedicine(scannedName, prescriptionList) {
  const normalize = (s) => s.toLowerCase().replace(/[\s\-\.]/g, '');
  const normScanned = normalize(scannedName);

  for (const med of prescriptionList) {
    const normMed = normalize(med);
    // Check if either contains the other (handles minor wording differences)
    if (normScanned.includes(normMed) || normMed.includes(normScanned)) {
      return { found: true, matchedMed: med };
    }
    // Check word-level match: if medicine name words appear in scanned result
    const medWords = med.toLowerCase().split(' ');
    const matchCount = medWords.filter(w => normScanned.includes(normalize(w))).length;
    if (matchCount >= 1 && medWords.length >= 1 && matchCount / medWords.length >= 0.7) {
      return { found: true, matchedMed: med };
    }
  }
  return { found: false, matchedMed: null };
}
