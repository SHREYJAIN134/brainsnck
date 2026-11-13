# "Shaadi ka card khola, account khaali kaise?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Dost ke number se", "दोस्त के नंबर से", "Dost", "y"),
                  ("SHAADI card aaya...", "शादी कार्ड आया...", "SHAADI", "y")]),
    (1.10, 0.35, [("Aunty ne khola...", "आंटी ने खोला...", "khola", "y"),
                  ("2.6 LAKH gaye!", "दो पॉइंट छह लाख गए!", "2.6 LAKH", "r")]),
    (1.10, 0.35, [("Wo card nahi,", "वो कार्ड नहीं,", "nahi", "r"),
                  ("APP tha.", "ऐप था।", "APP", "y")]),
    (1.10, 0.35, [("Permission di...", "परमिशन दी...", "Permission", "y"),
                  ("OTP padh liye!", "ओटीपी पढ़ लिए!", "OTP", "r")]),
    (1.10, 0.35, [("Ab aunty ke", "अब आंटी के", "aunty", "y"),
                  ("number se", "नंबर से", "number", "y"),
                  ("sabko card!", "सबको कार्ड!", "sabko", "r")]),
    (1.10, 0.40, [("Asli card:", "असली कार्ड:", "Asli", "g"),
                  ("PDF ya photo.", "पीडीएफ़ या फ़ोटो।", "PDF", "g"),
                  ("APK? Kabhi nahi!", "एपीके? कभी नहीं!", "APK", "r")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("raaz ke liye...", "राज़ के लिए...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
