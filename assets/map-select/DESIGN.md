# Tactical Intelligence Interface: The Protocol of Precision

### 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Protocol of Precision."** 

We are moving away from the "friendly SaaS dashboard" and toward a high-stakes, tactical command center. This system is designed to feel like a high-performance military OS—intentional, sharp, and authoritative. We achieve this by rejecting the standard "boxed-in" web grid in favor of **Intentional Asymmetry** and **Tonal Depth**. Elements should feel docked rather than floating; information should feel "scanned" rather than read. The 0px radius is not a limitation—it is a statement of rigidity and discipline.

---

### 2. Colors & Surface Architecture
The palette is rooted in high-contrast combat aesthetics: deep charcoals, aggressive reds, and surgical off-whites.

*   **The "No-Line" Rule:** Under no circumstances are 1px solid borders to be used to separate sections. Structure must be defined through **Background Color Shifts**. For example, a `surface_container_low` section sitting directly on top of `background` creates a clear boundary through value contrast alone.
*   **Surface Hierarchy & Nesting:** Use the surface-container tiers to create a "nested" mechanical feel.
    *   **Level 0 (Base):** `surface` (#0a141e) - The main canvas.
    *   **Level 1 (Dock):** `surface_container_lowest` (#050f19) - For recessed areas like sidebars or secondary navigation.
    *   **Level 2 (Active Panels):** `surface_container` (#17202b) - The primary workstation area.
    *   **Level 3 (Interactive Blocks):** `surface_container_high` (#212b35) - For cards and modules that require immediate focus.
*   **The "Glass & Gradient" Rule:** To prevent the UI from feeling "flat" or "cheap," use Glassmorphism for floating command overlays. Utilize `surface_variant` at 60% opacity with a heavy backdrop-blur (20px+) to simulate a translucent heads-up display (HUD).
*   **Signature Textures:** For primary CTAs and critical alerts, use a subtle linear gradient from `primary` (#ffb3b2) to `primary_container` (#ff525d). This adds a "glow" effect reminiscent of an energized plasma screen.

---

### 3. Typography
The typography is the backbone of the "Tactical Editorial" look. We use two specific voices:

*   **Display & Headline (Space Grotesk):** This is your tactical readout. It should feel angular and technical. Use `display-lg` for tournament titles and `headline-sm` for section headers. Always use uppercase for `label-md` and `label-sm` to mimic military coding.
*   **Body & Title (Inter):** This is your intelligence data. Inter provides the high-legibility required for complex bracket data and player stats. 
*   **The Scale:** 
    *   Use `display-md` (2.75rem) for hero stats (e.g., KDA, Win Rate) to create a "Big Type" editorial impact.
    *   Combine `label-sm` (0.6875rem) with `on_surface_variant` for metadata to create a "technical blueprint" aesthetic.

---

### 4. Elevation & Depth
In this system, depth is a product of light and layering, not drop shadows.

*   **The Layering Principle:** Stack `surface_container_highest` modules on `surface_container_low` foundations. This "Mechanical Stacking" creates a sense of physical hardware components being slotted into a motherboard.
*   **Ambient Shadows:** If a component must float (e.g., a modal or a context menu), do not use a black shadow. Use a shadow tinted with `surface_container_lowest` at 8% opacity with a 32px blur. It should feel like an ambient occlusion effect in a 3D engine, not a 2D drop shadow.
*   **The "Ghost Border" Fallback:** For buttons or inputs that need to stand out against a similar background, use a "Ghost Border": the `outline_variant` token at 15% opacity. This provides a "wireframe" look that reinforces the tactical theme.

---

### 5. Components

*   **Buttons:**
    *   **Primary:** `primary_container` background, `on_primary_container` text. Hard 0px edges. High-contrast.
    *   **Tertiary/Ghost:** No background, `outline` ghost border (20% opacity). On hover, fill with `primary` at 10% opacity.
*   **Input Fields:** Use `surface_container_lowest` for the field background. No bottom border. Instead, use a 2px vertical accent bar of `primary` on the far left of the input only when focused.
*   **Cards & Lists:** **Strictly forbid divider lines.** Separate player lists or match schedules using a 0.4rem (`spacing.2`) gap and alternating backgrounds between `surface_container` and `surface_container_high`.
*   **Tactical Chips:** Use `secondary_container` for the background and `on_secondary_container` for the text. Use these for player roles (Duelist, Initiator) or match status.
*   **The "Live" Indicator:** For live tournaments, use a `primary` (Valorant Red) pulse animation on a small square (0px radius) next to a `label-md` "LIVE" tag.

---

### 6. Do’s and Don’ts

**Do:**
*   **Do** use extreme white space. Use `spacing.16` (3.5rem) between major sections to let the tactical data breathe.
*   **Do** use asymmetrical layouts. A 2/3 and 1/3 column split feels more like a command console than a 50/50 split.
*   **Do** use "Tech Accents"—small, non-functional decorative elements like a `primary` color pixel in the corner of a panel to simulate "UI hardware."

**Don't:**
*   **Don't** ever use a border-radius. Even a 1px radius breaks the "Protocol of Precision."
*   **Don't** use standard blue for links. Use `tertiary` (#60dcb0) for a "system-safe" green or stay within the `primary` red scale.
*   **Don't** use generic icons. Use sharp, stroke-based iconography that matches the weight of Space Grotesk.