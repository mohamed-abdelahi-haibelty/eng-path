/**
 * Speaking evaluation prompts, language-branched.
 */

interface SpeakingInputs {
  question: string;
  transcript: string;
  wordCount: number;
}

function englishPrompt({ question, transcript, wordCount }: SpeakingInputs): string {
  return `You are a TOEFL speaking evaluator. You will receive a question and a spoken response transcript. Score the response using exactly the rubric provided.

Return only a JSON object. Do not add any text outside the JSON.

Rubric:
Fluency (0-5): completeness and continuity of the response. Do not infer pauses. Judge only content volume and repetition.
Coherence (0-5): how directly and logically the response answers the question.
Vocabulary (0-5): range and accuracy of word choice.
Grammar (0-5): structural accuracy. Minor errors are acceptable at 3+.

Required output format:
{
  "fluency": <0-5>,
  "coherence": <0-5>,
  "vocabulary": <0-5>,
  "grammar": <0-5>,
  "feedback": "<2-3 sentences. What the response did well and what to improve. Be specific, not generic.>",
  "suggestion": "<One concrete rewrite or example of a stronger answer to the same question. 2-3 sentences max. null if fluency score is 0.>"
}

Question: ${question}

Transcript: ${transcript}

Word count: ${wordCount}
Time limit: 60 seconds`;
}

function frenchPrompt({ question, transcript, wordCount }: SpeakingInputs): string {
  return `Vous êtes un évaluateur de production orale DELF/DALF. Vous recevrez une question et la transcription d'une réponse orale. Évaluez la réponse selon le barème ci-dessous.

Renvoyez uniquement un objet JSON. N'ajoutez aucun texte en dehors du JSON. Le retour et la suggestion doivent être rédigés en français.

Barème :
Fluidité (0-5) : complétude et continuité de la réponse. Ne déduisez pas de pauses. Jugez uniquement le volume de contenu et les répétitions.
Cohérence (0-5) : à quel point la réponse répond directement et logiquement à la question.
Vocabulaire (0-5) : étendue et exactitude du choix des mots.
Grammaire (0-5) : exactitude des structures. Quelques petites erreurs sont acceptables à partir de 3.

Format de sortie obligatoire :
{
  "fluency": <0-5>,
  "coherence": <0-5>,
  "vocabulary": <0-5>,
  "grammar": <0-5>,
  "feedback": "<2-3 phrases en français. Ce qui a été réussi et ce qu'il faut améliorer. Soyez précis, pas générique.>",
  "suggestion": "<Une reformulation concrète ou un exemple de meilleure réponse à la même question. 2-3 phrases maximum, en français. null si fluency est à 0.>"
}

Question : ${question}

Transcription : ${transcript}

Nombre de mots : ${wordCount}
Temps imparti : 60 secondes`;
}

export function getSpeakingPrompt(
  language: "en" | "fr",
  inputs: SpeakingInputs,
): string {
  return language === "fr" ? frenchPrompt(inputs) : englishPrompt(inputs);
}

/**
 * Returns the Whisper transcription prompt + ISO language code.
 */
export function getWhisperContext(language: "en" | "fr") {
  if (language === "fr") {
    return {
      languageCode: "fr",
      prompt:
        "Ceci est une réponse orale en français à une question d'expression orale de type DELF/DALF.",
    };
  }
  return {
    languageCode: "en",
    prompt:
      "This is a spoken English language response to a TOEFL-style speaking question.",
  };
}
