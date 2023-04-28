import { app, BrowserWindow } from 'electron'

declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

/*
* APP WINDOW
* */
const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)
  mainWindow.webContents.openDevTools()
}

/*
* SERVER WINDOW (DEV)
* */
const createBackgroundWindow = (): void => {
  const win = new BrowserWindow({
    width: 700,
    height: 200,
    show: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  win.loadURL(`file://${__dirname}/server/index.html`)
  win.webContents.openDevTools()
}

/*
* QUIT
* */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/*
* Activate (OSX)
* */
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

/*
* START
* */
app.on('ready', () => {
  createWindow()
  createBackgroundWindow()
})

