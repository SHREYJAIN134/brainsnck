# "Stumps pe lagi, phir bhi NOT OUT kaise?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.30, [("DRS me ball", "डी आर एस में बॉल", "DRS", "y"),
                  ("stumps ko", "स्टंप्स को", "stumps", "y"),
                  ("CHHOO rahi thi...", "छू रही थी...", "CHHOO", "g")]),
    (1.10, 0.35, [("phir bhi", "फिर भी", "", ""),
                  ("NOT OUT! Kyun?", "नॉट आउट! क्यों?", "NOT OUT!", "r")]),
    (1.10, 0.30, [("Pad ke baad", "पैड के बाद", "Pad", "y"),
                  ("ka raasta...", "का रास्ता...", "raasta", "y"),
                  ("sirf ANDAAZA hai.", "सिर्फ़ अंदाज़ा है।", "ANDAAZA", "r")]),
    (1.10, 0.30, [("Isliye aadhi", "इसलिए आधी", "aadhi", "y"),
                  ("se zyada ball", "से ज़्यादा बॉल", "zyada", "y"),
                  ("stumps pe chahiye.", "स्टंप्स पे चाहिए।", "stumps", "g")]),
    (1.10, 0.40, [("Usse kam?", "उससे कम?", "kam?", "r"),
                  ("Umpire ka faisla", "अंपायर का फ़ैसला", "Umpire", "y"),
                  ("hi chalega!", "ही चलेगा!", "chalega!", "g")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("raaz ke liye...", "राज़ के लिए...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
