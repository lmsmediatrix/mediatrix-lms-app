# Mediatrix Branding Theme (Reference)

Source captured from the official website on March 30, 2026:
- https://mediatrixmed.com.ph/
- https://mediatrixmed.com.ph/wp-content/uploads/elementor/css/post-7.css
- https://mediatrixmed.com.ph/wp-content/uploads/elementor/css/post-12.css

## Typography

Primary brand font:
- `Proxima Nova` (regular and bold)
- WOFF sources:
  - https://mediatrixmed.com.ph/wp-content/uploads/2023/09/ProximaNova-Regular.woff
  - https://mediatrixmed.com.ph/wp-content/uploads/2023/09/ProximaNova-Bold.woff

Secondary/system font:
- `Roboto` (used in Elementor global typography tokens for text and accent)

Recommended fallback stack:
- `"Proxima Nova", "Roboto", "Inter", "Helvetica Neue", Arial, sans-serif`

## Core Color Tokens

Extracted from `.elementor-kit-7`:
- `--e-global-color-primary: #1C7FC9`
- `--e-global-color-secondary: #014EFF`
- `--e-global-color-text: #01268F`
- `--e-global-color-accent: #011A5D`
- `--e-global-color-ee49b0e: #002D72`
- `--e-global-color-f0d10e6: #262626`
- `--e-global-color-34b66f7: #EAF6FF`

Other observed brand/support colors:
- `#FFFFFF` (primary light surface/text)
- `#FFBC7D` (page transition color)

## Suggested Theme Mapping for LMS Org Branding

- `brandPrimary`: `#1C7FC9`
- `brandSecondary`: `#014EFF`
- `brandAccent`: `#011A5D`
- `brandTextStrong`: `#002D72`
- `brandTextBody`: `#262626`
- `brandSurfaceLight`: `#EAF6FF`
- `brandSurfaceBase`: `#FFFFFF`

Suggested gradient for hero/login visual areas:
- `linear-gradient(135deg, #011A5D 0%, #01268F 48%, #1C7FC9 100%)`

## Logo / Visual Assets

- Main logo (dark on light):
  - https://mediatrixmed.com.ph/wp-content/uploads/2023/08/MMMC_Header-2022.png
- Main logo (white on dark):
  - https://mediatrixmed.com.ph/wp-content/uploads/2023/08/MMMC_White-Header-2022-1024x165.png
- Decorative wave image used in homepage styling:
  - https://mediatrixmed.com.ph/wp-content/uploads/2023/09/MMMC-Wave.png
