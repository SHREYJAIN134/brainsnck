# "Tumhe WAITING, dalal ke paas CONFIRM kaise?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Ticket WAITING...", "टिकट वेटिंग...", "WAITING", "r"),
                  ("kuli bola:", "कुली बोला:", "kuli", "y"),
                  ("confirm chahiye?", "कन्फ़र्म चाहिए?", "confirm", "g"),
                  ("500 extra!", "पाँच सौ एक्स्ट्रा!", "500", "r")]),
    (1.10, 0.35, [("Ye ticket aaya", "ये टिकट आया", "ticket", "y"),
                  ("kahan se?", "कहाँ से?", "kahan", "g")]),
    (1.10, 0.30, [("Booking clerk", "बुकिंग क्लर्क", "clerk", "r"),
                  ("khud kaat", "खुद काट", "khud", "y"),
                  ("raha tha!", "रहा था!", "", "")]),
    (1.10, 0.30, [("Master ji ne", "मास्टर जी ने", "Master", "y"),
                  ("Aadhaar ke bahane", "आधार के बहाने", "Aadhaar", "y"),
                  ("phone liya...", "फ़ोन लिया...", "phone", "y"),
                  ("IRCTC ID", "आई आर सी टी सी आई डी", "ID", "r"),
                  ("bana li!", "बना ली!", "bana", "r")]),
    (1.10, 0.40, [("RPF ne pakda.", "आर पी एफ ने पकड़ा।", "pakda", "g"),
                  ("Saza?", "सज़ा?", "Saza", "y"),
                  ("Teen saal tak!", "तीन साल तक!", "saal", "r")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("railway raaz...", "रेलवे राज़...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
