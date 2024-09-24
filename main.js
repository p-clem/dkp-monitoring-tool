
const { app, BrowserWindow, ipcMain } = require('electron');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // Allows Node.js in the renderer process
      contextIsolation: false,
    },
  });

  // Load the HTML file into the window
  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Monitor a log file using chokidar
function monitorLogFile(logFilePath) {
  const watcher = chokidar.watch(logFilePath, {
    persistent: true,
  });

  watcher.on('change', (path) => {
    console.log(`${path} has been updated`);
    fs.readFile(logFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      // Send the updated file content to the renderer process
      mainWindow.webContents.send('file-updated', data);
    });
  });

  watcher.on('error', (error) => console.error(`Watcher error: ${error}`));
}

// Electron app lifecycle
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle IPC from renderer to start monitoring the file
ipcMain.on('monitor-file', (event, filePath) => {
  monitorLogFile(filePath);
});
