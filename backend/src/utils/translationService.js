// LibreTranslate API configuration
const getLibreTranslateUrl = () =>
  process.env.LIBRETRANSLATE_URL || 'http://127.0.0.1:5002';

// Fallback translations for common rental terms
const fallbackTranslations = {
  'pets allowed': 'zwierzęta dozwolone',
  'no pets': 'brak zwierząt',
  'no smoking': 'zakaz palenia',
  'smoking allowed': 'palenie dozwolone',
  'utilities included': 'media wliczone',
  'utilities not included': 'media nie wliczone',
  'internet included': 'internet wliczony',
  'internet not included': 'internet nie wliczony',
  'parking included': 'parking wliczony',
  'parking not included': 'parking nie wliczony',
  furnished: 'umeblowane',
  unfurnished: 'nieumeblowane',
  'partially furnished': 'częściowo umeblowane',
  'washing machine': 'pralka',
  dishwasher: 'zmywarka',
  'air conditioning': 'klimatyzacja',
  'heating included': 'ogrzewanie wliczone',
  'electricity included': 'prąd wliczony',
  'water included': 'woda wliczona',
  'gas included': 'gaz wliczony',
  'quiet hours': 'godziny ciszy',
  'no parties': 'zakaz imprez',
  'no loud music': 'zakaz głośnej muzyki',
  'monthly rent': 'czynsz miesięczny',
  'security deposit': 'kaucja',
  'lease term': 'okres najmu',
  'move in date': 'data wprowadzenia',
  'move out date': 'data wyprowadzenia',
  'notice period': 'okres wypowiedzenia',
  'early termination': 'wcześniejsze rozwiązanie',
  'damage deposit': 'kaucja za szkody',
  'cleaning fee': 'opłata za sprzątanie',
  'late payment fee': 'opłata za zwłokę',
  maintenance: 'konserwacja',
  repairs: 'naprawy',
  'emergency contact': 'kontakt awaryjny',
  'landlord access': 'dostęp wynajmującego',
  'tenant responsibilities': 'obowiązki najemcy',
  'property rules': 'zasady nieruchomości',
  'house rules': 'zasady domu',
  'additional charges': 'dodatkowe opłaty',
  'rent increase': 'podwyżka czynszu',
  'lease renewal': 'odnowienie umowy',
  subletting: 'podnajem',
  guests: 'goście',
  'overnight guests': 'goście nocujący',
  'key deposit': 'kaucja za klucze',
  'move in inspection': 'inspekcja przy wprowadzeniu',
  'move out inspection': 'inspekcja przy wyprowadzeniu',
  'normal wear and tear': 'normalne zużycie',
  'property condition': 'stan nieruchomości',
  'tenant insurance': 'ubezpieczenie najemcy',
  'landlord insurance': 'ubezpieczenie wynajmującego',
};

// Reverse translations for Polish to English
const reverseFallbackTranslations = {};
Object.entries(fallbackTranslations).forEach(([english, polish]) => {
  reverseFallbackTranslations[polish] = english;
});

/**
 * Detect if text is primarily Polish or English
 * @param {string} text - Text to analyze
 * @returns {string} - 'en' or 'pl'
 */
const detectLanguage = (text) => {
  if (!text || text.trim() === '') {
    return 'en'; // Default to English
  }

  // Polish characters and common words
  const polishChars = /[ąćęłńóśźż]/gi;
  const polishWords =
    /\b(dozwolone|zakaz|wliczone|umeblowane|kaucja|czynsz|media|internet|parking|ogrzewanie|prąd|woda|gaz|godziny|ciszy|imprez|muzyki|miesięczny|okres|najmu|wprowadzenia|wyprowadzenia|wypowiedzenia|rozwiązanie|szkody|sprzątanie|zwłokę|konserwacja|naprawy|kontakt|dostęp|wynajmującego|obowiązki|najemcy|zasady|nieruchomości|domu|dodatkowe|opłaty|podwyżka|odnowienie|umowy|podnajem|goście|nocujący|klucze|inspekcja|zużycie|stan|ubezpieczenie)\b/gi;

  // English characters and common words
  const englishWords =
    /\b(allowed|pets|no|smoking|utilities|included|internet|parking|furnished|heating|electricity|water|gas|quiet|hours|parties|music|monthly|rent|security|deposit|lease|term|move|date|notice|period|early|termination|damage|cleaning|fee|late|payment|maintenance|repairs|emergency|contact|landlord|access|tenant|responsibilities|property|rules|house|additional|charges|increase|renewal|subletting|guests|overnight|keys|inspection|wear|tear|condition|insurance)\b/gi;

  const polishCharCount = (text.match(polishChars) || []).length;
  const polishWordCount = (text.match(polishWords) || []).length;
  const englishWordCount = (text.match(englishWords) || []).length;

  // If we have Polish characters or more Polish words, it's Polish
  if (polishCharCount > 0 || polishWordCount > englishWordCount) {
    return 'pl';
  }

  return 'en';
};

