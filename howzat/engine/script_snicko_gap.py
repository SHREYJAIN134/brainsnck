# "Camera me gap, phir bhi edge kaise?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Camera me", "कैमरा में", "Camera", "y"),
                  ("bat-ball ke beech", "बैट बॉल के बीच", "bat-ball", "y"),
                  ("GAP...", "गैप...", "GAP", "g")]),
    (1.10, 0.35, [("phir bhi Gill ka", "फिर भी गिल का", "Gill", "y"),
                  ("review gaya! Kyun?", "रिव्यू गया! क्यों?", "review gaya!", "r")]),
    (1.10, 0.30, [("Stumps ka mic", "स्टंप्स का माइक", "mic", "y"),
                  ("har awaaz", "हर आवाज़", "awaaz", "y"),
                  ("pakadta hai.", "पकड़ता है।", "", "")]),
    (1.10, 0.35, [("Ball bat ke paas", "बॉल बैट के पास", "bat", "y"),
                  ("se guzri...", "से गुज़री...", "", ""),
                  ("usi frame pe spike!", "उसी फ्रेम पे स्पाइक!", "spike!", "r")]),
    (1.10, 0.40, [("Matlab pehle", "मतलब पहले", "pehle", "y"),
                  ("bat laga...", "बैट लगा...", "bat", "g"),
                  ("toh LBW nahi!", "तो एल बी डब्ल्यू नहीं!", "LBW nahi!", "g")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("raaz ke liye...", "राज़ के लिए...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
