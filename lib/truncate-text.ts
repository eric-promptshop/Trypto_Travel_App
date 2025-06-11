export function truncateTextSmart(text: string, maxLength: number, minLength?: number): string {
  if (text.length <= maxLength) {
    return text
  }

  const min = minLength !== undefined ? minLength : Math.floor(maxLength * 0.75)

  // Try to find a sentence-ending punctuation mark near maxLength
  const truncated = text.substring(0, maxLength)
  const lastPunctuationIndex = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?"),
  )

  // If a punctuation mark is found after minLength, truncate there
  if (lastPunctuationIndex > min && lastPunctuationIndex < truncated.length - 1) {
    // -1 to avoid ending with just punctuation
    return truncated.substring(0, lastPunctuationIndex + 1)
  }

  // If no suitable punctuation, try to find the last space within maxLength
  const lastSpaceIndex = truncated.lastIndexOf(" ")
  if (lastSpaceIndex > min && lastSpaceIndex < truncated.length - 1) {
    return truncated.substring(0, lastSpaceIndex) + "..."
  }

  // If still no good break point, hard truncate at maxLength
  return text.substring(0, maxLength - 3) + "..."
}

/**
 * Extracts a specific number of sentences from a text.
 * @param text The input text.
 * @param sentenceCount The number of sentences to extract.
 * @returns A string containing the specified number of sentences.
 */
export function extractSentences(text: string, sentenceCount: number): string {
  if (!text) return ""
  // Regex to split by sentences, keeping punctuation.
  // This regex handles ., !, ?, and even cases like Mr. or U.S.A.
  const sentences = text.match(/[^.!?]+[.!?]\s*|[^.!?]+$/g)

  if (sentences) {
    return sentences.slice(0, sentenceCount).join(" ").trim()
  }
  // Fallback if regex fails (e.g., text with no punctuation)
  // Just take the first N words as a rough approximation or a fixed char length
  const words = text.split(" ")
  if (words.length > sentenceCount * 15) {
    // Assuming avg 15 words/sentence
    return words.slice(0, sentenceCount * 15).join(" ") + "..."
  }
  return text
}
