---
name: QuotaForge
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#424754'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#585e6c'
  on-secondary: '#ffffff'
  secondary-container: '#dde2f3'
  on-secondary-container: '#5e6473'
  tertiary: '#924700'
  on-tertiary: '#ffffff'
  tertiary-container: '#b75b00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#dde2f3'
  secondary-fixed-dim: '#c1c6d7'
  on-secondary-fixed: '#161c27'
  on-secondary-fixed-variant: '#414754'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  mono-base:
    fontFamily: Geist Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  mono-sm:
    fontFamily: Geist Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  nav-height: 64px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is rooted in the principles of **Industrial Minimalism** and **Precision Engineering**. It is designed for developers managing critical infrastructure where clarity, speed of cognition, and technical accuracy are paramount. The aesthetic avoids decorative flourishes like gradients or blurs, favoring high-utility layouts and structural integrity.

The emotional response should be one of "controlled calm"—the UI acts as a reliable instrument panel. It utilizes a structured grid, thin lines, and a restrained color palette to ensure that data density does not lead to visual fatigue.

## Colors
The palette is built on a foundation of warm, light neutrals to provide a soft yet professional workspace. 

- **Backgrounds:** Use `#F7F8FA` for page backgrounds to reduce glare.
- **Surfaces:** Use pure `#FFFFFF` for containers, cards, and input areas to create clear separation from the background.
- **Borders:** A consistent `#E2E8F0` is used for all structural borders.
- **Typography:** Headlines use `#1A202C` for maximum contrast, while secondary information uses `#4A5568`.
- **Status:** Semantic colors are used sparingly for status indicators, health checks, and alerts. They should be presented with high contrast against white backgrounds but remain controlled in saturation to avoid an "alarmist" feel.

## Typography
Hierarchy in this design system is established through weight and font switching rather than scale. 

- **UI Sans:** Use **Geist** for headings and **Inter** for body copy. This combination balances technical sharpness with high readability.
- **Technical Mono:** Use **Geist Mono** for all machine-readable data, including API keys, UUIDs, timestamps, and metric values.
- **Headings:** Keep headings compact. Never exceed 24px for standard dashboard views.
- **Labels:** Small, uppercase labels are used for metadata and table headers to distinguish them from interactive content.

## Layout & Spacing
The layout follows a strict **64px horizontal rhythm** for the primary navigation, with a fluid grid for the content area. 

- **Grid:** Use a 12-column grid for desktop with 16px gutters. 
- **Navigation:** A single 64px top bar contains all global navigation. There are no sidebars; sub-navigation should be handled via tabs within the content area.
- **Density:** Spacing is tight to maximize the "above-the-fold" data visibility. 
- **Breakpoints:** 
  - Mobile (<768px): 100% width, 16px margins.
  - Tablet (768px - 1199px): 12-column fluid, 20px margins.
  - Desktop (>1200px): 12-column fluid, 24px margins.

## Elevation & Depth
This system uses **Flat Tonal Layering** instead of shadows. 

- **Base Layer:** Background color `#F7F8FA`.
- **Surface Layer:** White `#FFFFFF` surfaces with a 1px border of `#E2E8F0`. 
- **Interaction Layer:** On hover, surfaces may use a subtle shift to a light gray background or a slightly darker border, but should not "lift" off the page.
- **Depth Markers:** Use 1px vertical or horizontal lines (rules) to divide content within a single surface, maintaining a flat, blueprint-like appearance.

## Shapes
Shapes are disciplined and geometric. 

- **Radius:** A consistent 4px (Soft) radius is applied to all buttons, inputs, and cards. 
- **Technical Elements:** Status pips and flow indicators should remain circular or use very small radii to appear like hardware LEDs.
- **Lines:** Use 1px stroke widths for all borders and chart axes to maintain the "engineered" aesthetic.

## Components
- **Buttons:** 4px radius. Primary buttons use a solid `#1A202C` with white text. Secondary buttons are white with a `#E2E8F0` border.
- **Tables:** High-density. Row height should be 40px. Column headers use `label-caps`. Technical data columns must use `mono-base`.
- **Inputs:** 1px border. Focus state uses a 1px `#3B82F6` border with no outer glow.
- **Charts:** Use thin 1.5px lines for data. Grid lines should be `#F1F5F9`. No area fills under lines unless representing cumulative volume.
- **Status Indicators:** A small 8px circle (pip) followed by `mono-sm` text. 
- **Monospace Tags:** Used for IDs and short technical strings; light gray background with no border and `mono-sm` text.
- **Navigation Bar:** 64px height, white background, bottom border only. Items are spaced 24px apart with 600 weight labels.