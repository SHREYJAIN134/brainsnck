# Full squat vs half squat (Kubo et al. 2019), Hinglish. Caption chunks per line, in spoken order.
# A chunk is "caption" or ("caption", "spoken words") when the caption shows digits.
LINES = [
    ["Full squat...", "ya half squat?", "Glutes bade karne ke liye", "ASLI kaam", "kaunsa karta hai?"],
    ["Zyada tar log", "parallel tak hi jaate hain...", "ya usse bhi upar", "ruk jaate hain.", "Toh chalo dekhte hain",
     "research kya kehti hai."],
    ["Squat se uthte waqt", "hip ko seedha karne ka kaam", "do muscles bhi karte hain...", "tumhare glutes,",
     "aur tumhare adductors,", "yaani inner thigh", "ke bade muscles."],
    ["Jitna neeche baithoge,", "hip utna zyada mudega...", "aur ye muscles", "weight ke neeche", "utna zyada stretch honge."],
    ["Quads ka kaam", "zyada tar knee pe hota hai.", "Toh theory kehti hai...", "depth ka sabse zyada fayda",
     "hip muscles ko", "milna chahiye."],
    ["Par kya sach me", "growth me farak padta hai?"],
    ["Researchers ne", "test kiya.", ("17 untrained", "Seventeen untrained"), "young ladke."],
    ["Ek group ne", "poora neeche tak", "squat kiya...", ("knee pe lagbhag", "knee pe lagbhag"), ("140° tak.", "one forty degree tak."),
     "Doosra group", ("90° pe ruk gaya.", "ninety degree pe ruk gaya."), "Yaani half squat."],
    ["Hafte me do baar...", "das hafte tak.", "Phir MRI se", "thigh ke har muscle", "ko naapa."],
    ["Glutes:", "full squat se", ("+6.7%...", "plus six point seven percent..."), "aur half squat se",
     ("sirf 2.2%.", "sirf two point two."), "Yaani TEEN guna", "growth."],
    ["Adductors:", ("6.2%...", "six point two percent..."), ("versus 2.7%.", "versus two point seven."), "Double se bhi zyada."],
    ["Aur quads?", ("4.9%...", "Four point nine..."), ("versus 4.6%.", "versus four point six."), "Lagbhag SAME."],
    ["Jo muscle", "knee pe kaam karta hai,", "usse depth se", "koi farak nahi pada.", "Jo hip pe kaam karte hain...",
     "unhe pada."],
    ["Par poori kahani", "ye nahi hai.", "Ye ek chhoti study hai,", "beginners pe,", "sirf das hafte ki.",
     "Aur hamstrings me", "dono group me", "na ke barabar", "badlaav aaya."],
    ["Toh agar glutes", "badhane hain...", "toh achhe form ke saath", "jitna neeche ja sako,", "utna jao.",
     "Half squat", "bekaar nahi hai...", "bas usse apna", "main squat mat banao."],
    ["Sach batao...", "tum kitna neeche", "jaate ho?", "Ye reel us dost ko bhejo", "jo half squat karke",
     "leg day khatam kar deta hai."],
]


def chunks():
    out = []
    for li, line in enumerate(LINES):
        for c in line:
            cap, say = (c, c) if isinstance(c, str) else c
            out.append({'line': li, 'text': cap, 'say': say})
    return out
