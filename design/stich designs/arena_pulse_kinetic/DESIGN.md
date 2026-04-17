# Design System Strategy: The Electric Atmosphere

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Cortical Pulse"**

This design system is engineered to capture the kinetic energy of a live stadium environment while maintaining the sophisticated precision of a premium sports broadcast. We are moving beyond the "utility app" look to create a **High-End Editorial** experience.

The design breaks the traditional "box-and-grid" template through **intentional asymmetry** and **tonal depth**. By utilizing a deep `#131313` base, we create a light-absorbent canvas that allows our high-energy accents—Electric Blue, Amber, and Deep Purple—to "glow" with purpose. The layout should feel like a living dashboard: responsive, data-rich, and layered, mimicking the multi-dimensional experience of being in the stands.

---

## 2. Colors & Surface Philosophy

Our palette isn't just for decoration; it’s a functional map of the stadium experience.

*   **Primary (`#00daf8`):** The Navigation Engine. Used for movement and primary actions.
*   **Secondary (`#ffe2ab` / `#ffbf00`):** The "Service" Layer. Reserved for hunger, thirst, and urgency (food, alerts).
*   **Tertiary (`#edb1ff` / `#c070de`):** The "Human" Layer. Used exclusively for user location and personal identity within the crowd.

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. They feel "cheap" and interrupt the visual flow. Instead, define boundaries through:
*   **Background Shifts:** Move from `surface` to `surface-container-low`.
*   **Tonal Transitions:** Use vertical white space and color blocking to separate the "Map" from "Stats."

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the `surface-container` tiers to create "nested" depth:
1.  **Base Layer:** `surface` (#131313)
2.  **Sectional Content:** `surface-container-low` (#1c1b1b)
3.  **Interactive Cards:** `surface-container-high` (#2a2a2a)
4.  **Floating Elements:** `surface-container-highest` (#353534)

### The "Glass & Gradient" Rule
To inject "soul" into the dark theme, main CTAs and hero headers should use a subtle gradient from `primary` (#00daf8) to `primary_container` (#009fb5). For floating stadium navigation, apply **Glassmorphism**: use semi-transparent surface colors with a `backdrop-blur` of 20px to allow stadium light to "bleed" through the UI.

---

## 3. Typography: The Editorial Edge

We use a high-contrast typography pairing to balance technical data with aggressive energy.

*   **Display & Headlines (Space Grotesk):** This is our "Broadcaster" font. It is bold, slightly eccentric, and highly legible. Use `display-lg` (3.5rem) for live scores and `headline-md` (1.75rem) for section headers.
*   **Title & Body (Plus Jakarta Sans):** Our "Information" font. It is modern, friendly, and clean. It handles the high-density data of player stats and concession menus without fatigue.

**Hierarchy Note:** Always lead with a heavy weight in `headline-sm` to anchor a module, then use `body-md` in `on_surface_variant` for supporting metadata to ensure the eye hits the most important data point first.

---

## 4. Elevation & Depth: Tonal Layering

Shadows and lines are crutches. In this design system, we use **Tonal Layering**.

*   **The Layering Principle:** To lift a card, place a `surface-container-highest` card on a `surface-container-low` background. This creates a natural "pop" that feels premium and intentional.
*   **Ambient Shadows:** When an element must float (e.g., a "Buy Tickets" FAB), use an extra-diffused shadow. 
    *   *Blur:* 32px | *Spread:* -4px | *Opacity:* 15% | *Color:* Tonal match to `surface_container_lowest`.
*   **The Ghost Border Fallback:** For high-glare outdoor accessibility, if a border is required, use `outline_variant` at 15% opacity. Never use 100% opaque borders.
*   **Glassmorphism:** Use for persistent "Live Scores" bars. It integrates the UI into the stadium's visual noise rather than fighting it.

---

## 5. Components

### Buttons & Chips
*   **Primary Action:** `primary` (#00daf8) background with `on_primary` text. Use `full` (9999px) rounded corners for a modern, fast feel.
*   **Food/Alert Chips:** `secondary_container` (#ffbf00) with a subtle gradient.
*   **Selection Chips:** Use `surface-container-high` for unselected and `primary` for selected. No borders.

### Cards & Lists
*   **The Divider Ban:** Strictly forbid the use of divider lines. Separate list items using 8px or 12px of vertical white space or alternating `surface-container-low` and `surface-container-highest` backgrounds.
*   **Stadium Map Cards:** Use `lg` (1rem) corner radius. Elements should "peek" off-screen to suggest a larger world, creating a horizontal "strip" feel.

### Specialized Components
*   **The Pulse Meter:** A custom data visualization using a gradient stroke of `primary` to `tertiary` to show crowd noise or game intensity.
*   **The Ghost Input:** Search fields should use `surface_container_low` with no border, using a `primary` color cursor as the only "active" signal.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** lean into the "dark mode" aesthetics. Text should be `on_surface` (#e5e2e1) to ensure high contrast against the `#131313` background.
*   **Do** use asymmetrical margins (e.g., a 24px left margin and 16px right margin for a hero card) to create a dynamic, editorial rhythm.
*   **Do** prioritize "Glanceability." A fan at a game has 2 seconds to look at their phone. Bold headers and vibrant accents must do the heavy lifting.

### Don’t:
*   **Don’t** use pure white (#FFFFFF). It causes eye strain in dark stadium environments. Use `on_surface` (#e5e2e1).
*   **Don’t** use sharp 90-degree corners. Everything must feel "friendly" yet "professional" through our defined roundedness scale (0.5rem to 1.5rem).
*   **Don’t** clutter the screen with labels. Use icons (e.g., a burger icon in `secondary`) and bold values (e.g., "SEC 104") to communicate status instantly.