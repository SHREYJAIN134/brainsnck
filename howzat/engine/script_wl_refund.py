# "Ticket confirm nahi hua, phir bhi paise kyun kate?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Tumhara WL ticket...", "तुम्हारा डब्लू एल टिकट...", "WL", "y"),
                  ("confirm nahi hua.", "कन्फर्म नहीं हुआ।", "nahi", "r")]),
    (1.10, 0.35, [("Phir bhi ₹60", "फिर भी साठ रुपये", "₹60", "r"),
                  ("KAT gaye!", "कट गए!", "KAT", "r")]),
    (1.10, 0.35, [("Chart bante hi", "चार्ट बनते ही", "Chart", "y"),
                  ("ticket khud cancel.", "टिकट खुद कैंसल।", "cancel", "r")]),
    (1.10, 0.35, [("Ye clerkage hai...", "ये क्लर्केज है...", "clerkage", "y"),
                  ("har passenger pe ₹60.", "हर पैसेंजर पे साठ।", "₹60", "r")]),
    (1.10, 0.35, [("IRCTC fee bhi", "आई आर सी टी सी फ़ीस भी", "fee", "y"),
                  ("wapas nahi.", "वापस नहीं।", "nahi", "r")]),
    (1.10, 0.40, [("3 saal me railway ne", "तीन साल में रेलवे ने", "3 saal", "y"),
                  ("aise ₹1,229 crore", "ऐसे बारह सौ उनतीस करोड़", "₹1,229", "r"),
                  ("kamaye!", "कमाए!", "kamaye", "y")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("railway raaz...", "रेलवे राज़...", "raaz", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
