---
name: Serene Access
colors:
  surface: '#f9f9ff'
  surface-dim: '#d7dae5'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#ebedf9'
  surface-container-high: '#e5e8f3'
  surface-container-highest: '#dfe2ed'
  on-surface: '#181c23'
  on-surface-variant: '#434652'
  inverse-surface: '#2c3039'
  inverse-on-surface: '#edf0fc'
  outline: '#747783'
  outline-variant: '#c4c6d3'
  surface-tint: '#345ab0'
  primary: '#345ab0'
  on-primary: '#ffffff'
  primary-container: '#7da0fa'
  on-primary-container: '#003484'
  inverse-primary: '#b2c5ff'
  secondary: '#894f38'
  on-secondary: '#ffffff'
  secondary-container: '#feb295'
  on-secondary-container: '#79422c'
  tertiary: '#206965'
  on-tertiary: '#ffffff'
  tertiary-container: '#6baea9'
  on-tertiary-container: '#00403e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001847'
  on-primary-fixed-variant: '#154296'
  secondary-fixed: '#ffdbce'
  secondary-fixed-dim: '#ffb599'
  on-secondary-fixed: '#360f01'
  on-secondary-fixed-variant: '#6d3823'
  tertiary-fixed: '#aaefea'
  tertiary-fixed-dim: '#8fd3ce'
  on-tertiary-fixed: '#00201e'
  on-tertiary-fixed-variant: '#00504d'
  background: '#f9f9ff'
  on-background: '#181c23'
  surface-variant: '#dfe2ed'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1440px
  split-ratio: 50/50
  gutter: 24px
  margin-mobile: 20px
  stack-gap: 16px
---

## Brand & Style

The design system is centered on a **Modern Pastel** aesthetic, specifically tailored for a secure yet inviting Single Sign-On (SSO) experience. It balances the high-security expectations of authentication with a refreshing, approachable visual language. 

The style utilizes a **Corporate Modern** foundation infused with **Soft Minimalism**. Key attributes include:
- **Professional & Secure:** High legibility and clear structural hierarchy ensure user confidence.
- **Approachable & Fresh:** A departure from cold, industrial login screens, using warmth and soft geometry to reduce "login friction."
- **Split-Screen Layout:** Drawing from IMAGE_1, the interface is divided into a functional interaction zone (left) and a branded, atmospheric visual zone (right).

## Colors

This design system uses a palette of desaturated, modern pastels to create a calm user environment. 

- **Primary (Soft Sky Blue):** Used for primary actions, active states, and security-related icons.
- **Secondary (Pale Peach):** Inspired by IMAGE_2, used for accent illustrations, notifications, or secondary call-to-outs.
- **Tertiary (Muted Teal):** Provides visual variety for background elements or success states.
- **Neutral (Slate Grey):** Used for high-contrast text and borders to ensure accessibility.
- **Backgrounds:** Use an off-white or very light grey (`#F8FAFC`) for the functional side to maintain focus, while the visual side uses a soft gradient of the primary and tertiary colors.

## Typography

The typography utilizes **Hanken Grotesk** to achieve a clean, sharp, and contemporary feel. 

- **Headlines:** Use Bold and Semi-Bold weights with slight negative letter spacing to create a compact, professional look.
- **Body Text:** Standardized at 16px for optimal readability during the authentication flow.
- **Labels:** Use Medium weight and small-caps/uppercase for form input labels to distinguish them clearly from user input.
- **Hierarchy:** Maintain a clear vertical rhythm. Headers should be clearly separated from form groups to reduce cognitive load.

## Layout & Spacing

The design system employs a **Fixed Split Grid** for desktop and a **Fluid Single Column** for mobile.

- **Desktop (1024px+):** A 50/50 split-screen. The left side is a centered container (max-width 480px) for the login form. The right side is a full-height decorative area.
- **Tablet (768px - 1023px):** Maintain the split but adjust the ratio to 60/40 or stack vertically if content requires.
- **Mobile (< 768px):** Transition to a single-column fluid layout. The decorative side is typically hidden or reduced to a header graphic.
- **Rhythm:** Use a base 8px system for all internal component spacing (8, 16, 24, 32, 48).

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Ambient Shadows**.

- **Surfaces:** The primary form container uses a white surface against a very light grey background to create a subtle lift.
- **Shadows:** Use extremely soft, wide-dispersion shadows for containers. 
  - *Token:* `box-shadow: 0 10px 40px rgba(74, 78, 87, 0.08);`
- **Interactive Depth:** Buttons should feel "pressed" on active states by removing the shadow and shifting 1px down, rather than using heavy gradients.
- **Z-Index:** Keep the SSO form at the highest priority. Overlay elements (like tooltips or info modals) should use a semi-transparent backdrop blur (12px).

## Shapes

The shape language is defined by **Generous Radii**, leaning into the "2xl" request to ensure the UI feels friendly and modern.

- **Inputs & Buttons:** Apply a consistent 0.75rem to 1rem corner radius.
- **Containers:** Large cards or the central form area should utilize 1.5rem (rounded-xl) to 2rem (rounded-2xl) corners.
- **Icons:** Use a consistent stroke weight (1.5px or 2px) with rounded caps and joins to match the outer container geometry.

## Components

- **Buttons:** Primary buttons use the Soft Sky Blue background with white text. Secondary buttons use a ghost style (border-only) or a light teal tint. High roundedness is mandatory.
- **Input Fields:** Use a subtle light-grey border (`#E2E8F0`). On focus, the border transitions to the Primary Blue with a 3px soft outer glow (halo).
- **Cards/Containers:** The main SSO login card should have a white background, 2xl rounded corners, and a soft ambient shadow.
- **Status Chips:** Use pastel backgrounds with darker text for "New," "Beta," or "Security Alert" badges (e.g., Peach background with dark orange text).
- **Social Login Buttons:** Use brand-specific colors but desaturated slightly to match the pastel theme, maintaining the 2xl roundedness for consistency.
- **Progress Indicators:** Simple, thin linear bars in Primary Blue for multi-step authentication.