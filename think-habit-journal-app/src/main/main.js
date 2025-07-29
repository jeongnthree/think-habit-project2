"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/main/main.ts
var electron_1 = require("electron");
var path = require("path");
var database_1 = require("./database/database");
var ElectronApp = /** @class */ (function () {
    function ElectronApp() {
        var _this = this;
        this.mainWindow = null;
        this.databaseManager = null;
        this.onWindowAllClosed = function () {
            if (process.platform !== "darwin") {
                electron_1.app.quit();
            }
        };
        this.onActivate = function () {
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                _this.createWindow();
            }
        };
        this.onBeforeQuit = function () {
            if (_this.databaseManager) {
                _this.databaseManager.close();
            }
        };
        this.setupEventHandlers();
    }
    ElectronApp.prototype.setupEventHandlers = function () {
        var _this = this;
        electron_1.app.whenReady().then(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.initializeDatabase()];
                    case 1:
                        _a.sent();
                        this.createWindow();
                        this.setupIpcHandlers();
                        return [2 /*return*/];
                }
            });
        }); });
        electron_1.app.on("window-all-closed", this.onWindowAllClosed);
        electron_1.app.on("activate", this.onActivate);
        electron_1.app.on("before-quit", this.onBeforeQuit);
    };
    ElectronApp.prototype.initializeDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        this.databaseManager = new database_1.DatabaseManager();
                        return [4 /*yield*/, this.databaseManager.initialize()];
                    case 1:
                        _a.sent();
                        // 기본 테이블 생성
                        return [4 /*yield*/, this.createBasicTables()];
                    case 2:
                        // 기본 테이블 생성
                        _a.sent();
                        console.log("Database initialized successfully");
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error("Database initialization failed:", error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ElectronApp.prototype.createBasicTables = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tables, _i, tables_1, sql;
            return __generator(this, function (_a) {
                if (!this.databaseManager)
                    return [2 /*return*/];
                tables = [
                    "CREATE TABLE IF NOT EXISTS users (\n        id TEXT PRIMARY KEY,\n        email TEXT UNIQUE NOT NULL,\n        name TEXT NOT NULL,\n        token TEXT,\n        created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n      )",
                    "CREATE TABLE IF NOT EXISTS journals (\n        id TEXT PRIMARY KEY,\n        user_id TEXT NOT NULL,\n        type TEXT NOT NULL CHECK (type IN ('structured', 'photo')),\n        title TEXT NOT NULL,\n        content TEXT NOT NULL,\n        sync_status TEXT DEFAULT 'local',\n        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n        FOREIGN KEY (user_id) REFERENCES users (id)\n      )",
                    "CREATE TABLE IF NOT EXISTS files (\n        id TEXT PRIMARY KEY,\n        journal_id TEXT NOT NULL,\n        file_path TEXT NOT NULL,\n        file_name TEXT NOT NULL,\n        file_size INTEGER,\n        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n        FOREIGN KEY (journal_id) REFERENCES journals (id)\n      )",
                ];
                for (_i = 0, tables_1 = tables; _i < tables_1.length; _i++) {
                    sql = tables_1[_i];
                    this.databaseManager.executeUpdate(sql);
                }
                return [2 /*return*/];
            });
        });
    };
    ElectronApp.prototype.createWindow = function () {
        var _this = this;
        this.mainWindow = new electron_1.BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, "preload.js"),
                webSecurity: true,
            },
            titleBarStyle: "default",
            show: false,
        });
        // 창 로딩 완료 후 표시
        this.mainWindow.once("ready-to-show", function () {
            var _a;
            (_a = _this.mainWindow) === null || _a === void 0 ? void 0 : _a.show();
        });
        var isDev = process.env.NODE_ENV === "development";
        if (isDev) {
            this.mainWindow.loadURL("http://localhost:3000");
            this.mainWindow.webContents.openDevTools();
        }
        else {
            this.mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
        }
    };
    ElectronApp.prototype.setupIpcHandlers = function () {
        var _this = this;
        // 데이터베이스 IPC 핸들러
        electron_1.ipcMain.handle("db:query", function (event, sql, params) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.databaseManager)
                    throw new Error("Database not initialized");
                return [2 /*return*/, this.databaseManager.executeQuery(sql, params)];
            });
        }); });
        electron_1.ipcMain.handle("db:update", function (event, sql, params) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.databaseManager)
                    throw new Error("Database not initialized");
                return [2 /*return*/, this.databaseManager.executeUpdate(sql, params)];
            });
        }); });
        // 앱 관련 핸들러
        electron_1.ipcMain.handle("app:getVersion", function (event) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, electron_1.app.getVersion()];
            });
        }); });
        electron_1.ipcMain.handle("app:quit", function (event) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                electron_1.app.quit();
                return [2 /*return*/];
            });
        }); });
        electron_1.ipcMain.handle("app:minimize", function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                (_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.minimize();
                return [2 /*return*/];
            });
        }); });
        electron_1.ipcMain.handle("app:maximize", function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                if ((_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.isMaximized()) {
                    this.mainWindow.unmaximize();
                }
                else {
                    (_b = this.mainWindow) === null || _b === void 0 ? void 0 : _b.maximize();
                }
                return [2 /*return*/];
            });
        }); });
        electron_1.ipcMain.handle("app:isMaximized", function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, ((_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.isMaximized()) || false];
            });
        }); });
    };
    return ElectronApp;
}());
new ElectronApp();
