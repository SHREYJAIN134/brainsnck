# "Shazam 5 second me gaana kaise pehchanta hai?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.12, 0.35, [("Shor me 5 second...", "शोर में फ़ाइव सेकंड...", "5 second", "y"),
                  ("Shazam ne gaana pakda!", "शज़ैम ने गाना पकड़ा!", "Shazam", "g")]),
    (1.10, 0.35, [("Wo gaana sunta nahi...", "वो गाना सुनता नहीं...", "nahi", "r"),
                  ("PHOTO banata hai!", "फ़ोटो बनाता है!", "PHOTO", "y")]),
    (1.12, 0.30, [("Sabse tez sur", "सबसे तेज़ सुर", "tez", "y"),
                  ("ban jaate taare.", "बन जाते तारे।", "taare", "y")]),
    (1.12, 0.30, [("Taaron ke jode", "तारों के जोड़े", "jode", "y"),
                  ("se banta code.", "से बनता कोड।", "code", "g")]),
    (1.10, 0.35, [("Laakhon gaanon se", "लाखों गानों से", "Laakhon", "y"),
                  ("milaan!", "मिलान!", "milaan", "g")]),
    (1.10, 0.40, [("Sirf 2% code bache...", "सिर्फ़ टू परसेंट कोड बचे...", "2%", "r"),
                  ("phir bhi match!", "फिर भी मैच!", "match", "g")]),
    (1.10, 0.00, [("Ye reel apne", "ये रील अपने", "", ""),
                  ("DJ dost ko bhejo!", "डीजे दोस्त को भेजो!", "DJ", "y")]),
]
