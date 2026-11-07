# "Digital arrest scam kaise chalta hai?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Video call pe", "वीडियो कॉल पे", "Video call", "y"),
                  ("CBI officer...", "सीबीआई ऑफ़िसर...", "CBI", "y"),
                  ("aap ARREST ho!", "आप अरेस्ट हो!", "ARREST", "r")]),
    (1.10, 0.35, [("Is scam ne", "इस स्कैम ने", "scam", "r"),
                  ("4 hazaar crore loote!", "चार हज़ार करोड़ लूटे!", "4 hazaar crore", "y")]),
    (1.12, 0.30, [("Pehle darr:", "पहले डर:", "darr", "r"),
                  ("tumhare parcel me drugs!", "तुम्हारे पार्सल में ड्रग्स!", "drugs", "r")]),
    (1.12, 0.30, [("Phir nakli thana,", "फिर नकली थाना,", "nakli thana", "y"),
                  ("nakli warrant.", "नकली वारंट।", "warrant", "y")]),
    (1.10, 0.40, [("Chup raho...", "चुप रहो...", "Chup", "y"),
                  ("aur paise bhejo!", "और पैसे भेजो!", "paise", "r")]),
    (1.10, 0.40, [("Sach: police video pe", "सच: पुलिस वीडियो पे", "Sach", "g"),
                  ("arrest nahi karti!", "अरेस्ट नहीं करती!", "nahi", "g")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("raaz ke liye...", "राज़ के लिए...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
