// Har answer = wahi JSON jo baad mein AI likhega. Abhi Claude ne is session mein haath se likha hai.
// els: board par kya-kya hai (order = upar-neeche ki parat). steps: kya bolna hai + us waqt kya karna hai.
window.ANSWERS = [
{
  q: "How does a rainbow form?",
  els: {
    sun:   "circle 110 110 45 f=#ffd23f c=#e09f00",
    cloud: "path f=#e3eaf2 c=#7a8899 | M260 110 C238 110 236 80 262 76 C268 50 306 46 318 66 C332 46 372 52 372 76 C398 76 402 110 380 110 Z",
    d1: "path f=#8fd0ff c=#2f7fd6 w=3 | M290 128 C296 138 299 143 299 148 A9 9 0 0 1 281 148 C281 143 284 138 290 128 Z",
    d2: "path f=#8fd0ff c=#2f7fd6 w=3 | M330 142 C336 152 339 157 339 162 A9 9 0 0 1 321 162 C321 157 324 152 330 142 Z",
    d3: "path f=#8fd0ff c=#2f7fd6 w=3 | M370 130 C376 140 379 145 379 150 A9 9 0 0 1 361 150 C361 145 364 140 370 130 Z",
    a1: "path c=#e53935 w=14 | M60 520 A200 200 0 0 1 460 520",
    a2: "path c=#fb8c00 w=14 | M75 520 A185 185 0 0 1 445 520",
    a3: "path c=#fdd835 w=14 | M90 520 A170 170 0 0 1 430 520",
    a4: "path c=#43a047 w=14 | M105 520 A155 155 0 0 1 415 520",
    a5: "path c=#1e88e5 w=14 | M120 520 A140 140 0 0 1 400 520",
    a6: "path c=#3949ab w=14 | M135 520 A125 125 0 0 1 385 520",
    a7: "path c=#8e24aa w=14 | M150 520 A110 110 0 0 1 370 520",
    drop: "path f=#e8f5ff c=#2f7fd6 | M700 140 C760 230 830 280 830 330 A130 130 0 0 1 570 330 C570 280 640 230 700 140 Z",
    ray: "arrow 470 250 576 290 c=#f5b700 w=6",
    t_white: "text 440 232 s=28 | white light",
    r1: "line 578 292 816 385 c=#e53935 w=4", g1: "line 578 292 808 400 c=#43a047 w=4", v1: "line 578 292 797 415 c=#8e24aa w=4",
    r2: "line 816 385 632 440 c=#e53935 w=4", g2: "line 808 400 641 446 c=#43a047 w=4", v2: "line 797 415 655 452 c=#8e24aa w=4",
    r3: "arrow 632 440 530 495 c=#e53935 w=4", g3: "arrow 641 446 540 510 c=#43a047 w=4", v3: "arrow 655 452 552 522 c=#8e24aa w=4",
    t_bend: "text 735 200 s=28 | 1. bends",
    t_bounce: "text 836 405 s=28 | 2. bounces",
    t_out: "text 690 510 s=28 | 3. comes out as colours",
    t_final: "text 250 42 s=32 | sun behind you + rain in front = rainbow!"
  },
  steps: [
    { say: "A rainbow needs two things: sunlight, and raindrops in the air.",
      do: ["cam 250 160 1.6 1", "draw sun 900", "fill sun", "pop sun", "draw cloud 1000", "fill cloud", "draw d1 250", "draw d2 250", "draw d3 250", "fill d1 d2 d3"] },
    { say: "Sunlight looks white, but it is really a mix of every colour.",
      do: ["cam 480 270 1 1200", "draw drop 1200", "fill drop", "draw ray 700", "write t_white 900"] },
    { say: "When light enters a raindrop, it bends, and each colour bends a little differently.",
      do: ["cam 700 300 1.5 900", "draw r1 500", "draw g1 500", "draw v1 500", "write t_bend 600"] },
    { say: "Then it bounces off the back of the drop.",
      do: ["draw r2 500", "draw g2 500", "draw v2 500", "write t_bounce 700"] },
    { say: "And it comes out spread into a fan of colours.",
      do: ["cam 480 270 1 900", "draw r3 500", "draw g3 500", "draw v3 500", "write t_out 1000"] },
    { say: "Millions of drops do this at the same time, so we see a giant arc of colour.",
      do: ["draw a1 450", "draw a2 450", "draw a3 450", "draw a4 450", "draw a5 450", "draw a6 450", "draw a7 450"] },
    { say: "That is why a rainbow appears when the sun is behind you and the rain is in front of you.",
      do: ["write t_final 1600", "pop t_final 1.08"] }
  ]
},
{
  q: "What is compound interest?",
  els: {
    title: "text 60 62 s=44 | Interest on interest",
    given: "text 520 62 s=30 | $100 at 10% a year",
    xaxis: "line 110 470 900 470 w=4", yaxis: "line 120 480 120 80 w=4",
    b0: "rect 128 330 50 140 f=#f4a259 w=3",   b1: "rect 198 316 50 154 f=#f4a259 w=3",
    b2: "rect 268 300.6 50 169.4 f=#f4a259 w=3", b3: "rect 338 283.7 50 186.3 f=#f4a259 w=3",
    b4: "rect 408 265 50 205 f=#f4a259 w=3",   b5: "rect 478 244.5 50 225.5 f=#f4a259 w=3",
    b6: "rect 548 221.9 50 248.1 f=#f4a259 w=3", b7: "rect 618 197.1 50 272.9 f=#f4a259 w=3",
    b8: "rect 688 169.8 50 300.2 f=#f4a259 w=3", b9: "rect 758 139.9 50 330.1 f=#f4a259 w=3",
    b10: "rect 828 106.8 50 363.2 f=#f4a259 w=3",
    y0: "text 145 502 s=26 | 0", y5: "text 495 502 s=26 | 5", y10: "text 840 502 s=26 | 10", yrs: "text 880 530 s=24 | years",
    plus10: "text 192 304 s=26 f=#e04b3a | +$10",
    plus11: "text 262 290 s=26 f=#e04b3a | +$11",
    curve: "path c=#e04b3a w=5 | M153 330 L223 316 L293 300.6 L363 283.7 L433 265 L503 244.5 L573 221.9 L643 197.1 L713 169.8 L783 139.9 L853 106.8",
    end: "text 820 92 s=32 f=#e04b3a | $259",
    simple: "line 153 330 853 190 c=#2f7fd6 w=5",
    simpleT: "text 862 200 s=26 f=#2f7fd6 | $200",
    note: "text 520 100 s=26 f=#2f7fd6 | blue line = simple interest",
    extra: "text 300 140 s=30 | extra $59 = interest on interest!"
  },
  steps: [
    { say: "Compound interest means you earn interest on your interest, too.",
      do: ["write title 1300", "write given 1100"] },
    { say: "Say you put one hundred dollars in a bank that pays ten percent a year.",
      do: ["draw yaxis 500", "draw xaxis 700", "write y0 200", "draw b0 700", "fill b0", "pop b0"] },
    { say: "After one year you earn ten dollars, so you have one hundred and ten.",
      do: ["draw b1 700", "fill b1", "pop b1", "write plus10 500"] },
    { say: "The next year, ten percent of one hundred and ten is eleven dollars, not ten. Your interest earned interest.",
      do: ["draw b2 700", "fill b2", "pop b2", "write plus11 500"] },
    { say: "Keep going, and the growth speeds up. After ten years you have about two hundred and fifty nine dollars.",
      do: ["draw b3 250", "fill b3", "draw b4 250", "fill b4", "draw b5 250", "fill b5", "draw b6 250", "fill b6", "draw b7 250", "fill b7",
           "draw b8 250", "fill b8", "draw b9 250", "fill b9", "draw b10 250", "fill b10", "write y5 200", "write y10 250", "write yrs 300",
           "draw curve 1400", "write end 600", "pop end 1.3"] },
    { say: "With simple interest you would only have two hundred. The extra fifty nine dollars is interest on interest.",
      do: ["draw simple 1200", "write simpleT 400", "write note 900", "write extra 1400"] }
  ]
},
{
  q: "How does the internet send a message?",
  els: {
    screen: "rect 60 200 150 100 rx=8 f=#dff1ff",
    base: "path f=#cfd8dc | M40 300 L230 300 L246 322 L24 322 Z",
    you: "text 112 262 s=30 | You",
    phone: "rect 830 180 90 160 rx=14 f=#dff1ff",
    friend: "text 841 268 s=26 | Friend",
    L1: "line 210 250 332 162 c=#90a4ae w=4", L2: "line 210 250 332 390 c=#90a4ae w=4",
    L3: "line 390 150 590 150 c=#90a4ae w=4", L4: "line 390 400 590 400 c=#90a4ae w=4",
    L5: "line 382 172 598 378 c=#90a4ae w=4",
    L6: "line 650 160 830 228 c=#90a4ae w=4", L7: "line 650 390 830 300 c=#90a4ae w=4",
    R1: "circle 360 150 30 f=#ffe08a", R2: "circle 360 400 30 f=#ffe08a",
    R3: "circle 620 150 30 f=#ffe08a", R4: "circle 620 400 30 f=#ffe08a",
    rlabel: "text 322 210 s=24 | router",
    msg: "tag 135 140 230 44 | Hi, see you at 5!",
    p1: "tag 135 380 120 38 f=#c8f7c5 | 1: Hi, see",
    p2: "tag 135 425 120 38 f=#c8f7c5 | 2: you at",
    p3: "tag 135 470 120 38 f=#c8f7c5 | 3: 5!",
    final: "tag 790 120 250 44 | Hi, see you at 5!",
    fast: "text 330 525 s=32 | ...all in less than a second!"
  },
  steps: [
    { say: "When you send a message, your computer does not send it in one piece.",
      do: ["draw screen 900", "fill screen", "draw base 600", "fill base", "write you 400", "draw phone 800", "fill phone", "write friend 500", "draw msg 700", "fill msg", "pop msg"] },
    { say: "First it cuts the message into small numbered pieces, called packets.",
      do: ["fade msg 0.15 500", "draw p1 400", "fill p1", "&pop p1", "draw p2 400", "fill p2", "&pop p2", "draw p3 400", "fill p3", "pop p3"] },
    { say: "Each packet hops through routers, which pass it toward your friend's address.",
      do: ["draw L1 300", "draw L2 300", "draw R1 400", "draw R2 400", "fill R1 R2", "draw L3 400", "draw L4 400", "draw L5 400",
           "draw R3 400", "draw R4 400", "fill R3 R4", "draw L6 400", "draw L7 400", "write rlabel 500"] },
    { say: "Packets can take different roads, so they may arrive in any order.",
      do: ["&go p1 2600 360 150 620 150 760 425", "&go p2 3000 360 400 620 400 760 470", "go p3 1900 360 150 620 400 760 380", "wait 1300"] },
    { say: "Your friend's phone puts them back in order using the numbers, and the message appears.",
      do: ["&go p3 1000 880 380 880 470 760 470", "&go p1 700 760 380", "go p2 700 760 425", "wait 500",
           "&fade p1 0 500", "&fade p2 0 500", "&fade p3 0 500", "draw final 700", "fill final", "pop final 1.2"] },
    { say: "All of this happens in less than a second!",
      do: ["write fast 1200"] }
  ]
},
{
  q: "How do plants make food? (illustrated recipes)",
  els: {
    title: "title | Leaf captures energy",
    leaf:  "leaf 455 265 384",
    sun:   "sun 800 90 38 | Sunlight",
    beams: "beams 770 150 655 222",
    water: "flow 40 246 248 282 c=blue n=3 | Water",
    co2:   "flow 70 385 300 330 c=sky n=2 dots=1 | Carbon dioxide",
    oxy:   "flow 654 246 790 214 c=sky dots=1 | Oxygen",
    sugar: "trail 520 338 560 414 c=orange | Sugar, food for growth"
  },
  steps: [
    { say: "Plants make their own food, and the kitchen is the leaf.", do: ["write title 1200", "draw leaf 2400", "fill leaf"] },
    { say: "Sunlight gives the leaf its energy.", do: ["draw sun 1100", "fill sun", "draw beams 600"] },
    { say: "Water travels up from the roots.", do: ["draw water 1300"] },
    { say: "Carbon dioxide comes in from the air.", do: ["draw co2 1300"] },
    { say: "With sunlight's energy, the leaf turns water and carbon dioxide into sugar, its food.", do: ["draw sugar 900", "fill sugar"] },
    { say: "And it breathes out oxygen, the air we need.", do: ["draw oxy 900"] }
  ]
},
{
  q: "What is the water cycle?",
  els: {
    title: "title | The water cycle",
    sea: "sea 0 540 440",
    sun: "sun 870 105 36",
    vapour: "vapour 120 260 420 250 | Evaporation",
    cond: "flow 340 236 486 168 c=sky | Condensation",
    cloud: "cloud 610 140 1.5",
    mountain: "mountain 780 545 420 260",
    rain: "rain 520 200 630 300 | Precipitation",
    coll: "flow 660 420 530 446 c=blue n=2 bend=-10 | Collection"
  },
  steps: [
    { say: "Water on Earth is always on the move, in a giant loop called the water cycle.",
      do: ["write title 1200", "cam 270 400 1.35 900", "draw sea 1400", "fill sea", "loop sea sway"] },
    { say: "The sun warms the sea, and water rises into the air as invisible vapour. That is evaporation.",
      do: ["draw vapour 1600", "loop vapour rise"] },
    { say: "High up, the vapour cools into tiny droplets that gather into clouds. That is condensation.",
      do: ["cam 480 270 1 1000", "draw sun 800", "fill sun", "pop sun 1.15", "draw cond 900", "draw cloud 1200", "fill cloud", "pop cloud 1.12"] },
    { say: "When the droplets get heavy, they fall as rain or snow. That is precipitation.",
      do: ["draw mountain 1400", "fill mountain", "draw rain 900", "loop rain fall"] },
    { say: "Rivers carry the water back to the sea, and the whole cycle starts again.",
      do: ["draw coll 1000", "loop coll flow", "loop cond flow", "&travel vapour,cond,rain,coll 5200 loop", "wait 5400"] }
  ]
},
{
  q: "How does the heart pump blood?",
  els: {
    title: "title | The heart: a double pump",
    heart: "heart 480 330 300",
    bodyIn: "flow 90 300 318 300 c=blue n=2 | From the body",
    toLungs: "flow 408 150 230 182 c=blue at=end | To the lungs",
    fromLungs: "flow 870 300 642 300 c=red n=2 | From the lungs",
    toBody: "flow 600 172 800 110 c=red at=end | To the body",
    lbl1: "label 120 505 c=blue s=24 | Its right side \u2192 lungs",
    lbl2: "label 610 505 c=red s=24 | Its left side \u2192 body"
  },
  steps: [
    { say: "Your heart is a pump about the size of your fist, and it never stops.",
      do: ["write title 1200", "draw heart 2600", "fill heart", "pop heart 1.1", "loop heart beat"] },
    { say: "Used blood, low on oxygen, comes back from the body into its right side.",
      do: ["draw bodyIn 1100", "loop bodyIn flow"] },
    { say: "The right side pumps it to the lungs, where it picks up fresh oxygen.",
      do: ["draw toLungs 1000", "loop toLungs flow"] },
    { say: "Fresh blood comes back from the lungs into the left side.",
      do: ["draw fromLungs 1100", "loop fromLungs flow"] },
    { say: "And the strong left side pumps it out to the whole body. Two pumps beating together, about seventy times a minute.",
      do: ["draw toBody 1000", "loop toBody flow", "&travel bodyIn,toLungs,fromLungs,toBody 6000 loop", "draw lbl1 700", "draw lbl2 700", "wait 4000"] }
  ]
},
{
  "q": "How did writing tools change?",
  "els": {
    "title": "title | Writing tools through time",
    "time": "flow 50 470 920 470 c=blue bend=0 | Time",
    "t1": "tool 115 225 150 k=stick",
    "m1": "mark 115 318 k=groove",
    "n1": "label 67 372 s=22 | Stick in sand",
    "e1": "label 85 505 c=sky s=18 | long ago",
    "t2": "tool 255 225 150 k=reed",
    "m2": "mark 255 318 k=wedge",
    "n2": "label 207 372 s=22 | Reed in clay",
    "e2": "label 225 505 c=sky s=18 | 3000 BC",
    "t3": "tool 395 225 150 k=quill",
    "m3": "mark 395 318 k=ink",
    "n3": "label 347 372 s=22 | Quill and ink",
    "e3": "label 365 505 c=sky s=18 | 600 AD",
    "t4": "tool 535 225 150 k=pencil",
    "m4": "mark 535 318 k=graphite",
    "n4": "label 487 372 s=22 | Pencil",
    "e4": "label 505 505 c=sky s=18 | 1560s",
    "t5": "tool 675 225 150 k=pen",
    "m5": "mark 675 318 k=blue",
    "n5": "label 627 372 s=22 | Fountain pen",
    "e5": "label 645 505 c=sky s=18 | 1880s",
    "t6": "tool 815 225 150 k=stylus",
    "m6": "mark 815 318 k=glow",
    "n6": "label 767 372 s=22 | Stylus",
    "e6": "label 785 505 c=sky s=18 | today"
  },
  "steps": [
    {
      "say": "People have always wanted to write things down.",
      "do": [
        "write title 1200",
        "draw time 1200",
        "loop time flow"
      ]
    },
    {
      "say": "Long ago, they scratched marks into the sand with a stick.",
      "do": [
        "cam 270 330 1.4 900",
        "draw t1 900",
        "fill t1",
        "pop t1",
        "draw m1 600",
        "draw n1 500",
        "draw e1 400"
      ]
    },
    {
      "say": "Then they pressed a cut reed into soft clay.",
      "do": [
        "draw t2 900",
        "fill t2",
        "pop t2",
        "draw m2 600",
        "fill m2",
        "draw n2 500",
        "draw e2 400"
      ]
    },
    {
      "say": "Later, a bird's feather, a quill, was dipped in ink.",
      "do": [
        "draw t3 900",
        "fill t3",
        "pop t3",
        "draw m3 600",
        "draw n3 500",
        "draw e3 400"
      ]
    },
    {
      "say": "Pencils packed graphite into wood, so you could rub mistakes away.",
      "do": [
        "cam 690 330 1.4 900",
        "draw t4 900",
        "fill t4",
        "pop t4",
        "draw m4 600",
        "draw n4 500",
        "draw e4 400"
      ]
    },
    {
      "say": "Fountain pens carried their own ink inside.",
      "do": [
        "draw t5 900",
        "fill t5",
        "pop t5",
        "draw m5 600",
        "draw n5 500",
        "draw e5 400"
      ]
    },
    {
      "say": "And today, a stylus writes with light on a screen.",
      "do": [
        "draw t6 900",
        "fill t6",
        "pop t6",
        "draw m6 600",
        "draw n6 500",
        "draw e6 400"
      ]
    },
    {
      "say": "Different tools, same idea: putting our thoughts where others can read them.",
      "do": [
        "cam 480 270 1 1200",
        "&travel time 5000",
        "pop t1 1.15",
        "pop t2 1.15",
        "pop t3 1.15",
        "pop t4 1.15",
        "pop t5 1.15",
        "pop t6 1.15",
        "wait 1500"
      ]
    }
  ]
}
];
