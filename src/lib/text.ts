/**
 * 아주 단순한 한국어/영어 텍스트 처리. 형태소 분석기 없이 흔한 조사·어미만 떼어 낸다.
 * 정확도보다 "의존성 없이 브라우저에서도 돈다"가 목표다.
 */

// 길이가 긴 것부터 검사해야 "에서"가 "서"보다 먼저 떨어진다.
const SUFFIXES = [
  "으로부터", "에서부터", "이라는", "이라고", "에서는", "으로는", "에게서",
  "에서", "에게", "으로", "까지", "부터", "보다", "처럼", "이나", "이다", "이고", "하고",
  "하는", "하면", "해서", "했다", "한다", "된다", "되는", "라는", "라고", "이면", "입니다",
  // 질문 어미: "결정했나" → "결정"
  "했는지", "했나요", "했어요", "하나요", "할까요", "인가요", "했나", "했어", "했지", "하나", "할까", "나요",
  "은", "는", "이", "가", "을", "를", "에", "의", "와", "과", "로", "만",
].sort((a, b) => b.length - a.length);

const STOPWORDS = new Set([
  // 한국어
  "그리고", "하지만", "그래서", "또는", "또한", "같은", "다른", "모든", "있다", "없다", "있는", "없는",
  "한다", "된다", "것이", "것을", "것은", "때문", "위해", "대해", "통해", "경우", "정도", "이것", "그것",
  "무엇", "뭐야", "뭐지", "뭘로", "어떻게", "어떤", "왜", "언제", "어디", "누가", "알려줘", "정했어",
  "있어", "없어", "인가", "인지", "쓴다", "한다", "된다", "있다", "같다", "보다", "때문에", "가장", "먼저", "다음", "이번", "모두", "각각", "참고", "관련",
  // 영어
  "the", "and", "for", "with", "that", "this", "are", "was", "from", "into", "what", "how", "why",
]);

export function stripSuffix(token: string): string {
  // 한글로 끝나는 3글자 이상 단어만 조사를 뗀다. 2글자 단어("회의")는 그대로 둔다.
  if (token.length < 3 || !/[가-힣]$/.test(token)) return token;
  for (const s of SUFFIXES) {
    if (token.endsWith(s) && token.length - s.length >= 2) return token.slice(0, -s.length);
  }
  return token;
}

/** 키워드 후보 추출: 소문자화 → 기호로 분리 → 조사 제거 → 불용어/짧은 토큰 제거 */
export function keywordTokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map(stripSuffix)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

export function termFrequencies(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  for (const t of keywordTokens(text)) freq.set(t, (freq.get(t) ?? 0) + 1);
  return freq;
}

export function topKeywords(text: string, limit = 8): { term: string; count: number }[] {
  return [...termFrequencies(text)]
    .map(([term, count]) => ({ term, count }))
    .filter((k) => k.count >= 2)
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, limit);
}

export function splitSentences(text: string): string[] {
  return text
    .split(/\n+|(?<=[.!?。])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * 추출 요약: 문서 안에서 자주 나온 키워드를 많이 담은 문장을 고른다.
 * 결과는 원래 문장 순서를 지킨다. 3단계에서 LLM 요약과 나란히 비교할 기준선.
 */
export function extractiveSummary(text: string, maxSentences = 3): string[] {
  const freq = termFrequencies(text);
  const sentences = splitSentences(text);
  const scored = sentences
    .map((sentence, index) => {
      const tokens = keywordTokens(sentence);
      if (sentence.length < 12 || tokens.length < 3) return { sentence, index, score: 0 };
      const sum = tokens.reduce((acc, t) => acc + (freq.get(t) ?? 0) - 1, 0);
      return { sentence, index, score: sum / Math.sqrt(tokens.length) };
    })
    .filter((s) => s.score > 0);
  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence);
}
