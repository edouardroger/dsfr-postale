export interface Segment {
  text: string
  match: boolean
}

/** Supprime casse et diacritiques, caractère par caractère (même longueur que l'entrée NFC). */
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/**
 * Découpe `label` en segments, en marquant les mots de `query` qu'il contient,
 * sans tenir compte de la casse ni des accents (« republique » trouve « République »).
 */
export function highlight(label: string, query: string): Segment[] {
  const text = label.normalize('NFC')
  const folded = fold(text)
  const words = [...new Set(fold(query).split(/[\s,]+/).filter(Boolean))]
  if (!words.length || folded.length !== text.length) return [{ text, match: false }]

  const marked = new Array<boolean>(text.length).fill(false)
  for (const word of words) {
    for (let i = folded.indexOf(word); i !== -1; i = folded.indexOf(word, i + word.length)) {
      marked.fill(true, i, i + word.length)
    }
  }

  // Relie les mots marqués consécutifs pour éviter une mise en évidence hachée.
  for (let i = 1; i < text.length - 1; i++) {
    if (!marked[i] && /\s/.test(text[i]!) && marked[i - 1] && marked[i + 1]) marked[i] = true
  }

  const segments: Segment[] = []
  for (let i = 0; i < text.length; i++) {
    const last = segments.at(-1)
    if (last && last.match === marked[i]) last.text += text[i]
    else segments.push({ text: text[i]!, match: marked[i]! })
  }
  return segments
}
