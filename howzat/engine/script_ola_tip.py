# "Ride se pehle tip? 10 lakh ka fine!" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Cab dhoondh rahe the...", "कैब ढूंढ रहे थे...", "Cab", "y"),
                  ("app bola:", "ऐप बोला:", "app", "y"),
                  ("tip do,", "टिप दो,", "tip", "r"),
                  ("jaldi milegi!", "जल्दी मिलेगी!", "jaldi", "y")]),
    (1.10, 0.35, [("Tip toh ride ke", "टिप तो राइड के", "Tip", "y"),
                  ("BAAD hoti hai!", "बाद होती है!", "BAAD", "g")]),
    (1.10, 0.35, [("Ola ne naam badla...", "ओला ने नाम बदला...", "naam", "y"),
                  ("tip se add-on!", "टिप से ऐड-ऑन!", "add-on", "r")]),
    (1.10, 0.35, [("Twist?", "ट्विस्ट?", "Twist", "y"),
                  ("Add-on wali rides", "ऐड-ऑन वाली राइड्स", "Add-on", "y"),
                  ("KAM accept hui!", "कम एक्सेप्ट हुई!", "KAM", "r")]),
    (1.10, 0.40, [("Sarkar ne thoka", "सरकार ने ठोका", "Sarkar", "y"),
                  ("10 lakh ka fine.", "दस लाख का फ़ाइन।", "10 lakh", "r")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("raaz ke liye...", "राज़ के लिए...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
