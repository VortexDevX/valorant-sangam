# Valorant Sangam UI Description

## UI Direction

This MVP will be functional first, but the interaction model should already feel like a tournament control panel instead of a generic CRUD dashboard.

The later visual pass will move it toward full Valorant styling, but even the basic version should follow these rules:

- sharp layout blocks, not soft rounded dashboard cards
- high-contrast hierarchy
- strong section labels
- tactical, bracket-room feel
- map-first presentation on veto screens
- no college branding
- no navigation from public home to admin routes

## Global Layout Rules

### Shared Behavior

- Desktop-first structure, but usable on mobile.
- Use a constrained main content width for readability.
- Keep screens divided into clear panels instead of long undifferentiated forms.
- Every page should have one dominant action at a time.
- Feedback should be explicit: loading, success, invalid input, deleted item, saved veto step.

### MVP Visual Baseline

- Background: dark neutral or muted charcoal base
- Foreground panels: slightly raised blocks with hard edges
- Accent color: red for primary actions and important highlights
- Secondary accent: off-white and muted gray for information
- Typography for MVP: system-safe fallback is acceptable now, later replaced with stronger Valorant-style pairing
- Buttons: rectangular, compact, command-like
- Inputs: simple but strict, clearly labeled

## Route-by-Route UI

## `/` Public Match History

### Purpose

This is the public event-facing page. It should feel clean and intentional, not admin-like.

### Main Content

- Hero title for the tournament or platform name
- Short supporting subtitle
- Match history list below
- Newest entries at the top

### Match Card Shape

Each match item should show:

- Team A name
- Team B name
- Final score
- Map played
- Note if present
- Created date/time in small secondary text

### Interaction

- No edit controls
- No delete controls
- No login controls
- No visible links to `/admin/add-match`
- No visible links to `/admin/map-select`

### Empty State

If no matches exist:

- show a simple empty message
- keep layout centered and intentional
- do not expose admin hints

## `/admin/add-match`

### Purpose

This is the tournament control page for managing completed matches.

### Unauthenticated State

Show only:

- page label
- username field
- password field
- login button
- invalid credential message if login fails

Important:

- no persistent login
- refresh returns to login form

### Authenticated State

Split into two clear sections:

1. Match form
2. Existing match list

### Match Form

Fields:

- Team A
- Team B
- Map dropdown with the 7 current maps
- Score input
- Note textarea

Actions:

- Add match when creating
- Save changes when editing
- Cancel edit when editing

### Match List

Each item should show the same information as the public page, but with controls:

- Edit
- Delete

Behavior:

- newest first
- delete should ask for confirmation
- edit should preload the selected match into the form
- after save, list updates immediately

### UX Tone

This page should feel like a production desk tool:

- efficient
- clear
- fast to scan
- minimal distractions

## `/admin/map-select`

### Purpose

This is the live veto operation screen for match officials or organizers.

### Unauthenticated State

Same as `/admin/add-match`:

- username
- password
- login button
- error state if invalid

### Authenticated State

This page should have three primary zones:

1. Series setup
2. Live veto board
3. Veto timeline / result summary

### Series Setup Panel

Shown before a veto session starts.

Inputs:

- Team A name
- Team B name
- Format selector: BO1, BO3, BO5
- Full 12-map list with exactly 7 selected

Primary action:

- Start veto

### Live Veto Board

This is the most important interactive area.

Display all 7 maps visually using the provided screenshots.

Each map tile should clearly indicate one of these states:

- available
- banned
- picked
- decider

Only valid maps for the current step should be clickable.

The board should always show:

- whose turn it is
- what action is required now
- remaining maps
- already picked maps

### Step Prompt

A strong status line should explain the current action, for example:

- Team A ban a map
- Team B pick map 2
- Team A choose starting side for Haven

### Side Selection

Whenever the current step is side selection:

- show only two explicit options: `ATK` and `DEF`
- associate that side choice with the correct picked or decider map
- clearly show who chose the side

### Timeline Panel

This should log the veto in order, step by step, for example:

- Team A banned Split
- Team B banned Breeze
- Team A picked Bind
- Team B chose DEF on Bind

This panel makes the flow understandable even if someone joins mid-process.

### Result Summary

Once veto is complete, show final ordered maps:

- map 1
- map 2
- map 3 if applicable
- map 4 if applicable
- decider if applicable

Each result line should include:

- map name
- who picked it, if picked
- who chose side
- chosen starting side

## UI State Rules

### Loading

- Buttons should disable while API calls are running.
- Use clear loading labels such as `Logging in...`, `Saving...`, `Applying veto...`.

### Errors

- Show human-readable validation errors near the relevant form or action area.
- Do not show raw server errors directly.

### Success Feedback

- Match saved
- Match updated
- Match deleted
- Veto created
- Veto step saved

These can be basic inline messages in MVP.

## Information Architecture

The project should feel like three separate surfaces:

- public results surface
- private results management surface
- private live veto surface

This separation matters more than navigation complexity.

The hidden-route requirement means the public page must stand fully on its own and never hint at internal tools.

## Future Valorant Visual Pass

Once functionality is complete, the UI pass should move the app toward:

- aggressive typography
- red tactical accents
- stronger framing and segmentation
- cinematic map cards
- animated step transitions in veto flow
- more authentic Valorant control-room feel

But none of that should block MVP functionality now.
