# "Tatkal 1 minute me full kyun ho jaata hai?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.12, 0.35, [("Das baje Tatkal khula...", "दस बजे तत्काल खुला...", "Tatkal", "y"),
                  ("ek minute me WAITING!", "एक मिनट में वेटिंग!", "WAITING", "r")]),
    (1.10, 0.35, [("Aadhe se zyada koshishein...", "आधे से ज़्यादा कोशिशें...", "Aadhe", "y"),
                  ("bots ki thi!", "बॉट्स की थीं!", "bots", "r")]),
    (1.12, 0.30, [("Form pehle se bhara,", "फ़ॉर्म पहले से भरा,", "Form", "y"),
                  ("captcha khud solve.", "कैप्चा ख़ुद सॉल्व।", "captcha", "y")]),
    (1.10, 0.35, [("Kayi IDs ek saath!", "कई आईडीज़ एक साथ!", "IDs", "y")]),
    (1.10, 0.40, [("Tum type karte raho...", "तुम टाइप करते रहो...", "type", "y"),
                  ("seat gayi!", "सीट गई!", "gayi", "r")]),
    (1.10, 0.40, [("Ab Aadhaar check,", "अब आधार चेक,", "Aadhaar", "g"),
                  ("anti-bot shield!", "एंटी-बॉट शील्ड!", "shield", "g")]),
    (1.10, 0.00, [("Ye reel Tatkal me", "ये रील तत्काल में", "Tatkal", "y"),
                  ("haare dost ko bhejo!", "हारे दोस्त को भेजो!", "dost", "y")]),
]
