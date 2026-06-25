const baseMap: Record<string, string> = {
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", を: "wo", ん: "n",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  ぁ: "a", ぃ: "i", ぅ: "u", ぇ: "e", ぉ: "o",
  ゃ: "ya", ゅ: "yu", ょ: "yo",
  ゔ: "vu",
};

const comboMap: Record<string, string> = {
  きゃ: "kya", きゅ: "kyu", きょ: "kyo",
  しゃ: "sha", しゅ: "shu", しょ: "sho",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho",
  にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo",
  みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo",
  ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  じゃ: "ja", じゅ: "ju", じょ: "jo",
  びゃ: "bya", びゅ: "byu", びょ: "byo",
  ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",

  ふぁ: "fa", ふぃ: "fi", ふぇ: "fe", ふぉ: "fo",
  てぃ: "ti", とぅ: "tu",
  でぃ: "di", どぅ: "du",
  うぃ: "wi", うぇ: "we", うぉ: "wo",
};

const vowelPattern = /[aeiou]$/;
const consonantPattern = /^[bcdfghjklmnpqrstvwxyz]/;

function kataToHira(input: string) {
  return input.replace(/[\u30a1-\u30f6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60)
  );
}

function firstConsonant(value: string) {
  return value.match(consonantPattern)?.[0] ?? "";
}

function lastVowel(value: string) {
  return value.match(vowelPattern)?.[0] ?? "";
}

export type RomajiToken = {
  kana: string;
  romaji: string;
};

export function toRomajiTokens(input: string): RomajiToken[] {
  const text = kataToHira(input.trim());
  const tokens: RomajiToken[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === "っ") {
      const combo = comboMap[text.slice(i + 1, i + 3)];
      const next = combo ?? baseMap[text[i + 1]];
      tokens.push({
        kana: char,
        romaji: firstConsonant(next ?? ""),
      });
      continue;
    }

    if (char === "ー") {
      const previous = tokens[tokens.length - 1]?.romaji ?? "";
      tokens.push({
        kana: char,
        romaji: lastVowel(previous),
      });
      continue;
    }

    const combo = comboMap[text.slice(i, i + 2)];
    if (combo) {
      tokens.push({
        kana: text.slice(i, i + 2),
        romaji: combo,
      });
      i++;
      continue;
    }

    tokens.push({
      kana: char,
      romaji: baseMap[char] ?? char,
    });
  }

  return tokens;
}

export function toRomaji(input: string) {
  return toRomajiTokens(input)
    .map((token) => token.romaji)
    .join("");
}