# Blending Options for Logo Nebula

## Option 1: Gradient Interpolation Between Cells
**Status:** Ready to test
**Description:** Instead of hard color boundaries, interpolate colors between neighboring Voronoi cells. Each pixel gets a weighted blend of the 2-3 nearest video colors.
**Pros:** 
- Smooth, organic transitions like watercolor
- No blur needed
- Maintains color accuracy
**Cons:**
- More computationally intensive
- May lose some color definition

## Option 5: Distance-Based Color Mixing
**Status:** Currently implemented
**Description:** For each pixel, blend the 3-4 nearest videos weighted by inverse distance.
**Pros:**
- Organic, flowing gradients
- Maintains radial color structure
- No blur artifacts
**Cons:**
- Can be too smooth/blended
- May lose individual video color identity

---

To switch between options, change `BLEND_METHOD` in `LogoPage.jsx` line ~107.
