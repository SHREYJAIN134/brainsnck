# "Chain kheenchi, RPF ko coach kaise pata?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Train beech me ruki...", "ट्रेन बीच में रुकी...", "ruki", "y"),
                  ("kisi ne CHAIN", "किसी ने चेन", "CHAIN", "r"),
                  ("kheenchi!", "खींची!", "kheenchi", "r")]),
    (1.10, 0.35, [("RPF seedha", "आर पी एफ सीधा", "RPF", "y"),
                  ("usi coach pe.", "उसी कोच पे।", "coach", "y"),
                  ("Kaise?", "कैसे?", "Kaise", "g")]),
    (1.10, 0.25, [("Chain valve kholti hai,", "चेन वाल्व खोलती है,", "valve", "y"),
                  ("brake ki hawa", "ब्रेक की हवा", "hawa", "y"),
                  ("nikalti hai.", "निकलती है।", "nikalti", "y")]),
    (1.10, 0.35, [("Pressure gira,", "प्रेशर गिरा,", "Pressure", "r"),
                  ("train ruki.", "ट्रेन रुकी।", "ruki", "g")]),
    (1.10, 0.35, [("Hawa ki awaaz...", "हवा की आवाज़...", "awaaz", "y"),
                  ("usi coach se!", "उसी कोच से!", "coach", "g")]),
    (1.10, 0.40, [("Bina wajah?", "बिना वजह?", "wajah", "y"),
                  ("Ek saal tak", "एक साल तक", "saal", "y"),
                  ("JAIL!", "जेल!", "JAIL", "r")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("railway raaz...", "रेलवे राज़...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
