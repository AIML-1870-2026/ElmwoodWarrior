# How to Build a Stellar Particle System Web Page

A step-by-step guide to creating an interactive canvas-based particle simulation with floating star particles, dynamic connections, and a collapsible control panel.

---

## Project Overview

You'll be building a web page with floating star-shaped particles that drift around the screen. Particles within a certain distance of each other will have lines connecting them. The stars will have vibrant, silly colors and varying sizes. A small dropdown control panel in the top-right corner lets users adjust speed, connectivity radius, node count, node size, and edge thickness.

---

## Step 1: Create the HTML File

Open VS Code and create a new file called index.html.

Start with the standard HTML5 boilerplate including doctype, html, head, and body tags. Set the charset to UTF-8 and include a viewport meta tag for responsive scaling. Give it a fun title like "Stellar Particle System".

Inside the body, add a canvas element with an id of "particleCanvas". This is where all the particles will render.

Below the canvas, create a div with class "controls-container" to hold the control panel. Inside that, add a button with class "controls-toggle" that says something like "⚙ Controls".

After the button, add another div with class "controls-panel". This will be the dropdown that appears when clicking the toggle. Inside the panel, create five control groups—one for each setting: node speed, connectivity radius, node count, node size, and edge thickness.

Each control group needs a label showing the setting name, a span to display the current value, and a range input (slider). Give each slider appropriate min, max, step, and default values. For example, speed could range from 0.1 to 3, radius from 50 to 300, count from 20 to 200, size from 0.5 to 2.5, and edge thickness from 0.5 to 3.

---

## Step 2: Style the Page with CSS

Add a style tag in the head section or create a separate CSS file.

First, reset margins and padding on all elements and set box-sizing to border-box. Set the body to overflow hidden so there are no scrollbars, and give it a dark cosmic background using a radial gradient that goes from deep purple at the center to black at the edges.

Style the canvas to be fixed position, covering the entire viewport from top-left with display block.

Position the controls-container fixed in the top-right corner with some padding from the edges and a high z-index so it stays above the canvas.

Style the toggle button with a semi-transparent gradient background using pinks and purples, a subtle border, rounded corners, and a frosted glass effect using backdrop-filter blur. Use a sci-fi style font like Orbitron. Add hover effects that brighten the colors and add a glow.

The controls-panel should be positioned absolute, appearing just below the toggle button. Give it a dark semi-transparent background with blur, rounded corners, and a subtle border. The key trick for the dropdown animation is setting max-height to 0, overflow to hidden, and opacity to 0 by default. Create an "open" class that sets max-height to something like 400px, opacity to 1, and adds padding. Use CSS transitions on all these properties for smooth animation.

Style each control group with spacing between them. Labels should be flexbox with space-between to put the name on the left and value on the right. Use a contrasting color like cyan for the value display.

For the sliders, remove the default appearance and style the track with a gradient background. Style the thumb (the draggable circle) with a vibrant gradient, rounded shape, border, and glowing box-shadow. Add hover effects that scale it up slightly.

---

## Step 3: Set Up the JavaScript Foundation

Add a script tag before the closing body tag or create a separate JS file.

Start by creating a configuration object to store all the adjustable parameters: nodeSpeed, connectivityRadius, nodeCount, nodeSizeMultiplier, and edgeThickness. Set sensible defaults for each.

Get a reference to the canvas element using getElementById and get the 2D rendering context from it.

Create a function to resize the canvas to match the window dimensions. Set canvas.width to window.innerWidth and canvas.height to window.innerHeight. Call this function immediately and also add it as an event listener for the window resize event.

Define an array of silly, vibrant colors as hex strings. Include colors like hot pink, electric purple, cyan, bright yellow, lime green, coral red, sky blue, orange, magenta, and teal.

---

## Step 4: Create the Particle Class

Define a Particle class with a constructor that initializes random properties for each star.

Set x and y positions randomly within the canvas dimensions. Set vx and vy (velocity) to random values between -1 and 1 to create movement in all directions. Set a baseSize to a random value for varying star sizes—something like 4 to 12 pixels works well.

Pick a random color from your color array. Add a rotation value (random angle) and rotationSpeed for spinning stars. Add twinkleOffset and twinkleSpeed properties for a subtle brightness pulsing effect.

