// Pad color and screen text are the SysEx Akai's MPK Mini 4 playground sends.
// The message layout is the one checked in Sandbox/akai.

const SCREEN_FONT = 2;

function split7(level) {
  const v = Math.max(0, Math.min(255, level | 0));
  return [v >> 7, v & 0x7f];
}

function len14(n) {
  return [(n >> 7) & 0x7f, n & 0x7f];
}

function rgb565(rgb) {
  return [rgb.r >> 3, rgb.g >> 2, rgb.b >> 3];
}

function screenAscii(text) {
  return String(text || "")
    .split("")
    .filter(ch => {
      const code = ch.charCodeAt(0);
      return code >= 32 && code <= 126;
    })
    .join("")
    .slice(0, 32);
}

export function padColorMessage(pad, rgb) {
  const bytes = [0xf0, 0x47, 0x00, 0x5d, 0x70, 0x00, 0x0d, pad & 0x0f];
  const levels = [rgb.r, rgb.g, rgb.b, rgb.r, rgb.g, rgb.b];
  for (let i = 0; i < levels.length; i++) {
    const pair = split7(levels[i]);
    bytes.push(pair[0], pair[1]);
  }
  bytes.push(0xf7);
  return bytes;
}

export function screenOwnerMessage() {
  return [
    0xf0,
    0x47,
    0x00,
    0x5d,
    0x1c,
    0x00,
    0x11,
    0x01,
    0x53,
    0x56,
    0x4b,
    0x30,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0xf7
  ];
}

export function screenLineMessages(line, text, bg, fg) {
  const ascii = screenAscii(text)
    .split("")
    .map(ch => ch.charCodeAt(0));
  const color = [
    0xf0,
    0x47,
    0x00,
    0x5d,
    0x14,
    0x00,
    0x09,
    SCREEN_FONT,
    line & 0x7f,
    0x01,
    rgb565(fg)[0],
    rgb565(fg)[1],
    rgb565(fg)[2],
    rgb565(bg)[0],
    rgb565(bg)[1],
    rgb565(bg)[2],
    0xf7
  ];
  const payload = [SCREEN_FONT, line & 0x7f].concat(ascii, [0x00]);
  const written = [0xf0, 0x47, 0x00, 0x5d, 0x10]
    .concat(len14(payload.length), payload, [0xf7]);
  return [color, written];
}

function same(left, right) {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

export function assertSysex() {
  const orange = padColorMessage(0, { r: 255, g: 128, b: 0 });
  const expectOrange = [
    0xf0,
    0x47,
    0x00,
    0x5d,
    0x70,
    0x00,
    0x0d,
    0x00,
    0x01,
    0x7f,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01,
    0x7f,
    0x01,
    0x00,
    0x00,
    0x00,
    0xf7
  ];
  const owner = screenOwnerMessage();
  const expectOwner = [
    0xf0,
    0x47,
    0x00,
    0x5d,
    0x1c,
    0x00,
    0x11,
    0x01,
    0x53,
    0x56,
    0x4b,
    0x30,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0xf7
  ];
  const hello = screenLineMessages(
    0,
    "Hello",
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 255, b: 255 }
  );
  const expectHello = [
    [
      0xf0,
      0x47,
      0x00,
      0x5d,
      0x14,
      0x00,
      0x09,
      0x02,
      0x00,
      0x01,
      0x1f,
      0x3f,
      0x1f,
      0x00,
      0x00,
      0x00,
      0xf7
    ],
    [
      0xf0,
      0x47,
      0x00,
      0x5d,
      0x10,
      0x00,
      0x08,
      0x02,
      0x00,
      0x48,
      0x65,
      0x6c,
      0x6c,
      0x6f,
      0x00,
      0xf7
    ]
  ];
  if (!same(orange, expectOrange)) {
    throw new Error("Pad color SysEx does not match the MPK playground.");
  }
  if (!same(owner, expectOwner)) {
    throw new Error("Screen ownership SysEx does not match the MPK playground.");
  }
  if (!same(hello[0], expectHello[0]) || !same(hello[1], expectHello[1])) {
    throw new Error("Screen text SysEx does not match the MPK playground.");
  }
}
