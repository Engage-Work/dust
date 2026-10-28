'use strict';
// ======================================================================
//  viewmodel.js - first-person weapon: its own scene and camera (never clips through walls),
//                 sway / inertia / recoil / reload choreography / inspect / slide tilt / knife / throw / plant
// ======================================================================
class Spring {
  constructor(k = 180, c = 22) { this.x = 0; this.v = 0; this.k = k; this.c = c; }
  update(dt) { const n = Math.max(1, Math.ceil(dt / 0.008)); const h = dt / n; for (let i = 0; i < n; i++) { this.v += (-this.k * this.x - this.c * this.v) * h; this.x += this.v * h; } return this.x; }
}

class ViewModel {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(54, 16 / 9, 0.01, 20);
    this.scene.add(this.camera);
    this.root = new THREE.Group();
    this.camera.add(this.root);
    this.hemi = new THREE.HemisphereLight(0xd9d6cf, 0x8f7454, 0.55);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffe0b4, 2.4);
    this.scene.add(this.sun); this.scene.add(this.sun.target);
    this.mflight = new THREE.PointLight(0xffb060, 0, 2.5, 2); this.root.add(this.mflight);
    this.models = {};
    this.cur = null; this.curId = null;
    this.team = 'CT';
    this.camPos = new THREE.Vector3();
    this.t = 0; this.bob = 0; this.swayX = 0; this.swayY = 0; this.swayR = 0;
    this.kickZ = new Spring(260, 26); this.kickRX = new Spring(220, 24); this.kickRY = new Spring(200, 22); this.kickRZ = new Spring(200, 22);
    this.land = new Spring(120, 16);
    this.strafe = 0;
    this.drawT = 1; this.drawDur = 0.6;
    this.reload = null; this.inspect = -1; this.knife = null; this.nade = null; this.plant = -1; this.bolt = -1; this.boltSnd = false;
    this.pumpT = -1; this.shell = null;
    this.sprint = 0; this.slide = 0; this.slideDir = 1; this.hidden = false;
    this.flashT = 1; this.smokeT = 0;
    this.slideBack = 0;
    this.buildArms();
    this.buildFlash();
  }

  setTeam(team) {
    this.team = team;
    const M = Models.mats();
    const sl = team === 'T' ? M.sleeveT : M.sleeveCT;
    this.armR.material = sl; this.armL.material = sl;
  }
  setEnv(env, sunDir) { this.scene.environment = env; this.sunDir = sunDir.clone(); }
  setLight(color, intensity, hemiSky, hemiGround) { this.sun.color.set(color); this.sunBase = intensity; this.hemi.color.set(hemiSky); this.hemi.groundColor.set(hemiGround); }
  setFov(hfov4x3, aspect) {
    this.camera.fov = 2 * Math.atan(Math.tan(hfov4x3 * 0.5 * DEG) * 0.75) / DEG;
    this.camera.aspect = aspect; this.camera.updateProjectionMatrix();
  }

  buildArms() {
    const M = Models.mats();
    const cap = new THREE.CapsuleGeometry(0.036, 0.26, 4, 12);
    this.armR = new THREE.Mesh(cap, M.sleeveCT); this.armL = new THREE.Mesh(cap, M.sleeveCT);
    this.handR = new THREE.Group(); this.handL = new THREE.Group();
    this.buildFist(this.handR, M.glove);
    // Left hand: an open support hand (palm, three curled fingers and a thumb) that cups the handguard
    const p2 = new THREE.Mesh(Models.rbox(0.07, 0.03, 0.1, 0.012, 2), M.glove); p2.position.set(0, -0.022, 0); this.handL.add(p2);
    const f2 = new THREE.Mesh(Models.rbox(0.02, 0.05, 0.085, 0.009, 2), M.glove); f2.position.set(0.035, 0.0, 0); this.handL.add(f2);
    const f3 = new THREE.Mesh(Models.rbox(0.02, 0.045, 0.06, 0.009, 2), M.glove); f3.position.set(-0.035, 0.002, 0.01); this.handL.add(f3);
    const f4 = new THREE.Mesh(Models.rbox(0.02, 0.04, 0.05, 0.009, 2), M.glove); f4.position.set(0.0, 0.012, -0.03); f4.rotation.x = 0.6; this.handL.add(f4);
    const th = new THREE.Mesh(Models.rbox(0.018, 0.018, 0.055, 0.008, 2), M.glove); th.position.set(0.045, -0.03, 0.03); th.rotation.y = -0.5; this.handL.add(th);
    // A spare magazine that appears in the left hand during a reload
    this.handMag = new THREE.Group(); this.handMag.visible = false; this.handMag.position.set(0.0, -0.03, 0.0); this.handL.add(this.handMag);
    for (const o of [this.armR, this.armL, this.handR, this.handL]) this.root.add(o);
  }
  // Right hand fist (grip channel along +Y, index finger on top; back of the hand toward +X)
  buildFist(root, mat) {
    const box = (w, h, d, r) => Models.rbox(w, h, d, r, 2);
    const segm = (ax, az, bx, bz, y, th, h) => {
      const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
      const m = new THREE.Mesh(box(th, h, L + th * 0.6, th * 0.45), mat);
      m.position.set((ax + bx) / 2, y, (az + bz) / 2); m.rotation.y = Math.atan2(dx, dz);
      root.add(m);
    };
    const back = new THREE.Mesh(box(0.024, 0.085, 0.07, 0.01), mat); back.position.set(0.026, -0.004, 0.012); back.rotation.y = -0.12; root.add(back);
    const heel = new THREE.Mesh(box(0.03, 0.07, 0.03, 0.012), mat); heel.position.set(0.004, -0.012, 0.03); root.add(heel);
    const ys = [0.028, 0.008, -0.012, -0.031], sc = [1, 1.04, 0.98, 0.84];
    for (let i = 0; i < 4; i++) {
      const y = ys[i], k = sc[i], h = i === 3 ? 0.016 : 0.0185;
      segm(0.03, -0.012 * k, 0.004, -0.031 * k, y, 0.02, h);
      segm(0.004, -0.031 * k, -0.022 * k, -0.017 * k, y, 0.018, h * 0.97);
      segm(-0.022 * k, -0.017 * k, -0.022 * k, 0.004, y, 0.016, h * 0.94);
    }
    segm(0.006, 0.032, -0.02, 0.012, 0.042, 0.021, 0.02);
    segm(-0.02, 0.012, -0.028, -0.012, 0.045, 0.018, 0.018);
    const cuff = new THREE.Mesh(box(0.05, 0.03, 0.055, 0.012), mat); cuff.position.set(0.022, -0.04, 0.045); cuff.rotation.x = 0.4; root.add(cuff);
  }
  buildFlash() {
    const S = Tex.sprites;
    const mk = (tex, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(5, 3.8, 2.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.renderOrder = 5; return m; };
    this.flash = new THREE.Group();
    this.flashFront = mk(S.flash, 0.16, 0.16); this.flash.add(this.flashFront);
    const s1 = mk(S.flashSide, 0.22, 0.09); s1.position.z = -0.1; s1.rotation.y = Math.PI / 2; this.flash.add(s1);
    const s2 = mk(S.flashSide, 0.22, 0.09); s2.position.z = -0.1; s2.rotation.set(0, Math.PI / 2, Math.PI / 2); this.flash.add(s2);
    // A short-lived cone of hot gas that gives the flash depth
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.2, 10, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.4, 1.0), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cone.rotation.x = Math.PI / 2; cone.position.z = -0.12; this.flash.add(cone);
    this.flash.visible = false;
    this.root.add(this.flash);
  }

  model(id) {
    if (!this.models[id]) {
      const m = Models.weapon(id);
      m.group.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; } });
      if (m.mag) m.magBase = m.mag.position.clone();
      if (m.slide) m.slideBase = m.slide.position.clone();
      if (m.bolt) { m.boltBase = m.bolt.position.clone(); m.boltRot = m.bolt.rotation.clone(); }
      this.models[id] = m;
    }
    return this.models[id];
  }
  setWeapon(id) {
    if (this.curId === id) return;
    if (this.cur) {
      // A reload interrupted by a switch must not leave the mag, bolt or pump displaced on the holstered model
      const o = this.cur;
      if (o.mag && o.magBase) { o.mag.position.copy(o.magBase); o.mag.visible = true; }
      if (o.bolt && o.boltBase) { o.bolt.position.copy(o.boltBase); o.bolt.rotation.copy(o.boltRot); }
      if (o.pump && o.pumpBase) o.pump.position.copy(o.pumpBase);
      this.root.remove(o.group);
    }
    this.cur = this.model(id); this.curId = id;
    this.root.add(this.cur.group);
    if (this.cur.pin) this.cur.pin.visible = true;
    this.cur.group.visible = true;
    this.handMag.visible = false;
    while (this.handMag.children.length) this.handMag.remove(this.handMag.children[0]);
    if (this.cur.mag) { const mm = Models.magModel(id); if (mm) { mm.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; } }); this.handMag.add(mm); } }
  }

  // Events (from actor.events)
  handle(ev, actor) {
    switch (ev.t) {
      case 'draw':
        this.setWeapon(ev.id); this.drawT = 0; this.bfAnim = ev.id === 'butterfly' ? { k: 'draw', t: 0, s: {} } : null;
        this.drawDur = Math.max(0.35, (WEAPONS[ev.id].draw || 1) * 0.6);
        this.reload = null; this.inspect = -1; this.knife = null; this.nade = null; this.plant = -1; this.bolt = -1; this.pumpT = -1; this.shell = null; this.slideBack = 0;
        if (this.cur && this.cur.mag) this.cur.mag.visible = true;
        Sound.play('cloth', { vol: 0.35, rate: rand(0.9, 1.1) });
        break;
      case 'fire': {
        const def = WEAPONS[ev.id];
        const heavy = def.type === 'sniper' ? 2.4 : def.type === 'shotgun' ? 2.2 : def.id === 'deagle' ? 2.0 : def.type === 'pistol' ? 1.2 : 1;
        this.kickZ.v += 1.25 * heavy + rand(0, 0.3); this.kickRX.v += 4.0 * heavy + rand(0, 1.5); this.kickRY.v += rand(-1.2, 1.2); this.kickRZ.v += rand(-1.5, 1.5);
        if (!def.suppressed) { this.flashT = 0; this.flash.rotation.z = Math.random() * 6.28; const s = rand(0.85, 1.25) * (def.type === 'sniper' ? 1.6 : def.type === 'shotgun' ? 1.5 : def.type === 'pistol' ? 0.8 : 1); this.flash.scale.set(s, s, s); }
        else { this.flashT = 0.6; }
        this.smokeT = 0.5;
        if (this.cur && this.cur.slide) this.slideBack = ev.empty ? 2 : 1;
        if (def.type === 'sniper') { this.bolt = -0.32; this.boltSnd = false; }
        if (def.type === 'shotgun') { this.pumpT = -0.25; this.pumpSnd = false; }
        this.inspect = -1;
        break;
      }
      case 'reload':
        this.reload = { t: 0, dur: ev.dur, empty: ev.empty, id: ev.id, s: {}, shells: !!ev.shells, dropped: false };
        this.inspect = -1; this.shell = null;
        break;
      case 'shell': this.shell = { t: 0, dur: ev.dur || 0.5 }; break;
      case 'reloadend': this.reload = null; this.shell = null; this.handMag.visible = false; break;
      case 'inspect':
        if (this.curId === 'butterfly') { if (!this.bfAnim) this.bfAnim = { k: 'inspect', t: 0, s: {} }; }
        else if (!this.reload) { this.inspect = 0; this.inspectS = {}; }
        break;
      case 'slash': case 'stab': this.knife = { t: 0, type: ev.t, n: ev.n || 0 }; this.inspect = -1; if (this.bfAnim && this.bfAnim.k === 'inspect') this.bfAnim = null; break;
      case 'pin': this.nade = { s: 'pin', t: 0 }; break;
      case 'throw': this.nade = { s: 'throw', t: 0 }; break;
      case 'plant': this.plant = 0; break;
      case 'plantcancel': this.plant = -1; break;
      case 'land': this.land.v -= clamp(ev.v * 0.09, 0, 1.2); break;
      case 'jump': this.land.v += 0.25; break;
      case 'slide': this.slideDir = actor.slideRollDir; break;
      default: break;
    }
  }

  // World position of a point given in weapon-local space (for dropped mags and shells)
  worldOf(local, out) {
    return out.copy(local).applyMatrix4(this.cur.group.matrix).applyMatrix4(this.camera.matrixWorld).add(this.camPos);
  }

  update(dt, actor, camQuat, mdx, mdy, sunVis) {
    this.t += dt;
    this.camera.quaternion.copy(camQuat);
    this.camera.updateMatrixWorld(true);
    if (this.sunDir) { this.sun.position.copy(this.sunDir).multiplyScalar(10); }
    this.sun.intensity = (this.sunBase || 2.4) * (0.2 + 0.8 * sunVis);
    this.hemi.intensity = 0.42 + 0.18 * sunVis;
    for (const ev of actor.events) this.handle(ev, actor);
    actor.events.length = 0;
    if (!this.cur) return;
    const def = actor.def, id = this.curId, m = this.cur;
    this.hidden = !!actor.scoped || !actor.alive;
    this.root.visible = !this.hidden;
    if (this.hidden) { this.flash.visible = false; this.mflight.intensity = 0; return; }

    const S = Settings.data;
    const type = def.type;
    const pose = ViewModel.POSE[id === 'butterfly' ? 'bfly' : type] || ViewModel.POSE.rifle;
    const pos = _vmP.fromArray(pose.p), rot = _vmR.fromArray(pose.r);
    pos.x += (S.vmX - 1) * 0.008; pos.z -= (S.vmY - 1) * 0.01; pos.y += (S.vmZ + 1) * 0.008;

    // Walk bob (classic FPS style)
    const hs = actor.hspeed(), frac = clamp(hs / Math.max(def.speed, 1), 0, 1.4);
    const bobAmt = S.vmBob ? frac * (actor.onGround ? 1 : 0.25) * (1 - actor.slideAmt) : 0;
    this.bob += hs * dt * 1.55 * (actor.onGround ? 1 : 0.2);
    pos.x += Math.sin(this.bob) * 0.0075 * bobAmt;
    pos.y += -Math.abs(Math.sin(this.bob)) * 0.009 * bobAmt + 0.0045 * bobAmt;
    rot.z += Math.sin(this.bob) * 0.012 * bobAmt;
    pos.y += Math.sin(this.t * 1.7) * 0.0011; rot.x += Math.sin(this.t * 1.3) * 0.002;
    // Look inertia
    this.swayX = damp(this.swayX, clamp(-mdx * 0.0006, -0.07, 0.07), 9, dt);
    this.swayY = damp(this.swayY, clamp(-mdy * 0.0006, -0.06, 0.06), 9, dt);
    rot.y += this.swayX; rot.x += this.swayY; rot.z += this.swayX * 0.8;
    pos.x += this.swayX * 0.06; pos.y += this.swayY * 0.04;
    // Strafe lean: the gun lags sideways when you change direction
    const side = actor.vel.x * Math.cos(actor.yaw) - actor.vel.z * Math.sin(actor.yaw);
    this.strafe = damp(this.strafe, clamp(side / 6, -1, 1), 6, dt);
    pos.x -= this.strafe * 0.006; rot.z -= this.strafe * 0.02; rot.y -= this.strafe * 0.012;
    // Crouch / sprint / slide
    pos.y -= actor.duckAmt * 0.007; rot.z += actor.duckAmt * 0.035;
    this.sprint = damp(this.sprint, actor.sprinting ? 1 : 0, 9, dt);
    pos.x += this.sprint * 0.02; pos.y -= this.sprint * 0.045; pos.z += this.sprint * 0.03;
    rot.x -= this.sprint * 0.28; rot.y += this.sprint * 0.7; rot.z += this.sprint * 0.2;
    this.slide = damp(this.slide, actor.sliding ? 1 : 0, 10, dt);
    rot.z += this.slide * 0.42 * this.slideDir; pos.y -= this.slide * 0.03; pos.x -= this.slide * 0.015 * this.slideDir; rot.x += this.slide * 0.06;
    // Landing / recoil springs
    const ld = this.land.update(dt);
    pos.y += ld * 0.03; rot.x += ld * 0.06;
    pos.z += this.kickZ.update(dt) * 0.018;
    rot.x += this.kickRX.update(dt) * 0.012;
    rot.y += this.kickRY.update(dt) * 0.01;
    rot.z += this.kickRZ.update(dt) * 0.008;
    // Draw: the gun comes up from the hip and settles with a small overshoot (the butterfly knife has its own flick)
    if (m.bfly) this.drawT = 1;
    if (this.drawT < 1) {
      this.drawT = Math.min(1, this.drawT + dt / this.drawDur);
      const k = 1 - easeOut(this.drawT), over = Math.sin(this.drawT * Math.PI) * 0.06;
      pos.y -= k * 0.24; pos.x += k * 0.08; rot.x -= k * 1.0 - over; rot.z += k * 0.45; rot.y -= k * 0.35;
    }
    // Default left-hand target (gun local)
    const L = _vmL.copy(m.guard);
    let leftVis = !(type === 'knife' || type === 'grenade');
    let magOff = 0, magVis = true, magZ = 0, magTilt = 0, handMag = false;
    let boltZ = 0, boltUp = 0, pumpZ = 0;
    // Reload: keyframed pose (lift the gun and cant the mag well toward you), the mag drops out and a fresh one
    // comes up in the left hand, which seats it and, on an empty gun, releases the bolt or slide. Keys are
    // fractions of the weapon's reload time: mag out at 0.2, seated at 0.6, at rest before the reload ends.
    if (this.reload && !this.reload.shells) {
      const r = this.reload; r.t += dt / r.dur; const T = Math.min(r.t, 1);
      const snd = (key, at, name, vol = 0.55) => { if (!r.s[key] && T >= at) { r.s[key] = 1; Sound.play(name, { vol }); } };
      const once = (key, at) => { if (r.s[key] || T < at) return false; r.s[key] = 1; return true; };
      const pistol = type === 'pistol', sniper = type === 'sniper';
      const charge = r.empty && (pistol || !!m.bolt);
      const v = sampleKeys(ViewModel.RELOAD[pistol ? 'pistol' : 'rifle'][charge ? 'empty' : 'tac'], T, _rlv);
      rot.x += v[1]; rot.y += v[2]; rot.z += v[3]; pos.x += v[4]; pos.y += v[5]; pos.z += v[6];
      // Old mag: released, tilts out and falls (a loose copy continues in the world); new one rises into the well in the hand
      if (T >= 0.17 && T < 0.3) { const k = (T - 0.17) / 0.13; magOff = -k * k * 0.12; magTilt = k * 0.35; }
      else if (T >= 0.3 && T < 0.44) { magVis = false; }
      else if (T >= 0.44 && T < 0.6) { const k = easeOut(seg(T, 0.44, 0.6)); magOff = -(1 - k) * 0.22; magZ = (1 - k) * 0.05; magTilt = (1 - k) * 0.25; }
      if (T >= 0.3 && !r.dropped) {
        r.dropped = true;
        const p = this.worldOf(_vmT.copy(m.magBase).add(_vmT2.set(0, -0.1, 0)), _vmA);
        const vel = _vmB.set(rand(-0.3, 0.3), -0.6, rand(-0.3, 0.3)).applyQuaternion(this.camera.quaternion).add(actor.vel);
        Effects.dropMag(id, p, vel, this.camera.quaternion);
      }
      const mw = m.magWell || m.guard;
      const under = _vmT.copy(mw).add(_vmT2.set(0, pistol ? -0.04 : -0.07, 0));
      const low = _vmT3.copy(under).add(_vmT2.set(0.04, -0.22, 0.06));
      const rest = charge && T >= 0.66 ? null : m.guard;
      if (T < 0.14) L.lerpVectors(m.guard, under, smoothstep(0.02, 0.14, T));
      else if (T < 0.2) L.copy(under);
      else if (T < 0.4) L.lerpVectors(under, low, smoothstep(0.2, 0.4, T));   // down to the pouch for a fresh mag
      else if (T < 0.66) { L.copy(under).add(_vmT2.set(0, magOff, magZ)); handMag = T < 0.6; }   // carries it up and slaps it home
      else if (rest) L.lerpVectors(under, rest, smoothstep(0.66, pistol ? 0.8 : 0.86, T));
      else {
        // Empty: rack the bolt (rifles, snipers) or drop the slide stop (pistols), then back to the grip
        const hold = pistol ? _vmT3.set(-0.04, 0.045, 0.05) : _vmT3.copy(m.boltBase).add(_vmT2.set(type === 'sniper' ? 0.05 : 0.03, type === 'sniper' ? -0.01 : 0, 0.02));
        if (pistol) { boltZ = 0; if (T > 0.74 && T < 0.8) hold.z += 0.03 * seg(T, 0.74, 0.79); if (T >= 0.78) this.slideBack = 0; }
        else if (sniper) { boltUp = smoothstep(0.7, 0.74, T) * (1 - smoothstep(0.84, 0.88, T)); boltZ = 0.08 * smoothstep(0.74, 0.79, T) * (1 - smoothstep(0.8, 0.84, T)); }
        else boltZ = 0.045 * smoothstep(0.74, 0.79, T) * (1 - smoothstep(0.8, 0.815, T));
        hold.z += boltZ;
        if (T < 0.74) L.lerpVectors(under, hold, smoothstep(0.66, 0.74, T));
        else if (T < 0.84) L.copy(hold);
        else L.lerpVectors(hold, m.guard, smoothstep(0.84, 0.95, T));
      }
      if (once('seat', 0.6)) { this.kickRX.v += 3; this.kickZ.v += 0.5; this.kickRZ.v += 2; }
      if (charge && once('rack', 0.8)) { this.kickRX.v += 1.5; this.kickZ.v -= 0.4; }
      snd('o', 0.18, 'magout'); snd('i', 0.6, 'magin');
      if (charge) snd('b', sniper ? 0.7 : pistol ? 0.76 : 0.74, pistol ? 'slideback' : sniper ? 'awpbolt' : 'bolt');
      if (r.t >= 1) { this.reload = null; this.handMag.visible = false; }
    }
    // Shotgun: shells go in one at a time through the loading port under the receiver
    if (this.reload && this.reload.shells) {
      const r = this.reload; r.t += dt;
      const k = smoothstep(0, 0.25, r.t);
      rot.x += 0.16 * k; rot.z += 0.42 * k; rot.y += 0.12 * k; pos.x -= 0.03 * k; pos.y += 0.035 * k; pos.z += 0.02 * k;
      const port = _vmT.copy(m.shellPort || m.magWell).add(_vmT2.set(-0.02, -0.03, 0));
      const pouch = _vmT3.copy(port).add(_vmT2.set(0.06, -0.2, 0.1));
      if (this.shell) {
        const s = this.shell; s.t += dt; const u = clamp(s.t / s.dur, 0, 1);
        // pouch -> port (first 55%), push in, back toward the pouch
        if (u < 0.55) L.lerpVectors(pouch, port, smoothstep(0, 0.55, u));
        else if (u < 0.68) { L.copy(port); L.z -= 0.02 * seg(u, 0.55, 0.68); }
        else L.lerpVectors(port, pouch, smoothstep(0.68, 1, u));
        if (u >= 0.6 && !s.snd) { s.snd = true; Sound.play('shell_in', { vol: 0.5 }); this.kickRZ.v += 1.2; }
        if (u >= 1) this.shell = null;
      } else L.lerpVectors(m.guard, pouch, k);
    }
    if (m.mag && m.magBase) { m.mag.position.copy(m.magBase); m.mag.position.y += magOff; m.mag.position.z += magZ; m.mag.rotation.x = magTilt; m.mag.visible = magVis; }
    this.handMag.visible = handMag;
    if (m.bolt && m.boltBase && this.bolt <= -1) { m.bolt.position.copy(m.boltBase); m.bolt.position.z += boltZ; m.bolt.rotation.copy(m.boltRot); m.bolt.rotation.z += boltUp * 1.2; }
    // Bolt action (AWP / SSG) after each shot: up, back, forward, down; the left hand works it
    if (this.bolt > -1 && m.bolt) {
      this.bolt += dt / 0.95;
      const T = this.bolt;
      if (T >= 0) {
        if (!this.boltSnd) { this.boltSnd = true; Sound.play('awpbolt', { vol: 0.55 }); }
        const up = smoothstep(0, 0.15, T) * (1 - smoothstep(0.75, 0.9, T));
        const back = smoothstep(0.2, 0.38, T) * (1 - smoothstep(0.5, 0.7, T));
        m.bolt.rotation.z = m.boltRot.z + up * 1.2;
        m.bolt.position.z = m.boltBase.z + back * 0.08;
        rot.z += up * 0.12; rot.x += up * 0.05; pos.x -= up * 0.01;
        L.copy(m.bolt.position).add(_vmT.set(0.05, -0.01, 0.02));
        leftVis = true;
        if (back > 0.9 && !this.boltShell) { this.boltShell = true; const p = this.worldOf(m.eject.position, _vmA); Effects.shell(p, _vmB.set(rand(1.2, 2.0), rand(1.0, 1.8), rand(-0.3, 0.3)).applyQuaternion(this.camera.quaternion).add(actor.vel), true); }
        if (T >= 1) { this.bolt = -1; this.boltShell = false; m.bolt.position.copy(m.boltBase); m.bolt.rotation.copy(m.boltRot); }
      }
    }
    // Pump action after each shotgun blast
    if (m.pump && m.pumpBase) {
      if (this.pumpT > -1) {
        this.pumpT += dt / 0.55;
        const T = this.pumpT;
        if (T >= 0) {
          if (!this.pumpSnd) { this.pumpSnd = true; Sound.play('pump', { vol: 0.6 }); }
          pumpZ = 0.075 * (smoothstep(0, 0.3, T) * (1 - smoothstep(0.55, 0.85, T)));
          rot.x += pumpZ * 1.2; rot.z += pumpZ * 1.0;
          if (T > 0.3 && !this.pumpShell) { this.pumpShell = true; const p = this.worldOf(m.eject.position, _vmA); Effects.shell(p, _vmB.set(rand(1.2, 2.2), rand(1.0, 1.8), rand(-0.3, 0.3)).applyQuaternion(this.camera.quaternion).add(actor.vel), true, true); }
          if (T >= 1) { this.pumpT = -1; this.pumpShell = false; }
        }
      }
      m.pump.position.copy(m.pumpBase); m.pump.position.z += pumpZ;
      if (!this.reload) L.copy(m.guard).add(_vmT.set(0, 0, pumpZ));
    }
    // Pistol slide
    if (m.slide) {
      this.slideBack = this.slideBack === 1 ? (this._sbT = (this._sbT || 0) + dt, this._sbT > 0.05 ? (this._sbT = 0, 0) : 1) : this.slideBack;
      m.slide.position.z = m.slideBase.z + (this.slideBack ? 0.035 : 0);
    }
    // Inspect: turn the gun to show its left side, then roll it over to the right, with a mag check on rifles
    if (this.inspect >= 0) {
      this.inspect += dt / 3.2;
      const T = this.inspect;
      const a = smoothstep(0, 0.18, T) * (1 - smoothstep(0.42, 0.55, T));
      const b = smoothstep(0.5, 0.64, T) * (1 - smoothstep(0.86, 1, T));
      rot.y += a * 1.05 - b * 0.55; rot.z += a * 0.5 - b * 1.1; rot.x += a * 0.25 + b * 0.3;
      pos.x -= a * 0.07 + b * 0.04; pos.z += a * 0.06 + b * 0.02; pos.y += b * 0.02;
      if (m.mag && m.magBase && !this.reload && (type === 'rifle' || type === 'smg')) {
        const mc = smoothstep(0.52, 0.62, T) * (1 - smoothstep(0.72, 0.82, T));
        m.mag.position.y -= mc * 0.03; m.mag.rotation.x = mc * 0.12;
        L.copy(m.magWell || m.guard).add(_vmT.set(0, -0.06 - mc * 0.03, 0.01));
        if (mc > 0.5 && !this.inspectS.o) { this.inspectS.o = 1; Sound.play('magout', { vol: 0.3 }); }
        if (T > 0.78 && !this.inspectS.i) { this.inspectS.i = 1; Sound.play('magin', { vol: 0.35 }); this.kickRX.v += 1; }
      }
      if (T >= 1) this.inspect = -1;
    }
    // Knife
    if (this.knife) {
      const k = this.knife; k.t += dt / (k.type === 'stab' ? 0.75 : 0.42);
      const T = k.t, sd = k.n % 2 ? -1 : 1;
      if (k.type === 'slash') {
        const s = Math.sin(clamp(T, 0, 1) * Math.PI);
        const sw = easeInOut(clamp(T * 1.3, 0, 1));
        rot.y += (0.9 - sw * 2.0) * sd * s * 1.2; rot.z += -0.6 * s * sd; rot.x += 0.3 * s;
        pos.x += (-0.08 * sw) * sd * s; pos.z -= 0.08 * s;
      } else {
        const wind = smoothstep(0, 0.25, T) * (1 - smoothstep(0.3, 0.4, T));
        const thrust = smoothstep(0.28, 0.4, T) * (1 - smoothstep(0.55, 0.95, T));
        pos.z += wind * 0.06 - thrust * 0.2; rot.x += wind * 0.5 - thrust * 0.2; pos.x -= thrust * 0.06; rot.y += thrust * 0.4;
      }
      if (T >= 1) this.knife = null;
    }
    // Throwables
    if (this.nade) {
      const n = this.nade; n.t += dt;
      if (n.s === 'pin') {
        const k = smoothstep(0, 0.3, n.t);
        pos.z += k * 0.06; pos.y += k * 0.02; rot.x -= k * 0.5;
        if (m.pin) { m.pin.position.x = -0.018 - smoothstep(0.05, 0.25, n.t) * 0.08; m.pin.visible = n.t < 0.28; }
        leftVis = n.t < 0.35; L.set(-0.06, 0.06, 0);
      } else {
        const k = smoothstep(0, 0.12, n.t);
        pos.z -= k * 0.25; pos.y += k * 0.08; rot.x += k * 1.0;
        m.group.visible = n.t < 0.11;
      }
    } else if (type === 'grenade') { m.group.visible = true; if (m.pin) { m.pin.visible = true; m.pin.position.x = -0.018; } }
    // Planting the C4
    if (this.plant >= 0) {
      this.plant += dt;
      pos.y -= smoothstep(0, 0.4, this.plant) * 0.04; pos.z -= smoothstep(0, 0.4, this.plant) * 0.04;
      rot.x += Math.sin(this.plant * 22) * 0.008;
      L.set(-0.03 + Math.sin(this.plant * 17) * 0.01, 0.1, -0.01);
    }
    if (type === 'c4') { leftVis = true; if (this.plant < 0) L.set(-0.08, 0.0, 0.03); }

    // Butterfly knife: keyframed blade / bite handle angles + wrist motion
    if (m.bfly) {
      let A = 0, Bk = 0;
      const an = this.bfAnim;
      if (an) {
        an.t += dt;
        const keys = ViewModel.BFLY[an.k], v = sampleKeys(keys, an.t, _bfv);
        A = v[1]; Bk = v[2];
        rot.x += v[3]; rot.y += v[4]; rot.z += v[5]; pos.x += v[6]; pos.y += v[7]; pos.z += v[8];
        this._bfRoll = keys[0].length > 9 ? v[9] : 0;
        for (const [tt, name] of ViewModel.BFLY_SND[an.k]) if (an.t >= tt && !an.s[tt]) { an.s[tt] = 1; Sound.play(name, { vol: name === 'bfly_click' ? 0.55 : 0.4, rate: rand(0.95, 1.08) }); }
        if (an.t >= keys[keys.length - 1][0]) this.bfAnim = null;
      }
      m.bfly.blade.rotation.x = A; m.bfly.bite.rotation.x = Bk;
      if (!an) this._bfRoll = 0;
    }
    m.group.position.copy(pos);
    m.group.rotation.set(rot.x, rot.y, rot.z, 'YXZ');
    m.group.updateMatrix();
    m.group.matrixWorldNeedsUpdate = true;

    // Arms
    const grip = _vmA.copy(m.grip).applyMatrix4(m.group.matrix);
    this.handR.position.copy(grip);
    this.handR.quaternion.setFromEuler(m.group.rotation);
    if (type === 'knife') { this.handR.rotateX(-Math.PI / 2); this.handR.rotateY(0.1); }
    else if (type === 'grenade') this.handR.rotateX(-0.2);
    else if (type === 'pistol') this.handR.rotateX(-0.22);   // the fist follows the grip's rake
    const er = pose.er || ViewModel.POSE.rifle.er;
    const elbowR = _vmB.set(pos.x + er[0], pos.y + er[1], pos.z + er[2]);
    this.placeArm(this.armR, elbowR, _vmT2.copy(grip).add(_vmT3.set(0.01, -0.02, 0.05).applyQuaternion(this.handR.quaternion)));
    this.handL.visible = this.armL.visible = leftVis;
    if (leftVis) {
      const lw = _vmC.copy(L).applyMatrix4(m.group.matrix);
      this.handL.position.copy(lw);
      this.handL.quaternion.setFromEuler(m.group.rotation);
      if (handMag) this.handL.rotateZ(0.4);
      const el = pose.el || ViewModel.POSE.rifle.el;
      const elbowL = _vmB.set(lw.x + el[0], lw.y + el[1], lw.z + el[2]);
      this.placeArm(this.armL, elbowL, _vmT2.copy(lw).add(_vmT3.set(-0.01, -0.025, 0.045).applyQuaternion(this.handL.quaternion)));
    }
    if (m.bfly && this._bfRoll) { m.group.rotateZ(this._bfRoll); m.group.updateMatrix(); }
    // Muzzle flash, light and the wisp of smoke that follows a shot
    this.flashT += dt;
    const fv = this.flashT < 0.035;
    this.flash.visible = fv && !def.suppressed;
    this.mflight.intensity = this.flashT < 0.05 ? (def.suppressed ? 0.6 : 3.5) * (1 - this.flashT / 0.05) : 0;
    if (fv || this.mflight.intensity > 0) {
      const mp = _vmA.copy(m.muzzle.position).applyMatrix4(m.group.matrix);
      this.flash.position.copy(mp); this.flash.quaternion.copy(this.handR.quaternion);
      this.flashFront.rotation.z += 1.7;
      this.mflight.position.copy(mp);
    }
    if (this.smokeT > 0) {
      this.smokeT -= dt;
      if (Math.random() < dt * 40) { const p = this.worldOf(m.muzzle.position, _vmA); Effects.muzzleSmoke(p, _vmB.set(0, 0, -1).applyQuaternion(this.camera.quaternion)); }
    }
  }
  placeArm(mesh, a, b) {
    const d = _vmD.subVectors(b, a); const L = d.length();
    mesh.position.copy(a).addScaledVector(d, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, d.multiplyScalar(1 / L));
    mesh.scale.set(1, L / 0.332, 1);
  }
  muzzleWorld(out) {
    if (!this.cur) return out.set(0, 0, 0);
    const mp = _vmA.copy(this.cur.muzzle.position).applyMatrix4(this.cur.group.matrix);
    return out.copy(mp).applyMatrix4(this.camera.matrixWorld);
  }
}
// Base hold pose per weapon class (camera space): p position, r rotation, er right elbow offset (from the gun), el left elbow offset (from the left hand)
ViewModel.POSE = {
  rifle:   { p: [0.13, -0.132, -0.36], r: [0.0, 0.05, 0], er: [0.12, -0.2, 0.24], el: [-0.13, -0.22, 0.22] },
  smg:     { p: [0.12, -0.125, -0.33], r: [0.0, 0.05, 0], er: [0.12, -0.2, 0.24], el: [-0.12, -0.22, 0.2] },
  sniper:  { p: [0.135, -0.168, -0.33], r: [0.0, 0.045, 0], er: [0.12, -0.2, 0.24], el: [-0.13, -0.22, 0.22] },
  shotgun: { p: [0.13, -0.15, -0.34], r: [0.0, 0.05, 0], er: [0.12, -0.2, 0.24], el: [-0.13, -0.22, 0.22] },
  pistol:  { p: [0.095, -0.118, -0.34], r: [0.0, 0.07, 0], er: [0.12, -0.2, 0.26], el: [-0.13, -0.2, 0.24] },
  knife:   { p: [0.15, -0.15, -0.3], r: [0.25, -0.35, -0.25], er: [0.1, -0.2, 0.24], el: [-0.1, -0.2, 0.2] },
  bfly:    { p: [0.115, -0.125, -0.25], r: [0.12, 0.28, -0.55], er: [0.1, -0.2, 0.24], el: [-0.1, -0.2, 0.2] },
  grenade: { p: [0.14, -0.15, -0.3], r: [0.2, 0.2, -0.2], er: [0.1, -0.2, 0.24], el: [-0.1, -0.2, 0.2] },
  c4:      { p: [0.0, -0.18, -0.36], r: [0.55, 0, 0], er: [0.14, -0.2, 0.22], el: [-0.14, -0.2, 0.22] },
};
const _vmP = new THREE.Vector3(), _vmR = new THREE.Vector3(), _vmL = new THREE.Vector3(), _vmT = new THREE.Vector3(), _vmT2 = new THREE.Vector3(), _vmT3 = new THREE.Vector3();
const _vmA = new THREE.Vector3(), _vmB = new THREE.Vector3(), _vmC = new THREE.Vector3(), _vmD = new THREE.Vector3();