Create a getter for size that returns baseSize multiplied by the config's nodeSizeMultiplier.

Add an update method that moves the particle by adding velocity multiplied by the speed config to the position. Update the rotation and twinkle offset. Handle edge wrapping by checking if the particle has moved off any edge of the screen and wrapping it to the opposite side.

Add a draw method that saves the canvas context state, translates to the particle position, rotates by the current rotation angle, and sets globalAlpha based on the twinkle calculation (oscillating between about 0.6 and 1.0 using sine).

Create a helper method to draw a 5-pointed star shape. Loop through 10 points, alternating between outer and inner radius to create the star vertices. Use moveTo for the first point and lineTo for the rest, then closePath.

Fill the star with a radial gradient that goes from solid color at the center to transparent at the edges for a glow effect. Add a small white circle in the center for extra brightness.

Restore the canvas context state after drawing.

---

## Step 5: Manage the Particle Collection

Create an empty array to hold all particles.

Write an initParticles function that clears the array and populates it with new Particle instances based on the nodeCount in the config. Call this function once to create the initial particles.

---

## Step 6: Draw Connections Between Particles

Create a drawConnections function that loops through all particle pairs. Use nested loops where the inner loop starts at i+1 to avoid checking pairs twice.

For each pair, calculate the distance between them using the Pythagorean theorem: square root of (dx squared plus dy squared), where dx and dy are the differences in x and y positions.

If the distance is less than the connectivityRadius config value, draw a line between them. Calculate an opacity value that fades from 1 at distance 0 to 0 at the maximum radius.

Create a linear gradient for the line that transitions between the two particles' colors. Set the stroke style to this gradient with the calculated opacity. Set lineWidth to the edgeThickness config multiplied by the opacity for lines that thin out at greater distances.

Draw the line using beginPath, moveTo the first particle, lineTo the second, and stroke.

You may need a helper function to convert a 0-1 opacity value to a two-character hex string that can be appended to color codes.

---

## Step 7: Create the Animation Loop

Write an animate function that will be called every frame.

First, clear the canvas. You can either use clearRect for a clean clear, or fillRect with a semi-transparent black to create a motion trail effect.

Call drawConnections to render all the connecting lines first (so they appear behind the stars).

Loop through all particles, calling update and then draw on each one.

At the end of the function, call requestAnimationFrame with animate as the callback to continue the loop.

Call animate once to start the animation.

---

## Step 8: Wire Up the Control Panel Toggle

Get references to the toggle button and the panel div.

Add a click event listener to the toggle button. In the handler, toggle the "open" class on the panel using classList.toggle. Optionally update the button text to show a close icon when open.

---

## Step 9: Connect the Slider Controls

For each of the five sliders, get a reference to both the slider input and its corresponding value display span.

Add an input event listener to each slider. In each handler, parse the slider's value (using parseFloat for decimals or parseInt for whole numbers), update the corresponding config property, and update the value display text.

For the node count slider specifically, call initParticles after updating the config to recreate the particle array with the new count.

---

## Step 10: Test and Refine

Open index.html in a browser. You should see colorful star particles floating across a dark cosmic background with lines connecting nearby stars.

Click the controls toggle to open the panel and test each slider. Speed should make particles move faster or slower. Radius should change how far apart particles can be and still connect. Count should add or remove particles. Size should scale all the stars up or down. Edge thickness should make the connecting lines thicker or thinner.

If something isn't working, open the browser's developer console to check for errors. Common issues include typos in element IDs, forgetting to call initParticles, or math errors in the distance calculation.

---

## Optional Enhancements

Once the basic system works, consider adding mouse interaction where particles are attracted to or repelled from the cursor. You could add preset color themes that users can switch between. Adding keyboard shortcuts to quickly adjust settings can be nice. For extra visual flair, you could draw fading trails behind particles to create comet-like effects.

---

## Summary

The core concepts are: a Particle class holding position, velocity, and visual properties; an animation loop using requestAnimationFrame; distance calculations to determine which particles to connect; and DOM event listeners to make the controls interactive. The visual appeal comes from the color choices, the star shapes with glowing gradients, and the smooth CSS transitions on the control panel.
