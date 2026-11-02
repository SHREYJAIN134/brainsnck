# "Hawk-Eye ko kaise pata ball stumps pe lagti?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.12, 0.30, [("Ball pad pe ruki...", "बॉल पैड पे रुकी...", "pad", "y"),
                  ("par Hawk-Eye bolta hai:", "पर हॉक-आई बोलता है:", "Hawk-Eye", "y"),
                  ("stumps pe lagti!", "स्टंप्स पे लगती!", "stumps", "r")]),
    (1.05, 0.40, [("Kaise?", "कैसे?", "Kaise", "y")]),
    (1.12, 0.30, [("6 camera,", "छह कैमरा,", "6 camera", "y"),
                  ("har second 340 photo.", "हर सेकंड तीन सौ चालीस फ़ोटो।", "340", "y")]),
    (1.12, 0.30, [("Sab jodo...", "सब जोड़ो...", "jodo", "y"),
                  ("ball ka 3D raasta", "बॉल का थ्री डी रास्ता", "3D", "y"),
                  ("ready!", "रेडी!", "ready", "g")]),
    (1.12, 0.30, [("Pad ke baad?", "पैड के बाद?", "Pad", "y"),
                  ("Raasta AAGE badha diya!", "रास्ता आगे बढ़ा दिया!", "AAGE", "y")]),
    (1.10, 0.45, [("Average galti?", "एवरेज ग़लती?", "galti", "y"),
                  ("Sirf 3.6 millimetre!", "सिर्फ़ थ्री पॉइंट सिक्स मिलीमीटर!", "3.6", "g")]),
    (1.10, 0.00, [("Ye reel DRS gawaane", "ये रील डीआरएस गंवाने", "DRS", "y"),
                  ("wale dost ko bhejo!", "वाले दोस्त को भेजो!", "dost", "y")]),
]