// Keyframe sampling: keys = [[t, ch1, ch2, ...]], smoothstep easing within a segment
function sampleKeys(keys, t, out) {
  const n = keys.length;
  if (t <= keys[0][0]) { for (let i = 0; i < keys[0].length; i++) out[i] = keys[0][i]; return out; }
  if (t >= keys[n - 1][0]) { for (let i = 0; i < keys[n - 1].length; i++) out[i] = keys[n - 1][i]; return out; }
  let k = 0; while (k < n - 2 && t >= keys[k + 1][0]) k++;
  const a = keys[k], b = keys[k + 1], u = (t - a[0]) / (b[0] - a[0]), e = u * u * (3 - 2 * u);
  for (let i = 0; i < a.length; i++) out[i] = a[i] + (b[i] - a[i]) * e;
  out[0] = t;
  return out;
}
const _bfv = [], _rlv = [];
// Reload pose keys: [T (fraction of reload time), rx, ry, rz, x, y, z] added to the hold pose. Negative rz cants
// the gun so its underside (mag well) turns toward the screen centre; 'tac' still has a round chambered,
// 'empty' adds the bolt/slide release around 0.74-0.82.
{
  const Z = [0, 0, 0, 0, 0, 0];
  const rifleMag = [[0, ...Z], [0.13, 0.16, 0.14, -0.55, -0.035, 0.045, 0.02], [0.2, 0.13, 0.14, -0.58, -0.035, 0.04, 0.02], [0.25, 0.2, 0.14, -0.62, -0.035, 0.05, 0.02],
    [0.44, 0.15, 0.16, -0.58, -0.04, 0.045, 0.02], [0.6, 0.25, 0.17, -0.5, -0.04, 0.055, 0.015], [0.68, 0.14, 0.13, -0.46, -0.03, 0.04, 0.02]];
  const pistolMag = [[0, ...Z], [0.12, 0.12, 0.07, -0.4, -0.018, 0.035, 0.03], [0.22, 0.16, 0.07, -0.44, -0.018, 0.04, 0.03],
    [0.44, 0.12, 0.09, -0.4, -0.022, 0.035, 0.03], [0.6, 0.2, 0.09, -0.34, -0.022, 0.045, 0.03], [0.68, 0.11, 0.07, -0.3, -0.016, 0.03, 0.03]];
  ViewModel.RELOAD = {
    rifle: {
      tac: [...rifleMag, [0.9, ...Z]],
      empty: [...rifleMag, [0.74, 0.06, 0.05, -0.14, -0.01, 0.025, 0.02], [0.8, 0.04, 0.05, -0.12, -0.01, 0.02, 0.03], [0.83, 0.1, 0.05, -0.12, -0.01, 0.03, 0.015], [0.95, ...Z]],
    },
    pistol: {
      tac: [...pistolMag, [0.86, ...Z]],
      empty: [...pistolMag, [0.76, 0.06, 0.12, -0.15, -0.025, 0.03, 0.03], [0.8, 0.16, 0.12, -0.12, -0.02, 0.04, 0.03], [0.94, ...Z]],
    },
  };
}
// Butterfly knife keys: [time, blade α, bite β, wrist rx, ry, rz, offset x, y, z]; closed = (π, π), open = (0, 0) ≡ (2π, 2π)
{
  const PI = Math.PI, P2 = PI * 2;
  ViewModel.BFLY = {
    draw: [
      [0.0, PI, PI, 0.55, 0.0, 0.35, 0.02, -0.1, 0.03],
      [0.16, PI, PI, 0.18, 0.0, 0.12, 0.0, -0.025, 0.0],
      [0.4, P2, PI, -0.28, 0.0, -0.06, 0.0, 0.0, -0.02],
      [0.62, P2, P2, 0.14, 0.0, 0.02, 0.0, 0.006, 0.0],
      [0.82, P2, P2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    ],
    inspect: [
      [0.0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0.5, 0, 0, -0.12, 0.38, 0.35, -0.03, 0.026, -0.03, 0],
      [1.05, 0, 0, -0.2, 0.42, 0.5, -0.032, 0.03, -0.03, 0],
      [1.3, 0, 0, 0.05, 0.2, 0.05, -0.01, 0.01, 0.0, 0],
      [1.55, 0, PI, 0.16, 0.15, 0.0, -0.01, 0.012, 0.0, 0],
      [1.85, PI, PI, -0.2, 0.12, 0.0, -0.01, 0.0, 0.0, 0],
      [2.0, PI, PI, 0.05, 0.1, 0.0, 0.0, 0.01, 0.0, 0],
      [2.65, PI, PI, 0.05, 0.1, 0.0, -0.01, 0.03, -0.01, P2],
      [2.8, PI, PI, 0.1, 0.1, 0.0, 0.0, 0.0, 0.0, P2],
      [3.1, P2, PI, -0.3, 0.1, 0.0, 0.0, 0.0, -0.02, P2],
      [3.38, P2, P2, 0.15, 0.1, 0.0, 0.0, 0.006, 0.0, P2],
      [3.6, P2, P2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, P2],
      [4.15, P2, P2, 0.3, -0.75, -0.15, -0.03, 0.03, -0.025, P2],
      [4.6, P2, P2, 0.34, -0.8, -0.22, -0.03, 0.032, -0.025, P2],
      [5.1, P2, P2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, P2],
    ],
  };
  ViewModel.BFLY_SND = {
    draw: [[0.18, 'bfly_swish'], [0.4, 'bfly_click'], [0.45, 'bfly_swish'], [0.62, 'bfly_click']],
    inspect: [[1.3, 'bfly_swish'], [1.55, 'bfly_click'], [1.6, 'bfly_swish'], [1.85, 'bfly_click'], [2.1, 'bfly_swish'], [2.85, 'bfly_swish'], [3.1, 'bfly_click'], [3.15, 'bfly_swish'], [3.38, 'bfly_click']],
  };
}
