
![infographics](https://github.com/user-attachments/assets/4dae1ca2-b8e4-4af2-aa45-ea54a8f7f6ae)


## Why SitUp?

Many of us spend hours at our desks, only to realize too late that we've been slouching or hunching over. Poor posture can lead to back pain, fatigue, and long-term health issues. The problem isn't that we don't know how to sit up straight—it's that we forget to do it, especially when we're focused on work.

**SitUp** solves this by giving you a gentle, automatic reminder every 15 minutes. A short, semi-transparent video pops up in the center of your screen for just 3 seconds, prompting you to check your posture and sit up straight. No setup, no nagging, just a simple nudge to help you build a healthy habit.

# Situp

A simple cross-platform reminder app that helps you sit straight! Every 15 minutes, a 3-second video pops up in the center of your screen, reminding you to sit up.

- **Works on macOS and Windows**
- **No installation required** (run via `npx`)
- **Video is bundled**

## Usage

```
@adamklein/situp
```

The app will run in the background and show a short video popup every 15 minutes. To stop, press `Ctrl+C` in your terminal.

### Open Preferences from CLI

You can launch SitUp and immediately open the Preferences window using the `--opts` (or `--preferences`) flag:

```
@adamklein/situp --opts
```

This will open the Preferences window and skip the reminder popup.

## How it works
- Pops up a borderless, always-on-top window with a 3-second video
- Window closes automatically after the video
- No tray icon, no dock icon, minimal UI

## License
MIT 

---

