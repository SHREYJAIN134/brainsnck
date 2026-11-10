# "Tumhari train khadi, Vande Bharat aage kyun nikli?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Tumhari train", "तुम्हारी ट्रेन", "train", "y"),
                  ("40 minute se khadi...", "चालीस मिनट से खड़ी...", "40 minute", "r"),
                  ("Vande Bharat nikal gayi!", "वंदे भारत निकल गई!", "Vande Bharat", "g")]),
    (1.10, 0.35, [("Control room me", "कंट्रोल रूम में", "Control room", "y"),
                  ("har train ki RANKING hai.", "हर ट्रेन की रैंकिंग है।", "RANKING", "y")]),
    (1.10, 0.35, [("Vande Bharat", "वंदे भारत", "Vande Bharat", "y"),
                  ("sabse upar.", "सबसे ऊपर।", "upar", "g")]),
    (1.12, 0.30, [("Upar wali pehle...", "ऊपर वाली पहले...", "pehle", "g"),
                  ("tumhari side me wait.", "तुम्हारी साइड में वेट।", "wait", "r")]),
    (1.10, 0.40, [("Vande Bharat ko", "वंदे भारत को", "Vande Bharat", "y"),
                  ("2 minute roka...", "दो मिनट रोका...", "2 minute", "y"),
                  ("controller SUSPEND!", "कंट्रोलर सस्पेंड!", "SUSPEND", "r")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("railway raaz...", "रेलवे राज़...", "railway", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
