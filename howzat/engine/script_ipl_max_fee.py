# "Boli 25 crore, player ko sirf 18 kyun?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Boli lagi", "बोली लगी", "Boli", "y"),
                  ("25 CRORE...", "पच्चीस करोड़...", "25 CRORE", "y")]),
    (1.10, 0.35, [("par player ko", "पर प्लेयर को", "player", "y"),
                  ("sirf 18!", "सिर्फ़ अठारह!", "18", "r")]),
    (1.10, 0.30, [("Videshi star", "विदेशी स्टार", "Videshi", "y"),
                  ("mega auction", "मेगा ऑक्शन", "mega", "y"),
                  ("skip karte the...", "स्किप करते थे...", "skip", "r")]),
    (1.10, 0.35, [("mini auction", "मिनी ऑक्शन", "mini", "y"),
                  ("me jackpot:", "में जैकपॉट:", "jackpot", "g"),
                  ("Starc ko", "स्टार्क को", "Starc", "y"),
                  ("24.75 crore!", "चौबीस पॉइंट सात पांच करोड़!", "24.75", "y")]),
    (1.10, 0.35, [("Isliye rule:", "इसलिए रूल:", "rule", "y"),
                  ("videshi ko", "विदेशी को", "videshi", "y"),
                  ("MAX 18 crore.", "मैक्स अठारह करोड़।", "MAX 18", "g")]),
    (1.10, 0.40, [("Baaki 7?", "बाकी सात?", "7", "y"),
                  ("BCCI ke paas,", "बीसीसीआई के पास,", "BCCI", "r"),
                  ("welfare me.", "वेलफेयर में।", "welfare", "g")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("raaz ke liye...", "राज़ के लिए...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
