# "Scammer videsh me... par WhatsApp Indian number se kaise?" — Hinglish explainer script (SIM binding).
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Scammer videsh me...", "स्कैमर विदेश में...", "videsh", "r"),
                  ("par WhatsApp call", "पर व्हाट्सऐप कॉल", "WhatsApp", "g"),
                  ("Indian number se!", "इंडियन नंबर से!", "Indian", "y")]),
    (1.10, 0.30, [("Kaise? Indian SIM pe", "कैसे? इंडियन सिम पे", "SIM", "y"),
                  ("ek baar OTP...", "एक बार ओटीपी...", "OTP", "y")]),
    (1.10, 0.35, [("WhatsApp chalu,", "व्हाट्सऐप चालू,", "chalu", "g"),
                  ("SIM phenko...", "सिम फेंको...", "phenko", "r"),
                  ("app chalta rehta!", "ऐप चलता रहता!", "chalta", "g")]),
    (1.10, 0.35, [("Ek January se", "एक जनवरी से", "January", "y"),
                  ("naya rule:", "नया रूल:", "rule", "y"),
                  ("SIM binding.", "सिम बाइंडिंग।", "binding", "g")]),
    (1.10, 0.40, [("Phone me", "फ़ोन में", "", ""),
                  ("wo SIM nahi?", "वो सिम नहीं?", "nahi", "r"),
                  ("Toh WhatsApp BAND!", "तो व्हाट्सऐप बंद!", "BAND", "r")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("raaz ke liye...", "राज़ के लिए...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
