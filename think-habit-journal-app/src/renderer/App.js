"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var App = function () {
    return (<div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Think-Habit Journal</h1>
      <p>데스크톱 애플리케이션이 성공적으로 시작되었습니다!</p>
      <div>
        <h2>기능 테스트</h2>
        <button onClick={function () {
            if (window.electronAPI) {
                window.electronAPI.app.getVersion().then(function (version) {
                    alert("\uC571 \uBC84\uC804: ".concat(version));
                });
            }
        }}>
          앱 버전 확인
        </button>
      </div>
    </div>);
};
exports.default = App;
