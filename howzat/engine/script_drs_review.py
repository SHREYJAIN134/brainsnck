# "Bumrah bola HIGH hai... phir bhi REVIEW kyun?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.30, [("Bumrah bola,", "बुमराह बोला,", "Bumrah", "y"),
                  ("HIGH hai...", "हाई है...", "HIGH", "r"),
                  ("par Gill ne", "पर गिल ने", "Gill", "y"),
                  ("review le liya!", "रिव्यू ले लिया!", "review", "g")]),
    (1.10, 0.35, [("Review gaya...", "रिव्यू गया...", "gaya...", "r"),
                  ("Blundell ne", "ब्लंडेल ने", "Blundell", "y"),
                  ("fifty maari.", "फ़िफ़्टी मारी।", "fifty", "g")]),
    (1.10, 0.30, [("Not out ke baad", "नॉट आउट के बाद", "Not out", "y"),
                  ("ghadi chalu...", "घड़ी चालू...", "ghadi", "y"),
                  ("sirf 15 second!", "सिर्फ़ फ़िफ़्टीन सेकंड!", "15", "r")]),
    (1.10, 0.30, [("Bowler, keeper", "बॉलर, कीपर", "keeper", "y"),
                  ("salaah dete...", "सलाह देते...", "salaah", "y"),
                  ("faisla sirf", "फ़ैसला सिर्फ़", "faisla", "y"),
                  ("captain ka.", "कैप्टन का।", "captain", "g")]),
    (1.10, 0.40, [("Galat nikla?", "ग़लत निकला?", "Galat", "r"),
                  ("Ek review kam.", "एक रिव्यू कम।", "kam.", "r")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("raaz ke liye...", "राज़ के लिए...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
