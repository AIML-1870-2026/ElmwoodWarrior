# Readable — Project Specification

## Overview

**Readable** is an interactive, browser-based tool that puts the science of visual accessibility directly in the hands of the user. By letting people manipulate background color, text color, and font size in real time, the app reveals how seemingly small design decisions — a slightly lighter shade of gray, a font that's just a touch too small — can make the difference between text that's effortlessly legible and text that actively strains the eye. Every change a user makes is reflected instantly across the entire interface, creating a tight feedback loop that makes the underlying concepts of color contrast and readability feel tangible and explorable rather than abstract.

---

## Required Features

### 1. Text Display Area

At the heart of the application is a live preview panel — a dedicated region that renders a sample passage of text exactly as it would appear with the user's chosen settings. This isn't a delayed preview or a separate "apply" step; every slider nudge and every color value typed into an input field is reflected here instantaneously. The display area serves as the ground truth of the whole experience: users aren't adjusting numbers in the abstract, they're watching their choices play out on real text in real time. The background color, text color, and font size of the display are all fully driven by the controls described below.

### 2. Contrast Ratio Display & Luminosity Readout

Prominently displayed on the page is the calculated contrast ratio between the current background and text colors, formatted as `X.XX:1` per WCAG convention. This number is not static — it recalculates live with every color change, so users can watch the ratio climb or fall as they adjust their palette. Alongside the ratio, two separate luminosity readouts show the computed relative luminance of the background and text colors independently, demystifying the math behind the final ratio and helping users build intuition about which colors are "heavier" or "lighter" in terms of light energy.

**The contrast ratio is computed according to the WCAG relative luminance specification:**

1. Each RGB channel (0–255) is divided by 255 to normalize it to a 0–1 range, then passed through the sRGB gamma correction curve to produce a linearized value that reflects how human eyes perceive light rather than how monitors encode it.
2. The three linearized channel values are combined into a single relative luminance score using the standard WCAG weighting formula.
3. The contrast ratio is then derived as `(L1 + 0.05) / (L2 + 0.05)`, where `L1` is the luminance of whichever color is lighter and `L2` is the luminance of whichever is darker. The `0.05` offset accounts for the ambient light that the human eye perceives even in a theoretically "pure black" environment.
4. The result is displayed in the format `X.XX:1`.

### 3. Background Color Controls

A trio of RGB sliders — one each for the Red, Green, and Blue channels — gives users precise control over the background color of the text display area. Each slider spans the full 0–255 integer range and is tightly coupled to a numeric input field sitting beside it. The two controls are always in agreement: drag the slider and the number field updates; type a new value into the field and the slider snaps to match. Any change, from either input, is applied to the background of the display area immediately.

### 4. Text Color Controls

Mirroring the background controls, a second set of three RGB sliders governs the color of the sample text in the display area. The same synchronization contract applies — sliders and number fields are always in sync, and any change triggers an instant update to the text color rendered in the display area. Together, the background and text color controls give users full 24-bit color space to explore, from the starkest high-contrast pairings to the most subtle (and most illegible) near-matches.

### 5. Text Size Control

A single slider paired with a synchronized integer input field sets the font size of the sample text. Font size is not merely an aesthetic concern — WCAG accessibility thresholds actually differ for large text versus normal text, so being able to adjust size while watching the contrast ratio is a meaningful part of the tool's educational purpose. As with the color controls, changes to either the slider or the input field take effect in the display area immediately and without any additional user action.

### 6. Synchronization Behavior

The entire interface operates on a strict real-time synchronization contract. No control ever gets out of step with another, and no change ever requires a button press to "apply." Specifically: moving any slider immediately updates its paired number field to the exact current value; editing any number field immediately moves its paired slider to the corresponding position; any change to background color, text color, or font size is reflected in the text display area within the same interaction frame; and the contrast ratio and luminosity readouts recalculate automatically on every color change without any manual trigger.

---

## Stretch Features

### Option A: Preset Color Schemes

Rather than always starting from scratch, users can jump directly to a curated color combination by selecting from a set of preloaded presets. These are offered either as a row of labeled buttons or a dropdown menu, and selecting one immediately loads its RGB values into all six color sliders and their paired input fields, updating the display area in the same instant. The preset library is organized around practical and educational use cases rather than aesthetics alone, covering four categories: a high-contrast baseline (such as classic black-on-white, the benchmark against which most accessibility tools are measured), low-contrast examples that hover right at the edge of legibility, color schemes drawn from common real-world website designs, and intentionally problematic combinations that fail WCAG — included specifically so users can see what "bad" looks like and understand why those pairings are widely considered inaccessible.

### Option B: WCAG Compliance Indicator

Knowing the raw contrast ratio is useful, but knowing whether it actually *passes* is what most designers and developers care about in practice. This feature adds a dedicated compliance panel that evaluates the current ratio against the two most commonly cited WCAG thresholds: 4.5:1 for normal-sized body text, and 3:1 for large text (defined by WCAG as text that is at least 18pt, or 14pt if bold). Each threshold is shown as its own pass/fail badge — green with a "PASS" label when the ratio meets or exceeds the threshold, red with a "FAIL" label when it falls short. Both the color coding and the explicit text labels are used together intentionally, since relying on color alone for a pass/fail indicator would be a somewhat ironic accessibility failure in a tool specifically about accessibility.

### Option C: Vision Type Simulation

One of the most powerful things Readable can do is help sighted users genuinely appreciate how their color choices read to people with different types of color vision. This feature adds a set of radio buttons that apply a color transformation to the text display area, simulating how the current background and text colors would appear under five different vision profiles: Normal vision (no transformation applied, the default state), Protanopia (red-blind, affecting approximately 1% of males), Deuteranopia (green-blind, the most common form of color blindness), Tritanopia (blue-blind, relatively rare but distinct in its perceptual effects), and Monochromacy (complete color blindness, where all color information is lost and only luminance remains). An important design constraint applies here: because the mathematical transformations used to simulate these vision types are not reversible, the RGB color adjustment controls are locked or visually disabled whenever any non-normal simulation mode is active. Allowing color edits during simulation would produce results that can't be meaningfully mapped back to actual display colors, so the simulation is strictly a "view-only" mode.

### Option D: Roast My Colors **

When the current contrast ratio falls below WCAG's passing threshold for normal text, a "Roast My Colors" button becomes active on the page. Clicking it sends the current background color, text color, and contrast ratio to the Claude API, which generates a short, witty, and pointed critique of the user's color choices — think snarky design feedback, not technical documentation. The response is displayed prominently in the interface, styled to match whatever color combination the user has selected (irony intended). The roast is regenerated fresh on each button press, so users who keep adjusting colors will keep getting new material. The button is disabled when the color combination already passes WCAG, both because a passing combo doesn't deserve to be roasted and because it keeps the feature focused on its intended purpose: making it memorable and even a little funny when you've chosen colors that no one can actually read.

### Option E: Guess the Ratio **

A game mode that tests whether users have developed a genuine intuitive feel for color contrast, or whether they've just been reading numbers off the display. When activated, the contrast ratio display is hidden and the user is presented with a randomly generated color pair rendered in the text display area. Their challenge is to guess whether the combination passes or fails WCAG's normal text threshold (4.5:1) before the answer is revealed. After submitting a guess, the true contrast ratio is shown along with whether the combination was a pass or fail, and the user's running score (correct guesses out of total attempts) is tracked for the session. Color pairs are generated to cover the full spectrum of difficulty — some will be obviously high-contrast, some obviously terrible, and some deliberately ambiguous near-threshold combinations that force users to really look rather than just react. The goal is to build genuine color literacy, not just tool familiarity.
