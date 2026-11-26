# "Sale me 50% OFF... par kal bhi yahi daam?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Sale me", "सेल में", "Sale", "y"),
                  ("50% OFF...", "फ़िफ़्टी परसेंट ऑफ़...", "50%", "g"),
                  ("par kal bhi", "पर कल भी", "kal", "y"),
                  ("daam yahi tha!", "दाम यही था!", "yahi", "r")]),
    (1.10, 0.30, [("Trick?", "ट्रिक?", "Trick", "y"),
                  ("Sale se pehle", "सेल से पहले", "pehle", "y"),
                  ("daam BADHAO...", "दाम बढ़ाओ...", "BADHAO", "r")]),
    (1.10, 0.35, [("phir usi pe", "फिर उसी पे", "", ""),
                  ("bada discount!", "बड़ा डिस्काउंट!", "discount", "r")]),
    (1.10, 0.25, [("Ek January se", "एक जनवरी से", "January", "y"),
                  ("naya rule:", "नया रूल:", "rule", "g")]),
    (1.10, 0.40, [("pichhle tees din ka", "पिछले तीस दिन का", "tees", "y"),
                  ("sabse kam daam", "सबसे कम दाम", "kam", "g"),
                  ("dikhana padega!", "दिखाना पड़ेगा!", "dikhana", "g")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("raaz ke liye...", "राज़ के लिए...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
