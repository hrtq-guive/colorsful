# Future Feature: Expandable Grid Video Player

## Goal
When clicking a video tile in Grid or GridHistory, instead of opening a fullscreen modal, the grid should rearrange to create a 2x2 space where the video player expands inline.

## Requirements
- Click a tile → grid tiles shift to make space
- Video player expands to fill a 2x2 grid space (4 tiles)
- Position based on clicked tile location (left/center/right)
- Other tiles flow around the expanded player
- Smooth animation of grid reflow
- Close video → tiles flow back to original positions

## Technical Approach
1. Change from modal-based to inline expansion
2. Use CSS Grid with dynamic `grid-column-span` and `grid-row-span`
3. Track clicked tile position to determine expansion location
4. Animate grid transitions with CSS transitions
5. Update VideoContext to support inline mode vs modal mode

## Complexity
High - requires significant architectural changes to grid and video player systems.

## Status
Planned for after GIF generation completes.
