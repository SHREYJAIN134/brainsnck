# "Chart ke baad bhi seat kaise milti hai?" — Hinglish explainer script.
# Each line: (speed, pause_after_seconds, [(caption_roman, tts_devanagari, keyword, colour), ...])
# colour: 'y' yellow (default), 'g' green, 'r' red, '' no keyword
LINES = [
    (1.10, 0.35, [("Tumhara ticket", "तुम्हारा टिकट", "ticket", "y"),
                  ("WAITING...", "वेटिंग...", "WAITING", "r"),
                  ("chart bana, CANCEL!", "चार्ट बना, कैंसल!", "CANCEL", "r")]),
    (1.10, 0.35, [("Train chalne me", "ट्रेन चलने में", "Train", "y"),
                  ("30 minute...", "तीस मिनट...", "30 minute", "y"),
                  ("dost ko CONFIRM seat!", "दोस्त को कन्फ़र्म सीट!", "CONFIRM", "g")]),
    (1.10, 0.35, [("Chart ke baad bhi", "चार्ट के बाद भी", "baad bhi", "y"),
                  ("seats KHAALI hoti hain.", "सीट्स ख़ाली होती हैं।", "KHAALI", "g")]),
    (1.10, 0.35, [("Railway unhe", "रेलवे उन्हें", "Railway", "y"),
                  ("current booking me", "करंट बुकिंग में", "current booking", "y"),
                  ("bechti hai.", "बेचती है।", "bechti", "g")]),
    (1.10, 0.40, [("App me", "ऐप में", "App", "y"),
                  ("chart vacancy dekho...", "चार्ट वेकेंसी देखो...", "chart vacancy", "y"),
                  ("seat lo!", "सीट लो!", "seat", "g")]),
    (1.10, 0.00, [("Aise aur", "ऐसे और", "", ""),
                  ("railway raaz...", "रेलवे राज़...", "railway", "y"),
                  ("follow karo!", "फ़ॉलो करो!", "follow", "g")]),
]
