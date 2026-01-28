# AIML 1870 - Development Guide

## Project Structure
This is the root folder for all AIML 1870 assignments. Each assignment should be in its own subfolder.

## Commands

### Deploy
When I say "Deploy" or "deploy this", follow these steps:

1. **Verify the build is ready**
   - Ensure index.html exists in the current assignment folder
   - Check for any obvious errors

2. **Initialize Git (if needed)**
   - If this folder isn't a git repository, initialize it: `git init`
   - Create a .gitignore if one doesn't exist

3. **Commit changes**
   - Stage all files: `git add .`
   - Commit with message: `git commit -m "Deploy: [brief description of changes]"`

4. **Push to GitHub**
   - If no remote exists, prompt me for the repository name
   - Create the GitHub repository if needed
   - Push to main branch: `git push -u origin main`

5. **Enable GitHub Pages**
   - Ensure GitHub Pages is enabled for the repository
   - Deploy from the main branch, root folder

6. **Report the live URL**
   - The URL format will be: https://[username].github.io/[repo-name]/
   - Confirm deployment was successful

## Coding Standards
- All assignments should be single HTML files (unless otherwise specified)
- Use semantic HTML5 elements
- Include responsive viewport meta tag
- CSS should be embedded in <style> tags
- JavaScript should be embedded in <script> tags

## File Naming
- Main file: `index.html`
- Assets: lowercase, hyphens instead of spaces (e.g., `my-image.png`)
- Assignment folders: `Assignment-1`, `Assignment-2`, etc.

## When Asked to Help with Assignments
- Encourage exploration and learning
- Explain concepts, don't just provide code
- Suggest improvements and best practices
- Celebrate creativity and experimentation
