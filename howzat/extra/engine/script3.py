# "Muscle kaise banta hai?" — Howzat-style Hinglish explainer (~35 s).
# chunk: (caption, spoken or None, keyword, colour)  colour: y yellow, r red, g green
LINES = [
    [("Muscle gym me nahi...", None, "gym me nahi", "r"), ("gym ke BAAD banta hai!", None, "BAAD", "y")],
    [("Heavy set me", None, "Heavy set", "y"), ("fibres pe tension aata hai.", None, "tension", "r")],
    [("Andar ke sensors", None, "sensors", "y"), ("isse alarm samajhte hain,", None, "alarm", "r"),
     ("aur mTOR switch", "aur M-TOR switch", "mTOR", "g"), ("on ho jaata hai.", None, "on", "g")],
    [("Teen ghante baad", None, "Teen ghante", "y"), ("protein banne ki speed", None, "speed", "y"),
     ("double se zyada,", None, "double", "g"), ("aur do din tak upar!", None, "do din", "g")],
    [("Isi time body", None, "Isi time", "y"), ("protein jod ke", None, "protein", "g"), ("fibres mote karti hai.", None, "mote", "g")],
    [("Roz har kilo", None, "har kilo", "y"), ("body weight pe", None, "body weight", "y"),
     ("1.6 gram protein khao.", "one point six gram protein khao.", "1.6 gram", "g")],
    [("Growth chalu rakhni hai?", None, "Growth", "y"), ("Har hafte thoda zyada:", None, "Har hafte", "y"),
     ("ek rep", None, "rep", "g"), ("ya thoda weight,", None, "weight", "g"), ("dono chalega.", None, "dono", "y")],
    [("Ye reel us dost ko bhejo", None, "dost", "y"), ("jo saal bhar", None, "saal bhar", "r"),
     ("same weight uthata hai.", None, "same weight", "r")],
]


def chunks():
    out = []
    for li, line in enumerate(LINES):
        for cap, say, kw, col in line:
            out.append({'line': li, 'text': cap, 'say': say or cap, 'kw': kw, 'col': col})
    return out
