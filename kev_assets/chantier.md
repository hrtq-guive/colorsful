# CHANTIER: Perfectionist Mode & Home Page Refinement

## Current State (Status: WIP)
We have successfully implemented the **"Perfectionist Hybrid"** nebula and promoted it to the Home Page (`/`).
- **Core (r < 25)**: Uses the "Gold Standard" home page logic (grid-based, density managed, seed-level HSL tuning).
- **Shell (r >= 25)**: Uses the perfectionist boundary detection with augmented videos (virtual yellow zone).
- **Previous Home**: Restored and accessible at `/previoushome`.

## The Issue: "Chaton" & White Videos
The user reported that the "Chaton" video (pure white / very light grey) is accessible but hard to reach instantly / feels hidden.
- **Initial Diagnosis**: 57+ achromatic videos were clustering at 0 degrees, pushing Chaton to Rank 2 or 3 and burying it.
- **Attempted Fix**: Implemented a "Golden Angle" distribution for low-saturation videos (S < 5%) to spread them around the circle.
- **User Feedback**: "No, still not perfect." -> **It seems Chaton is accessible but maybe not "prominent" enough or the distribution feels off.**

## Next Steps
1.  **Refine Achromatic Distribution**: instead of just blindly spreading them, we might need a specific "White Zone" that isn't just the dead center, or ensuring high-lightness videos always get priority in the visible layer.
2.  **Cursor Interaction**: Investigate why "it never appears with the cursor" despite being theoretically accessible. Check the `handleMouseMove` logic and the `getLogoMaxRadiusAtAngle` for 0 degrees.
3.  **Visual Polish**: Ensure the center transition doesn't look like a "hole" when these white videos are moved.

## Technical Context
- **File**: `web-app/src/components/LogoPage.jsx`
- **Logic**: Look for the `// Distribute achromatic videos (S < 5) across 360 degrees` comment block.



## KEVIN NOTES AND IDEAS

- Build a color palette like a playlist
- Eveytime i listen to a video, the color disappears or becomes black in its influence zone (i can reset) to try to explore all the videos 
- un petit fade quand la video se ferme et on revient au noir (peut-être le curseur qui revient à la place où on l'a laissé là où il y a la video)