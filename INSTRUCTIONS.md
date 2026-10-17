# BrainCraze: Setup Instructions (Phase 2)

For the whole team. Run all commands in **PowerShell** or the **VS Code terminal** (Windows).

## Step 1: Install tools (everyone)

### Option A: With winget (try this first)

Open **Windows PowerShell** (not as admin) and run one at a time. Skip any you already have.

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install Microsoft.VisualStudioCode
```

### Option B: If `winget` is not recognized

Download and run the installers in a browser (defaults are fine):

1. **VS Code:** https://code.visualstudio.com. Tick "Add to PATH" and "Open with Code".
2. **Node.js (LTS):** https://nodejs.org
3. **Git:** https://git-scm.com/download/win

Optionally fix winget: open the Microsoft Store, search **App Installer**, and update it. Then check `winget --version`.

### Verify

**Close all terminals and open a new one** so PATH updates, then:

```powershell
node -v
npm -v
git --version
```

Each should print a version number (Node v20 or higher).

### One-time setup

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### VS Code and phone

- In VS Code, install the extensions: **ESLint**, **Prettier**, **Expo Tools**. Open the terminal with `` Ctrl+` ``.
- On each iPhone, install **Expo Go** from the App Store.

### Troubleshooting

- `'node' is not recognized`: you did not reopen the terminal, or the install failed. Reinstall.
- `running scripts is disabled`: rerun the `Set-ExecutionPolicy` line.

## Step 1.5: Expo account

### Do teammates need their own account, or be on your team?

- **Each person has their own Expo account.** Expo accounts are personal. Nobody shares a login.
- **To run the app on a phone, no account is needed.** Scanning the QR code in Expo Go works without signing in. Expo Go sign-in is optional for this project.
- **An account is only needed for cloud features:** EAS Build, EAS Update, and EAS Hosting (the web deploy in Phase 8). Only one person needs to deploy, so the repo owner handles those.
- **Teams are optional.** If more than one person needs access to the same EAS project, the repo owner creates a free **Organization** in Expo and invites teammates to it. Otherwise, skip this. Do it later in Phase 8 only if needed.

Recommendation: everyone creates a personal account now (takes 2 minutes). The repo owner creates the Organization only if the team decides to share EAS access.

### Sign up (everyone)

1. In a browser, go to https://expo.dev/signup.
2. Sign up with email and password, or with GitHub (GitHub login is fastest, since you all need GitHub anyway).
3. Verify your email if asked.
4. Pick a username you will remember. Do not use your real password anywhere in code or prompts.

### Sign in on the phone (optional)

Open Expo Go, go to the Profile tab, and sign in with the same account. This is not required to scan QR codes.

### Sign in from the laptop (only when you need EAS, Phase 8)

```powershell
npx eas-cli login
npx eas-cli whoami
```

`whoami` should print your username.

### Invite teammates to an Organization (repo owner, optional)

1. Go to https://expo.dev, open the account menu, and choose **Create organization**.
2. Open the organization, then **Members**, then **Invite**, and enter each teammate's Expo username or email.
3. Teammates accept the invite from their email or the Expo dashboard.

## Step 2: Create the Expo project (repo owner only)

Open `c:\Users\danie\Documents\GitHub\braincraze` in VS Code (File > Open Folder), open the terminal, and run:

```powershell
npx create-expo-app@latest .
```

Incase you mess up setup.

```powershell
Remove-Item -Recurse -Force node_modules, src, assets, scripts, .vscode, package.json, package-lock.json, app.json, tsconfig.json, .gitignore, AGENTS.md, README.md
```

- This installs the latest Expo SDK with TypeScript and Expo Router. Expo Go on the App Store only supports the latest SDK.
- If it says the folder is not empty, run `npx create-expo-app@latest tmp-app`, move everything (including hidden files) from `tmp-app` into the repo root, then delete `tmp-app`.
- Then clear the example screens:

```powershell
npm run reset-project
Remove-Item -Recurse -Force app-example
```

If `reset-project` does not exist, check the `scripts` in `package.json` and ask for help.

