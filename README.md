# DUSTLINE

A tactical shooter for the web, built to feel like the classic 5v5 defusal games: realistic gunplay, a 24-weapon buy menu, a full economy, and burst sliding. Pure static files, nothing to install, no internet connection needed, LAN multiplayer included, and Play Together from Engage.

Dustline is Engage's edition of [Cla-Go](https://github.com/Kwusv55/Cla-Go) by Kwusv55 (formerly published as Sandstorm). Every texture, sound and model is still made in code.

> **Play online**: <https://engage-work.github.io/dustline/>. Click and play, no download.

## What's new in Dustline

- **24 weapons**: Glock-18, USP-S, P250, Tec-9, Five-SeveN, Desert Eagle, MAC-10, MP9, UMP-45, Nova, Galil AR, FAMAS, AK-47, M4A4, SG 553, AUG, SSG 08, AWP, two knives, three grenades and the C4, each with its own model, recoil pattern and sound. The AUG and SG 553 have a rifle optic; the Nova fires nine pellets and reloads shell by shell.
- **Reloads you can see**: the magazine tilts out and falls to the floor (and stays there), the fresh one comes up in the left hand, the bolt or slide is released on an empty gun, snipers cycle the bolt by hand, the Nova is pumped after every shot and loaded one shell at a time. Draw, inspect (with a mag check on rifles) and shell ejection match the action.
- **Characters**: legs follow the direction of travel while the torso turns to the aim, feet have their own joints, hits rock the upper body, and both sides carry more kit: plate carriers with magazines, helmets with mounts and chin straps, keffiyeh wraps, holsters, elbow and knee pads, faces with eyes.
- **Graphics**: a time of day (noon, dawn, dusk) with its own sun, sky, fog and environment light; sharper shadows that follow you; a sun flare; muzzle gas and bullet-strike light; brick, striped awning and rug materials; rooftop parapets, water tanks, antennas and air conditioners; market stalls, tire stacks, rubble, posters and oil stains in the streets.
- **Quality of life**: damage numbers, a kill banner with multi-kill calls, weapon icons in the kill feed, weapon bar and buy menu, a weapon stat card in the buy menu, re-buy last round's kit with `R`, a death summary of the damage you dealt, ADR and HS% on the scoreboard, a round history strip, match length (first to 9 / 13 / 16) and friendly fire on the menu, teammate health bars and view cones on the radar, a T-style crosshair option.

## Getting started

Double-click `index.html` (latest Edge / Chrome recommended) and click "Play".
The mouse is locked and the game goes fullscreen on click. Press `Esc` to pause (hold `Esc` to leave fullscreen).

> Fullscreen is needed for the browser's "keyboard lock": only in fullscreen can a page capture browser shortcuts such as `Ctrl+W` and `Ctrl+D`.
> Without it, `Ctrl` to crouch plus a movement key can trigger a browser shortcut and steal pointer lock (it looks like pressing Esc: the pause menu pops up).
> If you do not want fullscreen, turn off "Fullscreen + keyboard lock" under Settings → Mouse & Movement and crouch with `C` instead.

## LAN multiplayer

Play with a roommate or classmates on the same WiFi (versus each other, or on the same team against bots):

