import fs from 'fs';

const globeRows = [
  "......WWWWWT......",
  "....WWWTTWWTTT....",
  "...WWTTWTWTWTTW...",
  "..WWTTWTTTTTTWWW..",
  ".WWWWTWWTTTTWTWW..",
  "TWWWWWWTTTTTTWWWW.",
  "TWWWWWTTTTTTTWTTWW",
  "TTWTWTTTTTTTWWWWWW",
  "TTWWTWTTTTTWWWWWWW",
  "TTTTWWWTTTTWWWWWWW",
  "TTTTWWWWTTTTTTWWWT",
  ".TTTWWWWWTTTTTWWW.",
  ".TTTTWWWWTTTTTWWW.",
  "..TTTTWWTTTTTTWW..",
  "...TTTWTTTTTTTW...",
  "....TTWTTTTTTT....",
  "......TTTTTT......"
];

const CHARS = {
  T: {
    w: 5,
    top: 5,
    grid: [
      "#####",
      "..#..",
      "..#..",
      "..#..",
      "..#..",
      "..#.."
    ]
  },
  e: {
    w: 4,
    top: 6,
    grid: [
      "####",
      "#..#",
      "####",
      "#...",
      "####"
    ]
  },
  r: {
    w: 4,
    top: 6,
    grid: [
      "#.##",
      "##..",
      "#...",
      "#...",
      "#..."
    ]
  },
  a: {
    w: 4,
    top: 6,
    grid: [
      ".###",
      "...#",
      "####",
      "#..#",
      "####"
    ]
  },
  H: {
    w: 4,
    top: 5,
    grid: [
      "#..#",
      "#..#",
      "####",
      "#..#",
      "#..#",
      "#..#"
    ]
  },
  l: {
    w: 3,
    top: 5,
    grid: [
      "#..",
      "#..",
      "#..",
      "#..",
      "#..",
      "###"
    ]
  }
};

export function generateSvg(theme = 'intro') {
  const landColor = '#ffffff';
  const oceanColor = theme === 'intro' ? '#050505' : '#0becc2';
  const terraColor = '#ffffff';
  const healColor = theme === 'intro' ? '#050505' : '#0becc2';

  const rects = [];

  // Globe (18x17)
  for (let y = 0; y < 17; y++) {
    const row = globeRows[y];
    for (let x = 0; x < 18; x++) {
      const ch = row[x];
      if (ch === 'W') {
        rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${landColor}"/>`);
      } else if (ch === 'T') {
        rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${oceanColor}"/>`);
      }
    }
  }

  // Letters (start col 22)
  let currentX = 22;
  const word = [
    { ch: 'T', color: terraColor },
    { ch: 'e', color: terraColor },
    { ch: 'r', color: terraColor },
    { ch: 'r', color: terraColor },
    { ch: 'a', color: terraColor },
    { ch: 'H', color: healColor },
    { ch: 'e', color: healColor },
    { ch: 'a', color: healColor },
    { ch: 'l', color: healColor },
  ];

  word.forEach((item, index) => {
    const def = CHARS[item.ch];
    for (let r = 0; r < def.grid.length; r++) {
      const row = def.grid[r];
      const y = def.top + r;
      for (let c = 0; c < row.length; c++) {
        if (row[c] === '#') {
          rects.push(`<rect x="${currentX + c}" y="${y}" width="1" height="1" fill="${item.color}"/>`);
        }
      }
    }
    currentX += def.w + (index === 4 ? 2 : 1);
  });

  const totalWidth = currentX;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} 17" width="100%" height="100%" shape-rendering="crispEdges">
  ${rects.join('\n  ')}
</svg>`;
}

const introSvg = generateSvg('intro');
const brandSvg = generateSvg('brand');

fs.writeFileSync('src/assets/logo/terraheal-logo-intro.svg', introSvg);
fs.writeFileSync('public/terraheal-logo-intro.svg', introSvg);
fs.writeFileSync('src/assets/logo/terraheal-logo.svg', brandSvg);
fs.writeFileSync('public/terraheal-logo.svg', brandSvg);

console.log('SVG logo assets successfully created!');
