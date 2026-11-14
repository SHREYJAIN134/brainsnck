# "Baarish me cab 3 guna mehngi kyun?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Baarish aayi...", "बारिश आई...", "Baarish", "y"),
                  ("₹450 wali cab,", "चार सौ पचास वाली कैब,", "₹450", "y"),
                  ("₹1,285 ki!", "बारह सौ पचासी की!", "₹1,285", "r")]),
    (1.10, 0.35, [("Ye ALGORITHM", "ये एल्गोरिदम", "ALGORITHM", "y"),
                  ("ka khel hai.", "का खेल है।", "khel", "y")]),
    (1.10, 0.35, [("Jaise 3,000 log", "जैसे तीन हज़ार लोग", "3,000", "y"),
                  ("cab maang rahe...", "कैब मांग रहे...", "maang", "y"),
                  ("driver sirf 600.", "ड्राइवर सिर्फ़ छह सौ।", "600", "r")]),
    (1.10, 0.25, [("Toh kiraya BADHA...", "तो किराया बढ़ा...", "BADHA", "r")]),
    (1.10, 0.35, [("taaki door ke", "ताकि दूर के", "door", "y"),
                  ("driver aayein!", "ड्राइवर आएं!", "driver", "g")]),
    (1.10, 0.40, [("Rate kuch sau", "रेट कुछ सौ", "Rate", "y"),
                  ("meter pe badalta hai...", "मीटर पे बदलता है...", "badalta", "y"),
                  ("aage chalo!", "आगे चलो!", "aage", "g")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("raaz ke liye...", "राज़ के लिए...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