1. On one computer, install [Node.js](https://nodejs.org/en) (the LTS version is fine) and double-click **`start-lan-server.cmd`**. On macOS / Linux, run `node server/server.js` instead.
   On first run Windows asks for administrator approval to open the port in the firewall; click "Yes". The window shows the multiplayer address, for example `http://192.168.1.5:8080`.
2. Everyone opens that address in a browser (the computer running the server can also use `http://localhost:8080`).
3. One player clicks "Multiplayer" → "Host Room" to become the host; the others click "Multiplayer" → "Join Room".
4. In the lobby, pick your side (the same side means co-op against bots). The host chooses the mode and clicks "Start Match". Empty slots on each team are filled with bots.

- Team Deathmatch and Demolition are supported. The host's computer simulates the whole match (bots, damage, economy, C4); everyone else only needs a browser.
- Your own movement is computed locally, so it never feels laggy. Shots are judged by the host against what you saw on your screen (lag compensation).
- If you drop out or quit mid-match, go back to the lobby and click "Join Match in Progress" to return. The match keeps running if the host switches windows.
- If you cannot connect, check in order: are both computers on the same WiFi, is the server window still open, and does a campus / hotel WiFi block device-to-device traffic (AP isolation)? A phone hotspot works around that.
- If the port is taken, pick another one: `node server/server.js 8090 --firewall`.
- The online demo page (HTTPS) cannot do multiplayer, because browsers do not let HTTPS pages connect to a LAN server.

## Modes

| Mode | Description |
| --- | --- |
| Demolition | 5v5 rounds with an economy. Attackers plant the C4, Defenders defuse it. First to 9, 13 or 16 wins; sides switch at the half |
| Team Deathmatch | Instant respawn, free weapon swaps for 20 seconds after spawning, first to 50 kills |
| Firing Range | Unlimited ammo, moving targets, live speed / spread / recoil index readout on the right |

Bot skill: Recruit / Veteran / Elite / Cosmic (reaction time, tracking, recoil control, headshot rate and sliding frequency all rise step by step).
Bots slide while traveling, rotating, retaking sites and when they meet an enemy.

Telling sides apart: Defenders wear dark blue-grey uniforms with a black vest and helmet and a blue armband; Attackers wear sand-colored clothes with a brown chest rig and a dark red headscarf over the face, and an orange armband.
Teammates get a side-colored marker and name overhead; when your crosshair is on a visible enemy, a red "Enemy Name" appears below it.

## Controls

| Key | Action |
| --- | --- |
| W A S D | Move |
| Shift | Walk quietly (can be switched to sprint in Settings, in which case Alt walks) |
| Ctrl / C | Crouch; **pressing it at near-full running speed = slide**, and jumping out of a slide keeps your momentum |
| Space | Jump |
| Left / right click | Fire / scope (snipers), heavy knife attack, underhand grenade throw |
| R / F | Reload / inspect (the butterfly knife has full close, finger-roll and flip-open inspect animations). `R` inside the buy menu re-buys last round's kit |
| 1-5, Q, mouse wheel | Primary / secondary / knife / grenades / C4; Q quick-swaps |
| E | Pick up weapons, plant (or hold left click) / defuse C4 |
| G | Drop the current weapon |
| B / Tab | Buy menu / scoreboard |

## Handling parameters

- 128 tick fixed-step physics with a classic FPS movement model: acceleration 5.5, friction 5.2, air acceleration 12, gravity 800 u/s²
- M4A4 run speed 225 u/s, walk 117 u/s, crouch-walk 77 u/s; counter-strafing reaches "accurate speed" in about 70 ms
- Jump height 57 u, crouch-jump onto a 64 u crate; a landing stamina penalty limits bunny hopping
- Sensitivity uses the classic FPS yaw scale (0.022° per unit) and supports raw mouse input
- Spread = base + movement + air + landing + accumulated fire; AK / M4 follow a fixed recoil pattern that recovers after you stop shooting
- Headshot ×4, chest ×1, stomach ×1.25, legs ×0.75; armor / helmet damage reduction; distance falloff; wooden doors, crates, thin walls and sheet metal can be penetrated
- The head hitbox is an ellipsoid fitted to the head model (the helmet counts as head); the air above the head and the neck do not count as headshots

## Melee weapon

Under Settings → Mouse & Movement → "Melee weapon" choose the butterfly knife (default) or the plain knife; it takes effect on your next spawn.
The butterfly knife is a blade and two skeletonized handles, each rotating around its own pivot pin: it flips open when drawn, and `F` inspects it.

## Death cam

After you die, the camera pulls from your eye position to above and behind your body, and you can orbit freely with the mouse; it does not auto-lock onto the killer.
In Demolition, after 2.5 seconds it switches to spectating teammates (left / right click to cycle).

## Changelog

- **v1.2.0**: Added LAN multiplayer (host-authoritative with local movement prediction and lag compensation), a zero-dependency Node multiplayer server, and a lobby with side / mode selection and mid-match joining
- **v1.1.0**: Fixed the Ctrl combo triggering browser shortcuts and exiting while crouching with the AWP scoped (fullscreen keyboard lock); bots made weaker overall and able to slide; head hitbox is now a fitted ellipsoid and the neck no longer counts as a headshot; the death cam now orbits freely; remade both teams' character models and added side identification; added the butterfly knife and its inspect animation
- **v1.0.0**: First release

## File structure

```
index.html          Entry point
css/style.css       UI styles
lib/                three.js r147 and post-processing (bundled locally, works offline)
js/core.js          Constants, settings, input
js/audio.js         Procedurally synthesized sound + HRTF 3D positioning
js/textures.js      Procedural PBR textures
js/world.js         AABB collision world, rays, box sweeps
js/map.js           Map generation + vertex AO baking
js/nav.js           Navigation mesh + A*
js/weapons.js       Weapon data and ballistics
js/models.js        Weapon / character models (skinned)
js/effects.js       Particles, decals, tracers, shell casings, smoke
js/ragdoll.js       Ragdolls
js/actor.js         Movement physics and the weapon state machine
js/bot.js           Bot AI
js/viewmodel.js     First-person weapon animation
js/hud.js           HUD / radar / buy menu
js/game.js          Match logic and modes
js/net.js           Multiplayer: connection, lobby, snapshot sync, lag compensation
js/main.js          Render pipeline, menus, main loop
server/server.js    Multiplayer server (static hosting + WebSocket relay, zero dependencies)
start-lan-server.cmd  One-click multiplayer server launcher for Windows
docs/               Screenshots
```

## Technical notes

- **No external assets**: all sound is synthesized procedurally with Web Audio (including HRTF 3D positioning), all textures are code-generated PBR maps (albedo + normal + roughness), all models are lofted from primitive geometry, and the map is carved from a grid with vertex ambient occlusion baked in. The project contains no image, audio or model files.
- **Works offline**: three.js and the post-processing chain are bundled locally in `lib/` as UMD builds, so you can just double-click `index.html`. No server, no internet, no build step.
- **Multiplayer**: the host's browser runs the authoritative match and sends 64 Hz snapshots; joiners predict their own movement locally (map collision is deterministic on both ends) and see other characters interpolated by 50 ms; the host keeps 0.375 s of position history and rewinds to the moment the shooter saw when judging hits. The server only relays messages and ships its own minimal WebSocket implementation, so no `npm install` is needed.
- **Consistent handling**: 128 tick fixed-step physics plus render interpolation; movement, acceleration, counter-strafing, recoil and spread all follow classic FPS numeric models.

## License

The original code in this project is open source under the [MIT License](LICENSE).

three.js and its example code under `lib/` are third-party components; copyright belongs to their original authors and they are likewise distributed under the MIT License. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

This project is an original fan work. It is not affiliated with any commercial game or its publisher, and uses none of any third-party game's art, audio or code.

Upstream: <https://github.com/Kwusv55/Cla-Go> (MIT, by Kwusv55).

This fork is the English Engage Edition of Cla-Go, maintained by Engage.