## Step 3: Run it on your phone (repo owner, then everyone)

```powershell
npx expo start
```

A QR code appears in the terminal. On your iPhone, open the **Camera app** (not Expo Go), scan it, and tap the banner. You should see the starter screen.

- Phone and laptop must be on the same Wi-Fi.
- QR times out: `npx expo start --tunnel` (say yes to installing the package), or use a phone hotspot.
- Windows firewall prompt: allow private networks.
- "Project is incompatible with this version of Expo Go": update Expo Go in the App Store.
- Stale screens or odd Metro errors: `npx expo start -c` clears the cache.
- Press `w` in the terminal to open the web build in a browser. This is the fallback demo, so confirm it works.

If this doesn't work:

```powershell
npm install expo@^N.0.0
npx expo install --fix
```

Where N.0.0 is the current app version

## Step 3.5: Web version (a full second platform)

The web version is a real target of BrainCraze, not just a backup. It uses the same codebase as the phone app, so every feature must work on both. It also doubles as the demo fallback if phones or Wi-Fi fail. The packages it needs (`react-dom`, `react-native-web`) are already installed.

Because web is a first-class platform:

- Test every screen on both phone and web before merging.
- Design layouts to be responsive: phone-sized by default, and centered with a max width or multi-column on wide screens.
- Web-only features (such as HTML page customization from the original plan) can be added behind `Platform.OS === "web"`.
- Phase 8 deploys the web build as a public site that judges can open.

### Run it during development

```powershell
npm run web
```

(Or run `npx expo start` and press `w`.) A browser tab opens at `http://localhost:8081`. Edits reload automatically. Use browser dev tools device mode (`F12`, then `Ctrl+Shift+M`) to preview phone-sized screens.

### Build a static copy and test it

```powershell
npm run export:web
npm run serve:web
```

`export:web` writes the site to `dist/` (gitignored). `serve:web` serves it locally (it asks to install `serve` the first time; say yes). Open the URL it prints. This is the same build you will deploy in Phase 8, so test it before the demo.

### What is different on web

- **Config:** `app.json` is set to `"output": "single"` (a single-page app). This deploys to any static host, and it avoids needing a server.
- **Routes** live in `src/app/`, not `app/` (the template puts them there).
- **Haptics, local notifications, and `expo-speech`** may do nothing or behave differently on web. Wrap them in `Platform.OS !== "web"` checks when we add them.
- **Image picker and file uploads** work, but with a browser file dialog.
- **Reload:** refreshing a deep link page works with this config. If a page 404s after deploy, tell me.
- **Environment variables** must start with `EXPO_PUBLIC_` to reach the app. Never put secret keys there (LLM keys live only in Supabase Edge Functions).
- **Port in use:** if 8081 is busy, Expo asks to use another port; say yes.

## Step 4: Push the repo and add teammates (repo owner)

1. Check the remote: `git remote -v`. If empty, create an empty repo on github.com and follow GitHub's "push an existing repository" commands.
2. Commit and push:

```powershell
git add .
git commit -m "Initial Expo scaffold"
git push -u origin main
```

3. On GitHub: Settings > Collaborators > invite the three teammates.

### Teammates

```powershell
cd $HOME\Documents\GitHub
git clone <repo-url> braincraze
cd braincraze
npm install
npx expo start
```

Each person scans the QR code on their own phone with their own laptop's dev server.

## Step 5: Shared agent files

Once the scaffold runs and is pushed, ask Claude to write `AGENTS.md`, `CLAUDE.md`, and `.env.example` into the repo. Then commit, push, and have teammates run `git pull`.

Teammates without Claude Code can use GitHub Copilot (free tier), Gemini, or ChatGPT. All can read `AGENTS.md`.

## Checkpoint (each person confirms)

- [ ] `node -v` and `git --version` work
- [ ] Repo cloned and `npm install` finished with no errors
- [ ] App opens in Expo Go on your own iPhone
- [ ] Web version opens with `w`

Do not start Phase 3 until all four boxes are checked for all four people.
