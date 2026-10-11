// The levels, built in code. The floor's top is y = 1. At 7 tiles a second, obstacles on multiples of 4 tiles come
// every 0.57 s, a steady rhythm to jump to. `node beathop/check.mjs` proves each one can be
// finished with all three stars.
export const LEVELS = [
  {
    id: 'meadow', name: 'Sunny Meadow', theme: 'meadow', w: 150,
    hint: 'Tap, click or press Space to jump. Hold for a bigger jump!',
    build(b) {
      b.fill(0, 150, 0, 1, '=');
      b.row(16, 1, '^'); b.row(15, 3, '.**');
      b.row(20, 1, '^');
      b.row(24, 1, '^^'); b.row(24, 4, '**');
      b.fill(28, 32, 1, 2, '#'); b.row(28, 2, '****');
      b.row(34, 3, '???'); b.row(36, 1, 'H');
      b.fill(40, 42, 0, 1, ' ');
      b.row(46, 1, '^');
      b.fill(48, 51, 0, 1, ' '); b.row(48, 3, '***');
      b.row(56, 1, 'J^^^'); b.row(58, 5, 'S');
      b.trig(64, 'F'); b.row(66, 1, 'M');
      b.fill(68, 70, 1, 2, '#'); b.fill(70, 72, 1, 3, '#'); b.fill(72, 76, 1, 4, '#'); b.row(72, 4, '****');
      b.row(80, 1, '^');
      b.row(84, 1, '^^');
      b.trig(88, 'F');
      b.row(92, 2, '#####'); b.row(92, 1, '^^^^^'); b.row(92, 3, '*****'); b.row(98, 6, 'S');
      b.fill(104, 107, 0, 1, ' ');
      b.row(110, 1, '^'); b.row(110, 4, '?');
      b.row(114, 1, '^^');
      b.row(118, 1, '^');
      b.row(123, 1, '^^'); b.row(123, 3, '.S');
      b.row(130, 2, '*.*.*.*');
      b.trig(140, 'G');
    },
  },
  {
    id: 'cave', name: 'Crystal Cave', theme: 'cave', w: 175,
    hint: 'A glider gate is coming: hold to fly up, let go to go down.',
    build(b) {
      b.fill(0, 175, 0, 1, '='); b.fill(0, 175, 9, 10, '#');
      b.row(14, 1, '^'); b.row(18, 1, '^^'); b.row(22, 8, 'vvv');
      b.row(26, 3, '???');
      b.fill(30, 33, 0, 1, ' ');
      b.row(36, 1, '^'); b.row(39, 1, 'H');
      b.trig(42, 'P'); b.row(46, 4, 'M'); b.trig(43, 'F');
      b.fill(50, 52, 1, 5, '#'); b.row(50, 6, '**');
      b.fill(58, 60, 5, 9, '#'); b.row(58, 3, '**');
      b.fill(66, 68, 1, 5, '#'); b.row(66, 6, 'S');
      b.fill(74, 76, 4, 9, '#'); b.row(74, 2, '**');
      b.fill(82, 94, 1, 3, '#'); b.fill(82, 94, 6, 9, '#'); b.row(82, 4, '*.*.*.*.*.*.');
      b.fill(100, 102, 1, 6, '#'); b.row(100, 7, '**');
      b.fill(106, 108, 4, 9, '#'); b.row(106, 2, '*S');
      b.trig(114, 'C');
      b.trig(122, 'F');
      b.row(128, 1, '^'); b.row(132, 1, '^^');
      b.fill(136, 140, 1, 2, '#'); b.row(140, 1, '^^');
      b.fill(142, 146, 1, 2, '#'); b.row(143, 5, 'S');
      b.row(150, 3, '???');
      b.row(156, 1, '^');
      b.trig(166, 'G');
    },
  },
  {
    id: 'sky', name: 'Upside-Down Sky', theme: 'sky', w: 190,
    hint: 'Press inside a ring to jump again in the air. Blue gates flip the world!',
    build(b) {
      b.fill(0, 36, 0, 1, '=');
      b.row(10, 1, 'H'); b.row(14, 1, '^');
      b.fill(20, 27, 0, 1, ' '); b.row(23, 3, 'o'); b.row(26, 5, 'S'); b.fill(27, 36, 0, 1, '=');
      b.row(30, 1, 'J'); b.row(32, 6, '***');
      b.fill(36, 80, 9, 10, '#'); b.fill(36, 40, 0, 1, '=');
      b.trig(38, 'U');
      b.row(46, 8, 'v'); b.row(50, 8, 'vv');
      b.fill(54, 58, 8, 9, '#'); b.row(54, 7, '****');
      b.row(62, 8, 'v'); b.row(63, 5, 'S');
      b.trig(66, 'F');
      b.row(70, 8, 'vv');
      b.fill(76, 120, 0, 1, '=');
      b.trig(80, 'D');
      b.row(85, 1, 'M'); b.row(88, 1, '^'); b.row(92, 1, 'J'); b.row(93, 1, '^^^'); b.row(94, 6, '***');
      b.trig(100, 'F');
      b.trig(104, 'P'); b.fill(104, 160, 9, 10, '#');
      b.fill(112, 114, 1, 6, '#'); b.fill(120, 160, 0, 1, '=');
      b.fill(120, 122, 4, 9, '#'); b.row(120, 2, '**');
      b.fill(128, 130, 1, 5, '#'); b.row(128, 6, 'S*');
      b.fill(136, 138, 5, 9, '#'); b.row(136, 3, '**');
      b.trig(144, 'C');
      b.trig(148, 'F');
      b.fill(160, 190, 0, 1, '=');
      b.row(152, 1, '^'); b.row(156, 1, '^^'); b.row(162, 3, '???'); b.row(168, 1, '^');
      b.row(172, 2, '*.*.*');
      b.trig(180, 'G');
    },
  },
  {
    id: 'dunes', name: 'Sandy Dunes', theme: 'desert', w: 190,
    hint: 'Long jumps ahead: hold the button all the way.',
    build(b) {
      b.fill(0, 190, 0, 1, '=');
      b.row(14, 1, '^'); b.row(18, 1, '^^'); b.row(22, 1, '^');
      b.fill(26, 30, 1, 2, '#'); b.row(30, 1, '^^'); b.fill(32, 36, 1, 2, '#'); b.row(32, 2, '****');
      b.row(38, 1, 'H');
      b.fill(40, 43, 0, 1, ' '); b.row(47, 1, '^');
      b.row(52, 1, 'J^^^'); b.row(54, 5, 'S');
      b.trig(62, 'F');
      b.row(66, 3, '???');
      b.fill(70, 72, 1, 2, '#'); b.fill(72, 74, 1, 3, '#'); b.fill(74, 80, 1, 4, '#'); b.row(77, 4, '^');
      b.row(84, 1, '^^'); b.row(88, 1, '^');
      b.fill(92, 96, 0, 1, ' '); b.row(92, 4, '****');
      b.row(100, 1, 'M'); b.row(102, 3, '*.*.*.*.*');
      b.trig(106, 'F');
      b.row(110, 1, '^'); b.row(114, 1, '^^'); b.row(118, 1, '^^');
      b.row(122, 2, '######'); b.row(122, 1, '^^^^^^'); b.row(127, 5, 'S');
      b.fill(132, 135, 0, 1, ' ');
      b.row(140, 1, '^'); b.row(144, 1, '^^');
      b.row(150, 1, 'J^^^');
      b.row(160, 1, '^^'); b.row(160, 3, '.S');
      b.row(168, 2, '*.*.*');
      b.trig(180, 'G');
    },
  },
  {
    id: 'snow', name: 'Snowy Peaks', theme: 'snow', w: 200,
    hint: 'Glide through the ice caves. Small taps keep you steady.',
    build(b) {
      b.fill(0, 200, 0, 1, '=');
      b.row(14, 1, '^'); b.row(18, 1, '^'); b.row(22, 1, '^');
      b.row(26, 3, '???'); b.row(27, 1, 'H');
      b.fill(30, 34, 0, 1, ' ');
      b.row(38, 1, '^^');
      b.trig(42, 'F');
      b.trig(46, 'P'); b.fill(46, 130, 9, 10, '#');
      b.fill(54, 56, 1, 6, '#'); b.row(54, 7, '**');
      b.fill(62, 64, 4, 9, '#'); b.row(62, 2, '**');
      b.fill(70, 72, 1, 5, '#'); b.row(70, 6, 'S');
      b.fill(78, 80, 5, 9, '#');
      b.fill(86, 90, 1, 3, '#'); b.fill(86, 90, 6, 9, '#');
      b.fill(90, 94, 1, 4, '#'); b.fill(90, 94, 7, 9, '#');
      b.fill(94, 98, 1, 3, '#'); b.fill(94, 98, 6, 9, '#'); b.row(86, 4, '*.*.'); b.row(90, 5, '*.*.'); b.row(94, 4, '*.*.');
      b.row(104, 4, 'M');
      b.fill(110, 112, 1, 5, '#'); b.fill(118, 120, 4, 9, '#'); b.row(118, 2, 'S');
      b.trig(126, 'C');
      b.trig(132, 'F');
      b.row(138, 1, '^'); b.row(142, 1, '^^');
      b.fill(146, 150, 1, 2, '#'); b.fill(150, 154, 1, 3, '#'); b.row(154, 1, '^^');
      b.row(160, 1, 'J^^^'); b.row(162, 5, 'S');
      b.row(170, 1, '^'); b.row(174, 1, '^^');
      b.row(180, 2, '*.*.*');
      b.trig(190, 'G');
    },
  },
  {
    id: 'night', name: 'Night Forest', theme: 'night', w: 200,
    hint: 'Rings and flips in the dark. Press inside a ring!',
    build(b) {
      b.fill(0, 40, 0, 1, '=');
      b.row(12, 1, '^'); b.row(16, 1, '^^');
      b.fill(22, 29, 0, 1, ' '); b.row(25, 3, 'o');
      b.row(33, 1, 'H');
      b.fill(38, 95, 9, 10, '#'); b.trig(40, 'U');
      b.row(48, 8, 'v'); b.row(52, 8, 'vv');
      b.fill(56, 60, 8, 9, '#'); b.row(56, 7, '****');
      b.row(66, 8, 'v'); b.row(67, 5, 'S');
      b.trig(72, 'F');
      b.row(78, 8, 'vv');
      b.fill(82, 86, 9, 10, ' ');
      b.fill(86, 200, 0, 1, '='); b.trig(92, 'D');
      b.row(100, 1, 'M'); b.row(102, 2, '*.*.*.*');
      b.row(108, 1, '^'); b.row(112, 1, 'J^^^'); b.row(115, 6, '***');
      b.trig(122, 'F');
      b.fill(128, 139, 0, 1, ' '); b.row(131, 3, 'o'); b.row(135, 3, 'o'); b.row(133, 5, 'S');
      b.row(146, 1, '^'); b.row(150, 1, '^^'); b.row(156, 3, '???'); b.row(160, 1, '^');
      b.row(166, 1, '^^'); b.row(166, 3, '.S');
      b.row(174, 2, '*.*.*');
      b.trig(186, 'G');
    },
  },
  {
    id: 'volcano', name: 'Lava Mountain', theme: 'volcano', w: 210,
    hint: 'Thorns everywhere! Watch the gaps between them.',
    build(b) {
      b.fill(0, 210, 0, 1, '=');
      b.row(12, 1, '^^'); b.row(16, 1, '^'); b.row(20, 1, '^^');
      b.fill(24, 28, 1, 2, '#'); b.row(28, 1, '^^^'); b.fill(31, 35, 1, 2, '#');
      b.row(37, 1, 'H');
      b.row(40, 1, 'J^^^'); b.row(42, 5, 'S');
      b.trig(50, 'F');
      b.fill(54, 57, 0, 1, ' '); b.fill(60, 63, 0, 1, ' ');
      b.row(68, 3, '???');
      b.trig(74, 'P'); b.fill(74, 140, 9, 10, '#');
      b.fill(80, 82, 1, 5, '#'); b.fill(86, 88, 5, 9, '#'); b.fill(92, 94, 1, 5, '#'); b.fill(98, 100, 5, 9, '#'); b.fill(104, 106, 1, 5, '#');
      b.row(83, 3, '**'); b.row(89, 6, '**'); b.row(95, 3, '**'); b.row(101, 6, '**');
      b.row(110, 4, 'M');
      b.fill(114, 124, 1, 3, '#'); b.fill(114, 124, 6, 9, '#'); b.row(114, 4, '*.*.*.*.*.');
      b.fill(128, 130, 1, 6, '#'); b.row(128, 7, 'S');
      b.trig(134, 'C');
      b.trig(140, 'F');
      b.row(146, 1, '^'); b.row(150, 1, '^^');
      b.fill(154, 158, 1, 2, '#'); b.fill(158, 162, 1, 3, '#');
      b.row(170, 1, 'J^^^');
      b.row(180, 1, '^'); b.row(184, 1, '^^'); b.row(184, 3, '.S');
      b.row(192, 2, '*.*.*.*');
      b.trig(200, 'G');
    },
  },
  {
    id: 'beach', name: 'Flip Beach', theme: 'beach', w: 210,
    hint: 'The world flips at the blue gates. Thorns hang from the ceiling!',
    build(b) {
      b.fill(0, 50, 0, 1, '=');
      b.row(12, 1, '^'); b.row(16, 1, '^^'); b.row(20, 1, 'H');
      b.fill(24, 31, 0, 1, ' '); b.row(27, 3, 'o'); b.row(29, 5, 'S');
      b.row(36, 1, '^'); b.row(40, 1, 'J^^^');
      b.fill(46, 110, 9, 10, '#'); b.trig(50, 'U');
      b.row(56, 8, 'v'); b.row(60, 8, 'vv');
      b.fill(64, 68, 8, 9, '#'); b.row(64, 7, '****');
      b.row(72, 8, 'v');
      b.trig(76, 'F');
      b.fill(80, 84, 9, 10, ' ');
      b.row(88, 8, 'vv'); b.row(88, 5, '.S');
      b.fill(92, 210, 0, 1, '='); b.trig(96, 'D');
      b.row(102, 1, 'M'); b.row(104, 2, '*.*.*.*.*');
      b.trig(112, 'F');
      b.row(116, 1, '^'); b.row(120, 1, '^^');
      b.trig(124, 'P'); b.fill(124, 170, 9, 10, '#');
      b.fill(132, 134, 1, 6, '#'); b.fill(140, 142, 4, 9, '#'); b.fill(148, 150, 1, 6, '#'); b.row(148, 7, 'S'); b.fill(156, 158, 4, 9, '#');
      b.row(136, 3, '**'); b.row(144, 6, '**'); b.row(152, 3, '**');
      b.trig(162, 'C');
      b.trig(168, 'F');
      b.row(174, 1, '^'); b.row(178, 1, '^^'); b.row(182, 3, '???'); b.row(188, 1, '^');
      b.row(194, 2, '*.*.*');
      b.trig(202, 'G');
    },
  },
  {
    id: 'space', name: 'Star Station', theme: 'space', w: 220,
    hint: 'Everything you have learned, in space. You can do it!',
    build(b) {
      b.fill(0, 220, 0, 1, '=');
      b.row(12, 1, '^^'); b.row(16, 1, '^^'); b.row(20, 1, '^^^');
      b.fill(26, 30, 0, 1, ' '); b.row(26, 4, '****');
      b.row(34, 1, 'H'); b.row(36, 1, 'J^^^'); b.row(38, 5, 'S');
      b.trig(46, 'F');
      b.row(50, 1, '^^^^^^^^^^^^'); b.row(50, 2, '###'); b.row(56, 3, '###'); b.row(56, 4, '***');
      b.row(66, 3, '???');
      b.trig(72, 'P'); b.fill(72, 150, 9, 10, '#');
      b.fill(80, 82, 1, 6, '#'); b.fill(86, 88, 5, 9, '#'); b.fill(92, 94, 1, 6, '#'); b.fill(98, 100, 5, 9, '#');
      b.row(83, 7, '**'); b.row(89, 3, '**'); b.row(95, 7, '**');
      b.fill(106, 118, 1, 4, '#'); b.fill(106, 118, 7, 9, '#'); b.row(106, 5, '*.*.*.*.*.*.'); b.row(112, 6, 'S');
      b.row(124, 4, 'M');
      b.fill(130, 132, 1, 6, '#'); b.fill(138, 140, 4, 9, '#');
      b.trig(146, 'C');
      b.trig(152, 'F');
      b.fill(156, 190, 9, 10, '#'); b.trig(158, 'U'); b.fill(160, 186, 0, 1, ' ');
      b.row(166, 8, 'v'); b.row(174, 8, 'vv'); b.row(174, 5, '.S'); b.row(180, 8, 'v');
      b.trig(186, 'D');
      b.row(196, 1, '^'); b.row(200, 1, '^^');
      b.row(206, 2, '*.*.*');
      b.trig(212, 'G');
    },
  },
  {
    id: 'rainbow', name: 'Rainbow Road', theme: 'rainbow', w: 240,
    hint: 'The last level: jumps, rings, gliding and flips. Go!',
    build(b) {
      b.fill(0, 240, 0, 1, '=');
      b.row(12, 1, '^'); b.row(16, 1, '^^'); b.row(20, 1, '^^^');
      b.fill(24, 26, 1, 2, '#'); b.fill(26, 28, 1, 3, '#'); b.fill(28, 32, 1, 4, '#'); b.row(32, 1, '^^^'); b.row(30, 6, 'S');
      b.row(38, 1, 'H');
      b.fill(42, 49, 0, 1, ' '); b.row(45, 3, 'o');
      b.row(52, 1, 'J^^^');
      b.trig(60, 'F');
      b.trig(64, 'P'); b.fill(64, 120, 9, 10, '#');
      b.fill(72, 74, 1, 5, '#'); b.fill(80, 82, 5, 9, '#'); b.fill(88, 90, 1, 5, '#'); b.fill(96, 98, 5, 9, '#');
      b.row(76, 3, '**'); b.row(84, 6, '**'); b.row(92, 3, '**');
      b.fill(102, 112, 1, 3, '#'); b.fill(102, 112, 6, 9, '#'); b.row(102, 4, '*.*.*.*.*.'); b.row(107, 4, 'S');
      b.row(115, 4, 'M');
      b.trig(118, 'C');
      b.trig(126, 'F');
      b.row(132, 1, '^^'); b.row(136, 1, '^'); b.row(140, 3, '???');
      b.fill(146, 190, 9, 10, '#'); b.trig(148, 'U'); b.fill(150, 186, 0, 1, ' ');
      b.row(156, 8, 'v'); b.row(160, 8, 'vv');
      b.fill(164, 168, 8, 9, '#'); b.row(164, 7, '****');
      b.row(172, 8, 'v');
      b.trig(176, 'F');
      b.row(180, 8, 'vv'); b.row(180, 5, '.S');
      b.trig(186, 'D');
      b.row(194, 1, 'J^^^'); b.row(196, 6, '***');
      b.row(204, 1, '^'); b.row(208, 1, '^^'); b.row(214, 3, '???'); b.row(220, 1, '^');
      b.row(226, 2, '*.*.*.*');
      b.trig(234, 'G');
    },
  },
];
