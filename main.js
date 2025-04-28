const { app, BrowserWindow, Menu, Tray } = require('electron');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');
const { nativeImage } = require('electron');

let popupWindow = null;
let intervalId = null;
let tray = null;

const CONFIG_PATH = path.join(os.homedir(), '.situp-config.json');
const DEFAULT_CONFIG = {
  width: 480,
  interval: 15,
  runOnStartup: true,
  firstRun: true,
};

// Calculate height based on 9:16 aspect ratio (portrait)
function calculateHeight(width) {
  return Math.round(width * 16 / 9);
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data), firstRun: false };
    }
  } catch (e) {}
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

let config = loadConfig();

// Helper: Check Do Not Disturb (macOS)
function isDoNotDisturbMac() {
  try {
    // Modern macOS Focus/DND detection
    const result = execSync(
      'defaults read com.apple.controlcenter "NSStatusItem Visible FocusModes"',
      { encoding: 'utf8' }
    ).trim();
    
    if (result === '1') {
      // If Focus menu is visible, check if any focus mode is active
      const focusStatus = execSync(
        'plutil -extract "v2" xml1 ~/Library/DoNotDisturb/DB/Assertions.json -o - | grep "com.apple.donotdisturb.mode"',
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      return focusStatus.length > 0;
    }
    return false;
  } catch (e) {
    return false;
  }
}

// Helper: Check Focus Assist (Windows 10+)
function isFocusAssistWindows() {
  try {
    // Query registry for Focus Assist (Quiet Hours)
    const result = execSync(
      'reg query "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings" /v NOC_GLOBAL_SETTING_TOASTS_ENABLED',
      { encoding: 'utf8' }
    );
    // If value is 0, Focus Assist is ON
    return result.includes('0x0');
  } catch (e) {
    return false;
  }
}

function isDoNotDisturb() {
  if (process.platform === 'darwin') {
    return isDoNotDisturbMac();
  } else if (process.platform === 'win32') {
    return isFocusAssistWindows();
  }
  return false;
}

function createTray() {
  if (tray) return;
  const iconPath = path.join(__dirname, 'icons', 'logo.png');
  let trayIcon = nativeImage.createFromPath(iconPath);

  if (process.platform === 'darwin') {
    trayIcon.setTemplateImage(true);
  }

  tray = new Tray(trayIcon);

  if (process.platform === 'darwin' && typeof tray.setHighlightMode === 'function') {
    tray.setHighlightMode('never');
    tray.setTitle('Sit Up');
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Preferences',
      click: openPreferencesWindow,
    },
    { type: 'separator' },
    { role: 'quit', label: 'Quit Sit Up' },
  ]);
  tray.setToolTip('Sit Up');
  tray.setContextMenu(contextMenu);
}

function openPreferencesWindow() {
  if (popupWindow) {
    popupWindow.close();
  }
  // Only one preferences window at a time
  if (BrowserWindow.getAllWindows().some(w => w.getTitle() === 'Preferences')) {
    return;
  }
  const prefWindow = new BrowserWindow({
    width: 400,
    height: 320,
    resizable: false,
    movable: true,
    skipTaskbar: false,
    transparent: false,
    center: true,
    fullscreenable: false,
    alwaysOnTop: true,
    title: 'Preferences',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  prefWindow.setMenuBarVisibility(false);
  prefWindow.loadFile(path.join(__dirname, 'preferences.html'));
  prefWindow.webContents.on('did-finish-load', () => {
    prefWindow.webContents.send('load-config', config);
  });
  const { ipcMain } = require('electron');
  ipcMain.once('save-config', (event, newConfig) => {
    config = { ...config, ...newConfig, firstRun: false };
    saveConfig(config);
    prefWindow.close();
    if (intervalId) clearInterval(intervalId);
    startReminder();
    setRunOnStartup(config.runOnStartup);
  });
}

function setRunOnStartup(enabled) {
  app.setLoginItemSettings({
    openAtLogin: !!enabled,
    path: process.execPath,
    args: process.argv.slice(1),
  });
}

function showPopup() {
  if (popupWindow) {
    return;
  }
  if (isDoNotDisturb()) {
    return; // Respect DND/Focus Mode
  }
  const height = calculateHeight(config.width);
  let windowOptions = {
    width: config.width,
    height,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    transparent: true,
    opacity: 0.8,
    backgroundColor: '#00000000',
    center: true,
    fullscreenable: false,
    focusable: false,
    title: 'Sit Up',
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enablePreferredSizeMode: false,
    },
  };
  if (process.platform === 'darwin') {
    windowOptions.alwaysOnTop = true;
    windowOptions.alwaysOnTopLevel = 'screen-saver';
  } else if (process.platform === 'win32') {
    windowOptions.alwaysOnTop = true;
    windowOptions.alwaysOnTopLevel = 'pop-up-menu';
  }
  popupWindow = new BrowserWindow(windowOptions);
  popupWindow.setMenuBarVisibility(false);
  popupWindow.setContentProtection(true);
  popupWindow.setIgnoreMouseEvents(true, { forward: true });
  popupWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  popupWindow.loadFile(path.join(__dirname, 'popup.html'));
  popupWindow.on('closed', () => {
    popupWindow = null;
  });
  setTimeout(() => {
    if (popupWindow) {
      popupWindow.close();
    }
  }, 3000);
}

function startReminder() {
  if (intervalId) clearInterval(intervalId);
  if (config.firstRun) {
    openPreferencesWindow();
    return;
  }
  showPopup();
  intervalId = setInterval(showPopup, config.interval * 60 * 1000);
}

// Parse CLI args for --opts or --preferences
const openPrefsArg = process.argv.includes('--opts') || process.argv.includes('--preferences');

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.setName('Sit Up');
    // Hide dock by default since we're a menubar app
    app.dock.hide();
    
    // Only show dock when windows are open
    app.on('browser-window-created', () => {
      app.dock.show();
    });
    
    app.on('window-all-closed', () => {
      // Hide dock when all windows are closed
      if (process.platform === 'darwin') {
        app.dock.hide();
      }
    });
  }
  
  // Set the app icon for all platforms
  const iconPath = path.join(__dirname, 'icons', 'logo.png');
  if (process.platform === 'darwin') {
    app.dock.setIcon(nativeImage.createFromPath(iconPath));
  }

  // App menu for Preferences
  const template = [
    {
      label: 'Sit Up',
      submenu: [
        {
          label: 'Preferences...',
          click: openPreferencesWindow,
        },
        { role: 'quit' },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  createTray();
  setRunOnStartup(config.runOnStartup);

  if (openPrefsArg) {
    openPreferencesWindow();
    return;
  }

  startReminder();

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});

// Handle Ctrl+C in terminal
process.on('SIGINT', () => {
  if (intervalId) clearInterval(intervalId);
  app.quit();
}); 