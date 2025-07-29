// Mock for Electron
export const ipcRenderer = {
  on: jest.fn(),
  send: jest.fn(),
  invoke: jest.fn(),
};

export const shell = {
  openExternal: jest.fn(),
};

export const remote = {
  app: {
    getPath: jest.fn(),
  },
};

export const app = {
  getPath: jest.fn(),
};

export const dialog = {
  showOpenDialog: jest.fn(),
  showSaveDialog: jest.fn(),
};

export default {
  ipcRenderer,
  shell,
  remote,
  app,
  dialog,
};
