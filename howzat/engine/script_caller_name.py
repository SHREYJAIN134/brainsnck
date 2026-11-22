# "Truecaller nahi, phir bhi caller ka naam kaise?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Unknown number...", "अननोन नंबर...", "Unknown", "y"),
                  ("screen pe naam:", "स्क्रीन पे नाम:", "naam", "y"),
                  ("Ramesh!", "रमेश!", "Ramesh", "g")]),
    (1.10, 0.35, [("Truecaller bhi nahi.", "ट्रूकॉलर भी नहीं।", "Truecaller", "r"),
                  ("Naam kisne bheja?", "नाम किसने भेजा?", "kisne", "y")]),
    (1.10, 0.35, [("Naya rule:", "नया रूल:", "rule", "y"),
                  ("CNAP.", "सी-नैप।", "CNAP", "g")]),
    (1.10, 0.25, [("Telecom company", "टेलीकॉम कंपनी", "Telecom", "y"),
                  ("SIM ke record se", "सिम के रिकॉर्ड से", "SIM", "y"),
                  ("naam uthati hai,", "नाम उठाती है,", "naam", "y")]),
    (1.10, 0.35, [("number ke saath", "नंबर के साथ", "number", "y"),
                  ("bhej deti hai.", "भेज देती है।", "bhej", "g")]),
    (1.10, 0.40, [("Bank ka call,", "बैंक का कॉल,", "Bank", "y"),
                  ("naam kisi aadmi ka?", "नाम किसी आदमी का?", "aadmi", "r"),
                  ("SAVDHAAN!", "सावधान!", "SAVDHAAN", "r")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("raaz ke liye...", "राज़ के लिए...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
