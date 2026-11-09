# "Lower berth maanga, upper kyun mila?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Tumne lower berth maanga...", "तुमने लोअर बर्थ माँगा...", "lower berth", "y"),
                  ("mila UPPER!", "मिला अपर!", "UPPER", "r")]),
    (1.10, 0.35, [("Bagal wali aunty ko...", "बगल वाली आंटी को...", "aunty", "y"),
                  ("bina maange LOWER!", "बिना माँगे लोअर!", "LOWER", "g")]),
    (1.10, 0.35, [("Raaz: har coach me", "राज़: हर कोच में", "Raaz", "y"),
                  ("kuch lower reserved hain.", "कुछ लोअर रिज़र्व्ड हैं।", "reserved", "y")]),
    (1.12, 0.30, [("Seniors, 45 plus", "सीनियर्स, पैंतालीस प्लस", "45 plus", "y"),
                  ("auraton ke liye...", "औरतों के लिए...", "auraton", "y"),
                  ("automatic!", "ऑटोमैटिक!", "automatic", "g")]),
    (1.10, 0.40, [("Tumhari choice?", "तुम्हारी चॉइस?", "choice", "y"),
                  ("Bas 'agar khaali ho'!", "बस 'अगर ख़ाली हो'!", "khaali", "r")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("railway raaz...", "रेलवे राज़...", "railway", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
