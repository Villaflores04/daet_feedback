/** Small word-list check: is this question written in Filipino/Tagalog (including mixed "Taglish") or in English? */
const FIL = new Set(("ano ang mga ng sa na ba po opo paano bakit saan kailan mayroon meron wala ko mo namin natin ito iyon iyan para pero kasi dapat gusto pwede puwede anong ilan ilang magandang salamat lang naman din rin yung kung ay si ni kay sino alin gawin ginawa mungkahi rekomendasyon suriin pakisuri sentimyento puna bisita lugar pakisulat isulat buod aling dito doon sila kayo tayo kami siya nila ninyo niyo mo akin amin atin hindi huwag pakiusap tulong mas pinaka lahat marami kaunti konti maganda pangit masama mabuti reklamo nakaraan linggo buwan ngayon kahapon bukas").split(" "));

export function detectLanguage(text: string): "fil" | "en" {
  const words = text.toLowerCase().match(/[a-zñ']+/g) ?? [];
  if (!words.length) return "en";
  const hits = words.filter((w) => FIL.has(w)).length;
  return hits >= 2 || (words.length <= 4 && hits >= 1) || hits / words.length >= 0.25 ? "fil" : "en";
}
