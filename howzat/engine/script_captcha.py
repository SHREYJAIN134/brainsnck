# "'I'm not a robot' tick se kaise pata chalta hai tum robot nahi?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.12, 0.30, [("\"I'm not a robot\" wala tick...", "आई एम नॉट अ रोबोट वाला टिक...", "tick", "y"),
                  ("asli test hai hi nahi!", "असली टेस्ट है ही नहीं!", "nahi", "r")]),
    (1.05, 0.40, [("Kaise?", "कैसे?", "Kaise", "y")]),
    (1.12, 0.30, [("Click se pehle", "क्लिक से पहले", "pehle", "y"),
                  ("mouse ki chaal dekhi.", "माउस की चाल देखी।", "mouse", "y")]),
    (1.12, 0.30, [("Insaan ka cursor tedha...", "इंसान का कर्सर टेढ़ा...", "tedha", "g"),
                  ("bot ka SEEDHA!", "बॉट का सीधा!", "SEEDHA", "r")]),
    (1.12, 0.30, [("Plus IP aur cookies.", "प्लस आई पी और कुकीज़।", "cookies", "y")]),
    (1.10, 0.45, [("Shaq hua?", "शक हुआ?", "Shaq", "y"),
                  ("Tab traffic light", "तब ट्रैफ़िक लाइट", "traffic light", "y"),
                  ("wali photos!", "वाली फ़ोटोज़!", "photos", "y")]),
    (1.10, 0.00, [("Ye reel CAPTCHA me", "ये रील कैप्चा में", "CAPTCHA", "y"),
                  ("atke dost ko bhejo!", "अटके दोस्त को भेजो!", "dost", "y")]),
]
