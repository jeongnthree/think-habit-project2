"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.DatabaseManager = void 0;
// src/main/database/database.ts
var electron_1 = require("electron");
var fs = require("fs");
var path = require("path");
// 간단한 메모리 기반 데이터베이스 (개발 단계용)
var DatabaseManager = /** @class */ (function () {
    function DatabaseManager(config) {
        this.data = {};
        this.config = {
            path: (config === null || config === void 0 ? void 0 : config.path) || path.join(electron_1.app.getPath("userData"), "think-habit.json"),
            encrypted: (config === null || config === void 0 ? void 0 : config.encrypted) || false,
            backupPath: (config === null || config === void 0 ? void 0 : config.backupPath) || path.join(electron_1.app.getPath("userData"), "backups"),
        };
        this.initializeTables();
    }
    DatabaseManager.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.loadData()];
                    case 1:
                        _a.sent();
                        console.log("Database initialized successfully:", this.config.path);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error("Database initialization failed:", error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseManager.prototype.initializeTables = function () {
        this.data = {
            users: [],
            journals: [],
            files: [],
        };
    };
    DatabaseManager.prototype.loadData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var dbDir, fileContent;
            return __generator(this, function (_a) {
                dbDir = path.dirname(this.config.path);
                if (!fs.existsSync(dbDir)) {
                    fs.mkdirSync(dbDir, { recursive: true });
                }
                if (fs.existsSync(this.config.path)) {
                    try {
                        fileContent = fs.readFileSync(this.config.path, "utf8");
                        this.data = JSON.parse(fileContent);
                    }
                    catch (error) {
                        console.error("Failed to load existing data:", error);
                        this.initializeTables();
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    DatabaseManager.prototype.saveDatabase = function () {
        try {
            var jsonData = JSON.stringify(this.data, null, 2);
            fs.writeFileSync(this.config.path, jsonData, "utf8");
        }
        catch (error) {
            console.error("Failed to save database:", error);
        }
    };
    DatabaseManager.prototype.close = function () {
        this.saveDatabase();
        console.log("Database connection closed");
    };
    DatabaseManager.prototype.backup = function (backupName) {
        var backupDir = this.config.backupPath;
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        var timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        var backupFileName = backupName || "backup-".concat(timestamp, ".json");
        var backupPath = path.join(backupDir, backupFileName);
        var jsonData = JSON.stringify(this.data, null, 2);
        fs.writeFileSync(backupPath, jsonData, "utf8");
        console.log("Database backup created:", backupPath);
        return backupPath;
    };
    DatabaseManager.prototype.executeQuery = function (sql, params) {
        // 간단한 SELECT 쿼리 파싱 (개발용)
        var selectMatch = sql.match(/SELECT \* FROM (\w+)/i);
        if (selectMatch) {
            var tableName = selectMatch[1];
            return this.data[tableName] || [];
        }
        var selectWhereMatch = sql.match(/SELECT \* FROM (\w+) WHERE (\w+) = \?/i);
        if (selectWhereMatch && params && params.length > 0) {
            var tableName = selectWhereMatch[1];
            var column_1 = selectWhereMatch[2];
            var value_1 = params[0];
            return (this.data[tableName] || []).filter(function (row) { return row[column_1] === value_1; });
        }
        return [];
    };
    DatabaseManager.prototype.executeUpdate = function (sql, params) {
        // 간단한 INSERT 쿼리 파싱
        var insertMatch = sql.match(/INSERT INTO (\w+)/i);
        if (insertMatch && params) {
            var tableName = insertMatch[1];
            if (!this.data[tableName]) {
                this.data[tableName] = [];
            }
            // 간단한 INSERT 처리 (실제로는 더 복잡한 파싱 필요)
            var newRecord = __assign({ id: Date.now().toString(), created_at: new Date().toISOString() }, params[0]);
            this.data[tableName].push(newRecord);
            this.saveDatabase();
            return { changes: 1 };
        }
        return { changes: 0 };
    };
    DatabaseManager.prototype.insertRecord = function (table, record) {
        if (!this.data[table]) {
            this.data[table] = [];
        }
        var newRecord = __assign({ id: Date.now().toString(), created_at: new Date().toISOString() }, record);
        this.data[table].push(newRecord);
        this.saveDatabase();
        return newRecord;
    };
    DatabaseManager.prototype.getAllRecords = function (table) {
        return this.data[table] || [];
    };
    DatabaseManager.prototype.getRecordById = function (table, id) {
        var records = this.data[table] || [];
        return records.find(function (record) { return record.id === id; }) || null;
    };
    return DatabaseManager;
}());
exports.DatabaseManager = DatabaseManager;
