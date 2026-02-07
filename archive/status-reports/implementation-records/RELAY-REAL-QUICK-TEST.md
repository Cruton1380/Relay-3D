# Relay-Real Graphics + Proximity - Quick Test

**60 Second Validation Guide**

---

## 🚀 Quick Test (1 minute)

### 1. Hard Refresh
```
Close ALL tabs → DevTools (F12) → Right-click Refresh → "Empty Cache and Hard Reload"
```

### 2. Import File
Drag any `.xlsx` file onto drop zone

### 3. Enter 3D View
- Auto-switches to Tree Scaffold view
- Click canvas to engage pointer lock (FREE-FLY mode)

### 4. Visual Check: Graphics Upgrades

Look for:
- ✅ **Sheets:** Soft translucent (not bright neon cyan)
- ✅ **Thin bright edges** around sheets
- ✅ **Cells:** Small cubes visible on sheets
- ✅ **Filaments:** Visibly **thicker near branches**, thinner near cells
- ✅ **Micro-timeboxes:** Subtle rings (dim by default)
- ✅ **Labels:** Clean text above sheets

**Before/After:**
- BEFORE: Bright cyan glowing slabs
- AFTER: Soft translucent shells with bright edges

---

### 5. Test: Proximity Reveal

**Approach Test:**
1. Position camera FAR from any sheet (> 25 units away)
   - Use WASD to move, mouse to look
2. Fly TOWARD a sheet endpoint
3. **Watch as you approach:**
   - Sheet becomes MORE VISIBLE (opacity increases)
   - Cells become LARGER (scale increases)
   - Transition is SMOOTH (not sudden)

**Retreat Test:**
1. Get close to sheet (< 10 units)
2. Fly AWAY from sheet
3. **Watch as you retreat:**
   - Sheet becomes LESS VISIBLE (opacity decreases)
   - Cells become SMALLER (scale decreases)
   - Smooth fade out

---

### 6. Test: Distance-Aware Labels

1. **Far from sheet** (> 20 units):
   - Label shows: `Procurement` (name only)

2. **Fly closer** (10-20 units):
   - Label updates: `Procurement` + `ERI 72`

3. **Fly very close** (< 10 units):
   - Label shows: `Procurement` + `ERI 72` + `3 drifts`

**Note:** Label updates dynamically as you move

---

### 7. Test: Micro-Timebox Hover

1. **Hover over any ring** on filament (golden/amber colored)
2. Ring should **brighten** (from dim to bright)
3. Preview panel shows:
   ```
   ⏰ tb_03 | commits 20–29 | VERIFIED | conf 0.82
   ```
4. Move mouse away
5. Ring returns to **dim** state

---

## ✅ Pass Criteria

### Graphics Quality ✅
- [ ] Sheets: Translucent (not neon)
- [ ] Bright edges visible
- [ ] Filaments: Visibly tapered
- [ ] Micro-timeboxes: Dim by default
- [ ] Labels: Readable but not overwhelming

### Proximity Reveal ✅
- [ ] Sheet opacity increases as you approach
- [ ] Cells scale up as you approach
- [ ] Transition is smooth (not instant)
- [ ] Works in reverse (fade out when retreating)

### Distance-Aware Labels ✅
- [ ] Far: Name only
- [ ] Mid: Name + ERI
- [ ] Close: Name + ERI + details

### Hover Interaction ✅
- [ ] Micro-timeboxes brighten on hover
- [ ] Preview shows commit range
- [ ] Return to dim when not hovered

---

## 🐛 Common Issues

### "Sheets still bright neon cyan"
**Fix:** Hard refresh didn't work, try:
- Close browser completely
- Reopen and hard refresh again
- Check console for syntax errors

### "No proximity effect"
**Fix:** System runs every frame, check:
- Camera is moving (WASD keys)
- Sheets exist in scene (press `I` to verify)
- Console shows no errors

### "Labels not updating"
**Fix:** 
- Move closer/further to trigger update
- Labels update every frame based on distance
- Check console for errors

### "Micro-timeboxes not visible"
**Fix:**
- They're very subtle by default (intentional)
- Hover over filaments to brighten them
- Look for golden/amber colored rings

---

## 🎯 Quick Validation Commands

### In Console:

```javascript
// Check sheets exist
scene.traverse(obj => {
    if (obj.userData?.isSheetFill) {
        console.log('Sheet:', obj, 'opacity:', obj.material.opacity);
    }
});

// Check proximity system is running
// (It runs every frame in animate3D, no explicit logs)

// Check micro-timeboxes
let count = 0;
scene.traverse(obj => {
    if (obj.userData?.type === 'microTimebox') count++;
});
console.log('Micro-timeboxes:', count);
```

---

## 📊 Expected Behavior

### At Different Distances

| Distance | Sheet Opacity | Cell Scale | Label Content |
|----------|---------------|------------|---------------|
| > 25 units (far) | ~0.20 (subtle) | 1.0 (normal) | Name only |
| 10-25 units (mid) | 0.20-0.60 (gradual) | 1.0-1.3 (gradual) | Name + ERI |
| < 10 units (near) | ~0.60 (visible) | ~1.3 (larger) | Name + ERI + details |

---

## 🚀 Success!

**If you see:**
1. ✅ Soft translucent sheets (not neon)
2. ✅ Tapered filaments (thick → thin)
3. ✅ Subtle micro-timeboxes (dim by default)
4. ✅ Proximity fade in/out works
5. ✅ Labels update with distance
6. ✅ Hover brightens timeboxes

**Then ALL implementations are WORKING! 🎉**

---

## 📝 One-Line Test

**Walk toward a sheet and watch it fade in smoothly while cells get larger and labels show more detail—that's the proximity reveal system working.**

---

**Time to test:** ~60 seconds  
**Hard refresh required:** YES (critical!)
