'use strict';
// ======================================================================
//  icons.js - weapon and gear silhouettes for the HUD, kill feed, buy menu and scoreboard.
//  Inline SVG (64x24, muzzle to the right) so they stay crisp at any size and take the text colour.
// ======================================================================
const Icons = (() => {
  const P = {
    pistol: 'M14 5h46v6H14zM14 11h42v2H14zM20 13h10l-4 10h-10zM30 13c4 0 6 3 6 5h-2c0-1-2-3-4-3z',
    deagle: 'M12 4h50v7H12zM12 11h44v2H12zM19 13h11l-4 10h-11zM30 13c5 0 7 3 7 5h-2c0-1-2-3-5-3zM56 4h4v-2h-4z',
    tec9: 'M10 6h40v6H10zM50 7h12v4H50zM10 12h36v2H10zM22 14h9l-2 10h-9zM32 14c4 0 6 2 6 4h-2c0-1-2-2-4-2z',
    smg: 'M4 9h10v2H4zM14 7h32v6H14zM46 9h10v2H46zM26 13h10l-2 10h-10zM36 13c4 0 6 2 6 4h-2c0-1-2-2-4-2z',
    mac10: 'M12 6h32v7H12zM44 8h18v3H44zM22 13h9l-1 10h-9zM32 13c4 0 6 2 6 4h-2c0-1-2-2-4-2zM14 4h6v2h-6z',
    ump45: 'M2 8h10v5H4zM12 7h32v6H12zM44 9h14v2H44zM26 13h9l-1 9h-9zM35 13c4 0 6 2 6 4h-2c0-1-2-2-4-2zM16 5h22v2H16z',
    ak47: 'M4 9l14-1v5L6 15zM18 8h26v5H18zM44 7h12v2H44zM44 9h18v2H44zM58 5h2v4h-2zM26 13h5l-2 6h-5zM32 13h7c0 4-1 7-2 9h-7c0-3 1-6 2-9zM44 9h8v4h-8z',
    m4a4: 'M4 8l14-1v6H8zM18 7h24v6H18zM22 5h18v2H22zM42 9h20v2H42zM54 5h2v4h-2zM26 13h5l-2 6h-5zM32 13h6l-2 7h-6zM42 8h8v5h-8z',
    famas: 'M4 10l12-3v8L4 14zM16 6h24v8H16zM40 9h20v2H40zM20 4h16v2H20zM24 14h6l-2 6h-6zM30 14h7l-1 7h-7zM54 6h2v3h-2z',
    galil: 'M4 9l14-1v5L6 15zM18 8h26v5H18zM44 7h10v2H44zM44 9h18v2H44zM58 5h2v4h-2zM26 13h5l-2 6h-5zM32 13h7c0 4-1 8-3 10h-7c1-3 2-7 3-10zM44 9h7v4h-7z',
    aug: 'M6 8l34-1v6L6 15zM18 4h16v3H18zM40 9h22v2H40zM12 15h7l-1 7h-7zM26 13h5l-1 6h-5zM44 9h6v4h-6zM30 13c3 0 5 2 5 3h-2c0-1-1-2-3-2z',
    sg553: 'M6 8l34-1v6L6 15zM20 4h12v3H20zM40 9h22v2H40zM12 15h7l-1 7h-7zM26 13h5l-1 6h-5zM44 9h8v4h-8zM56 6h2v3h-2z',
    awp: 'M2 9l14-1v5L4 15zM16 8h24v5H16zM40 9h24v2H40zM20 3h18v4H20zM22 7h4v1h-4zM32 7h4v1h-4zM24 13h8v3h-8zM26 13h5l-2 6h-5zM58 7h2v2h-2z',
    ssg08: 'M2 9l14-1v5L4 15zM16 8h22v5H16zM38 9h24v2H38zM20 3h14v4H20zM22 7h4v1h-4zM30 7h4v1h-4zM26 13h5l-2 6h-5zM34 7l4-4 2 1-4 4z',
    nova: 'M4 8l14-1v6L6 15zM18 7h20v6H18zM38 8h24v2H38zM38 11h20v2H38zM42 10h8v4h-8zM24 13h5l-2 6h-5z',
    knife: 'M30 10l32-1v2L30 14zM10 9h20v5H10z',
    he: 'M24 14a8 8 0 1 0 16 0a8 8 0 1 0-16 0zM29 3h6v5h-6zM35 4l6-2 1 2-6 3z',
    flash: 'M26 6h12v16H26zM24 4h16v3H24zM28 10h8v2h-8z',
    smoke: 'M26 5h12v17H26zM24 3h16v3H24zM26 12h12v3H26z',
    c4: 'M14 6h36v14H14zM18 9h10v4H18zM44 10l8 4 2-2-8-5zM30 9h12v2H30z',
    kevlar: 'M20 4h8l4 3 4-3h8v8l-4 2v8H24v-8l-4-2z',
    helmet: 'M18 16a14 10 0 0 1 28 0v2H18zM16 18h32v3H16z',
    defuser: 'M22 6h6v8h-6zM36 6h6v8h-6zM20 14h24v6H20zM28 8h8v4h-8z',
  };
  const BY_ID = {
    glock: 'pistol', usp: 'pistol', p250: 'pistol', fiveseven: 'pistol', tec9: 'tec9', deagle: 'deagle',
    mac10: 'mac10', mp9: 'smg', ump45: 'ump45', galil: 'galil', famas: 'famas', ak47: 'ak47', m4a4: 'm4a4', sg553: 'sg553', aug: 'aug',
    ssg08: 'ssg08', awp: 'awp', nova: 'nova', knife: 'knife', butterfly: 'knife', he: 'he', flash: 'flash', smoke: 'smoke', c4: 'c4',
    kevlar: 'kevlar', helmet: 'helmet', defuser: 'defuser', fall: 'fall',
  };
  const cache = {};
  return {
    // `id` is a weapon / gear id or a weapon name as shown in the kill feed
    svg(id, cls = 'wi') {
      const key = id + '|' + cls;
      if (cache[key]) return cache[key];
      let k = BY_ID[id];
      if (!k) {
        const lower = String(id).toLowerCase();
        for (const w in WEAPONS) if (WEAPONS[w].name.toLowerCase() === lower) { k = BY_ID[w]; break; }
      }
      const d = P[k];
      const s = d ? `<svg class="${cls}" viewBox="0 0 64 24" aria-hidden="true"><path d="${d}"/></svg>` : '';
      return (cache[key] = s);
    },
  };
})();
