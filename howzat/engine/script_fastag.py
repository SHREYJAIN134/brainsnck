# "FASTag se bina ruke toll kaise kat jaata hai?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Jaipur highway pe", "जयपुर हाईवे पे", "Jaipur", "y"),
                  ("toll booth gayab!", "टोल बूथ ग़ायब!", "gayab", "r")]),
    (1.12, 0.35, [("Full speed...", "फुल स्पीड...", "Full speed", "y"),
                  ("phir bhi paise", "फिर भी पैसे", "", ""),
                  ("kat gaye!", "कट गए!", "kat gaye", "r")]),
    (1.10, 0.35, [("Raaz? FASTag me", "राज़? फ़ास्टैग में", "FASTag", "y"),
                  ("BATTERY hi nahi!", "बैटरी ही नहीं!", "BATTERY", "r")]),
    (1.12, 0.30, [("Upar ka reader", "ऊपर का रीडर", "reader", "y"),
                  ("radio waves phenkta.", "रेडियो वेव्स फेंकता।", "radio waves", "y")]),
    (1.12, 0.30, [("Usi energy se", "उसी एनर्जी से", "energy", "y"),
                  ("tag jaagta,", "टैग जागता,", "jaagta", "y"),
                  ("ID bolta!", "आईडी बोलता!", "ID", "g")]),
    (1.10, 0.40, [("ID se account mila...", "आईडी से अकाउंट मिला...", "account", "y"),
                  ("paise kat!", "पैसे कट!", "kat", "g")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("raaz ke liye...", "राज़ के लिए...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
