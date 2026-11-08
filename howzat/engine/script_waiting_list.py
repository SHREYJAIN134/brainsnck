# "Kam waiting wala ticket confirm kyun nahi hua?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Chhath ki train...", "छठ की ट्रेन...", "Chhath", "y"),
                  ("tumhara WL 12 atka.", "तुम्हारा डब्ल्यू एल बारह अटका।", "WL 12", "r")]),
    (1.10, 0.35, [("Dost ka WL 90...", "दोस्त का डब्ल्यू एल नब्बे...", "WL 90", "y"),
                  ("CONFIRM!", "कन्फ़र्म!", "CONFIRM", "g")]),
    (1.10, 0.35, [("Raaz: waiting list", "राज़: वेटिंग लिस्ट", "Raaz", "y"),
                  ("ek nahi, kai hain.", "एक नहीं, कई हैं।", "kai", "y")]),
    (1.12, 0.30, [("Pehle station ki list...", "पहले स्टेशन की लिस्ट...", "Pehle station", "y"),
                  ("sabse badi.", "सबसे बड़ी।", "badi", "g")]),
    (1.12, 0.30, [("Beech ke station ki...", "बीच के स्टेशन की...", "Beech", "y"),
                  ("bahut chhoti.", "बहुत छोटी।", "chhoti", "r")]),
    (1.10, 0.40, [("Number nahi...", "नंबर नहीं...", "Number", "y"),
                  ("list ka TYPE dekho!", "लिस्ट का टाइप देखो!", "TYPE", "g")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("raaz ke liye...", "राज़ के लिए...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
