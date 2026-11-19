# "Kohre me driver ko signal kaise pata chalta hai?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Kohre me driver ko", "कोहरे में ड्राइवर को", "Kohre", "y"),
                  ("kuch nahi dikhta...", "कुछ नहीं दिखता...", "nahi", "r"),
                  ("par train daud rahi!", "पर ट्रेन दौड़ रही!", "daud", "y")]),
    (1.10, 0.35, [("Engine me GPS dabba...", "इंजन में जी पी एस डब्बा...", "GPS", "y"),
                  ("Fog Pass.", "फ़ॉग पास।", "Fog Pass", "g")]),
    (1.10, 0.35, [("Har signal usme", "हर सिग्नल उसमें", "signal", "y"),
                  ("pehle se save.", "पहले से सेव।", "save", "g")]),
    (1.10, 0.35, [("500 meter pehle bolta:", "पाँच सौ मीटर पहले बोलता:", "500 meter", "y"),
                  ("signal aa raha!", "सिग्नल आ रहा!", "signal", "g")]),
    (1.10, 0.40, [("Laal-hara aankh se dikhe...", "लाल हरा आँख से दिखे...", "Laal-hara", "r"),
                  ("isliye 75 max,", "इसलिए सेवेंटी फ़ाइव मैक्स,", "75", "r"),
                  ("train LATE!", "ट्रेन लेट!", "LATE", "r")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("railway raaz...", "रेलवे राज़...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
