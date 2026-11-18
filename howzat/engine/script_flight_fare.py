# "Same seat, flight 12 guna mehngi kaise?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Patna-Delhi flight...", "पटना दिल्ली फ्लाइट...", "flight", "y"),
                  ("aam din ₹6,000.", "आम दिन छह हज़ार।", "₹6,000", "g"),
                  ("Shaadi season me?", "शादी सीज़न में?", "Shaadi", "y"),
                  ("₹72,000!", "बहत्तर हज़ार!", "₹72,000", "r")]),
    (1.10, 0.35, [("Seat wahi...", "सीट वही...", "Seat", "y"),
                  ("phir itna kyun?", "फिर इतना क्यों?", "kyun", "r")]),
    (1.10, 0.35, [("Seats BUCKETS me", "सीट्स बकेट्स में", "BUCKETS", "y"),
                  ("bikti hain.", "बिकती हैं।", "", "")]),
    (1.10, 0.35, [("Sasta bucket bika...", "सस्ता बकेट बिका...", "Sasta", "g"),
                  ("agla mehenga khula.", "अगला महंगा खुला।", "mehenga", "r")]),
    (1.10, 0.35, [("Bheed badhi,", "भीड़ बढ़ी,", "Bheed", "y"),
                  ("software ne", "सॉफ्टवेयर ने", "software", "y"),
                  ("daam badhaya!", "दाम बढ़ाया!", "daam", "r")]),
    (1.10, 0.40, [("Jaldi book karo!", "जल्दी बुक करो!", "Jaldi", "g")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("raaz ke liye...", "राज़ के लिए...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
