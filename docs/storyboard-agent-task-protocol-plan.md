# Storyboard Agent Task Protocol Plan

## Problem

The storyboard agent currently receives free-form text that can be wrapped as a full pipeline even when the user asks for a scoped action. A scoped request such as "only rewrite stage 5 for track 5-9, do not generate images" must not be able to rewrite track 1-4 or enqueue image jobs.

## Status

Implemented in `data/web/creative-canvas.js`. The frontend now builds a structured storyboard task envelope (`createStoryboardAgentTask`), sends it with `storyboardPipeline`, and enforces it in the bridge before any real write. Prompt wording remains guidance; scope, forbidden stages, and image-generation bans are enforced by code.

## Minimal Implementation

1. Add a small `StoryboardAgentTask` object in the Creative Canvas frontend.
2. Route storyboard user text into one of these intents:
   - `full_pipeline`
   - `stage5_rewrite_cards`
   - `generate_images`
   - `status_check`
3. Extract track scope from text when present, for example `track 5-9`.
4. Attach hard forbidden actions:
   - `rewrite_script_plan`
   - `rewrite_storyboard_table`
   - `generate_images`
5. Pass the task object with the `storyboardPipeline` socket event.
6. Enforce the task object in the frontend socket bridge:
   - reject `add_flowData_storyboard` if the written track is outside scope
   - reject `generate_storyboard` when images are forbidden
   - reject `save_flowData` changes to `scriptPlan` or `storyboardTable` when forbidden
7. Keep prompt instructions as guidance only; data writes are protected by code.

## Acceptance Check

For the prompt "continue stage 5, only process track 5-9, skip track 1-4, do not regenerate director plan/storyboard table, do not generate images":

- no image queue is created
- `scriptPlan` is not changed
- `storyboardTable` is not changed
- `add_flowData_storyboard` accepts only track 5, 6, 7, 8, 9
- writes to track 1, 2, 3, 4 are rejected
