const { app, BrowserWindow, globalShortcut, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 868,
    minWidth: 1024,
    minHeight: 700,
    title: 'El Gremio de la Taberna RPG',
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#0f0e17',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  // Load live taberna RPG app from local server
  const serverUrl = process.env.GREMIO_SERVER_URL || 'http://192.168.0.200:8083';
  mainWindow.loadURL(serverUrl);

  // Show window smoothly when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle load failure with automatic retry
  mainWindow.webContents.on('did-fail-load', () => {
    console.log('[Electron] Error al conectar con el servidor RPG. Reintentando en 3 segundos...');
    setTimeout(() => {
      mainWindow.loadURL(serverUrl);
    }, 3000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Remove default menu for clean game interface
  Menu.setApplicationMenu(null);

  createWindow();

  // Register Fullscreen F11 shortcut
  globalShortcut.register('F11', () => {
    if (mainWindow) {
      const isFull = mainWindow.isFullScreen();
      mainWindow.setFullScreen(!isFull);
    }
  });

  // Register Reload F5 shortcut
  globalShortcut.register('F5', () => {
    if (mainWindow) {
      mainWindow.reload();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