/**
 * Simple fallback translation using common terms
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language ('en' or 'pl')
 * @returns {string} - Translated text
 */
const fallbackTranslate = (text, targetLang = 'pl') => {
  if (!text || text.trim() === '') {
    return '';
  }

  let translatedText = text.toLowerCase();

  if (targetLang === 'pl') {
    // English to Polish
    Object.entries(fallbackTranslations).forEach(([english, polish]) => {
      const regex = new RegExp(english, 'gi');
      translatedText = translatedText.replace(regex, polish);
    });
  } else {
    // Polish to English
    Object.entries(reverseFallbackTranslations).forEach(([polish, english]) => {
      const regex = new RegExp(polish, 'gi');
      translatedText = translatedText.replace(regex, english);
    });
  }

  // Capitalize first letter of each sentence
  translatedText = translatedText.replace(
    /(^|\.\s+)([a-z])/g,
    (match, p1, p2) => {
      return p1 + p2.toUpperCase();
    }
  );

  return translatedText;
};

/**
 * Translate text using LibreTranslate API
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language ('en' or 'pl')
 * @param {string} targetLang - Target language ('en' or 'pl')
 * @returns {Promise<string>} - Translated text
 */
const translateWithLibreTranslate = async (text, sourceLang, targetLang) => {
  const LIBRETRANSLATE_URL = getLibreTranslateUrl();
  console.log(
    `🔄 Translating with LibreTranslate (${sourceLang} → ${targetLang}):`,
    text.substring(0, 50) + '...'
  );
  console.log('URL:', `${LIBRETRANSLATE_URL}/translate`);

  const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: text,
      source: sourceLang,
      target: targetLang,
    }),
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    throw new Error(`LibreTranslate API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ LibreTranslate translation completed');
  return data.translatedText;
};

/**
 * Translate text with automatic language detection
 * @param {string} text - Text to translate
 * @returns {Promise<{english: string, polish: string, detectedLang: string}>} - Bilingual result
 */
export const translateWithAutoDetection = async (text) => {
  if (!text || text.trim() === '') {
    return { english: '', polish: '', detectedLang: 'en' };
  }

  // Detect the language of the input text
  const detectedLang = detectLanguage(text);
  console.log(`🔍 Detected language: ${detectedLang}`);

  let englishText, polishText;

  if (detectedLang === 'pl') {
    // Input is Polish, translate to English
    polishText = text;
    try {
      englishText = await translateWithLibreTranslate(text, 'pl', 'en');
    } catch (error) {
      console.log(
        '⚠️ LibreTranslate not available, using fallback translation'
      );
      englishText = fallbackTranslate(text, 'en');
    }
  } else {
    // Input is English, translate to Polish
    englishText = text;
    try {
      polishText = await translateWithLibreTranslate(text, 'en', 'pl');
    } catch (error) {
      console.log(
        '⚠️ LibreTranslate not available, using fallback translation'
      );
      polishText = fallbackTranslate(text, 'pl');
    }
  }

  return {
    english: englishText,
    polish: polishText,
    detectedLang,
  };
};

/**
 * Translate text from English to Polish (legacy function)
 * @param {string} text - Text to translate
 * @returns {Promise<string>} - Translated text
 */
export const translateToPolish = async (text) => {
  if (!text || text.trim() === '') {
    return '';
  }

  // Try LibreTranslate first
  try {
    return await translateWithLibreTranslate(text, 'en', 'pl');
  } catch (error) {
    console.log('⚠️ LibreTranslate not available, using fallback translation');
    return fallbackTranslate(text, 'pl');
  }
};

/**
 * Translate additional terms for contract with automatic language detection
 * @param {string} additionalTerms - Additional terms in any language
 * @returns {Promise<{english: string, polish: string, detectedLang: string}>} - Bilingual terms
 */
export const translateAdditionalTerms = async (additionalTerms) => {
  return await translateWithAutoDetection(additionalTerms);
};
