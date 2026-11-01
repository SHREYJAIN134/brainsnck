# "UPI pal bhar me paise kaise bhejta hai?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.12, 0.30, [("October me har second...", "अक्टूबर में हर सेकंड...", "har second", "y"),
                  ("saadhe 9 hazaar", "साढ़े नौ हज़ार", "9 hazaar", "y"),
                  ("UPI payments!", "यूपीआई पेमेंट्स!", "UPI", "y")]),
    (1.05, 0.45, [("Itni jaldi kaise?", "इतनी जल्दी कैसे?", "kaise", "y")]),
    (1.12, 0.30, [("Pay dabaya,", "पे दबाया,", "Pay", "y"),
                  ("message NPCI gaya.", "मैसेज एनपीसीआई गया।", "NPCI", "y")]),
    (1.12, 0.30, [("NPCI ne bank se poocha:", "एनपीसीआई ने बैंक से पूछा:", "bank", "y"),
                  ("paise hain?", "पैसे हैं?", "paise", "y")]),
    (1.12, 0.30, [("Bank ne PIN check karke", "बैंक ने पिन चेक करके", "PIN", "y"),
                  ("kaat liye.", "काट लिए।", "kaat", "r")]),
    (1.12, 0.45, [("Dost ke bank ko bola:", "दोस्त के बैंक को बोला:", "Dost ke bank", "y"),
                  ("credit karo!", "क्रेडिट करो!", "credit", "g")]),
    (1.10, 0.00, [("Ye reel udhaar wale", "ये रील उधार वाले", "udhaar", "y"),
                  ("dost ko bhejo!", "दोस्त को भेजो!", "dost", "y")]),
]
