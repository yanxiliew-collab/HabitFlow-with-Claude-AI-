# package.json 各欄位說明

> JSON 不支援注釋，所以另建此說明檔對照閱讀。

## 欄位說明

| 欄位 | 值 | 說明 |
|---|---|---|
| `name` | `"habitflow-frontend"` | 專案名稱（npm 發布用，本地開發可隨意） |
| `private` | `true` | 防止意外發布到 npm 公開倉庫 |
| `version` | `"0.1.0"` | 語義化版本：主版本.次版本.修補版本 |
| `type` | `"module"` | 使用 ES Module 語法（`import/export`）而非舊式 CommonJS（`require()`） |

## scripts（npm run 可執行的指令）

| 指令 | 實際執行 | 用途 |
|---|---|---|
| `npm run dev` | `vite` | 啟動 Vite 開發伺服器（熱重載，改程式碼瀏覽器立即更新）|
| `npm run build` | `vite build` | 把 JSX 編譯成最佳化靜態檔案，輸出到 dist/ |
| `npm run preview` | `vite preview` | 在本機預覽 build 後的結果 |

## dependencies（執行時需要，會打包進 build 產物）

| 套件 | 說明 |
|---|---|
| `react ^18.3.1` | React 核心：提供 useState、useEffect、JSX 運行時 |
| `react-dom ^18.3.1` | React 的瀏覽器渲染層：提供 ReactDOM.createRoot() |

## devDependencies（只在建置時需要，不打包進最終 JS）

| 套件 | 說明 |
|---|---|
| `@vitejs/plugin-react ^4.3.1` | 讓 Vite 認識並編譯 JSX 語法（`<div>`、`<App />` 等）|
| `vite ^5.4.0` | 前端建置工具：開發伺服器 + 打包（比舊式 webpack 快很多）|

## 版本號的 ^ 符號

`^18.3.1` = 允許自動更新到 `18.x.x`（次版本和修補），但不升主版本（不到 `19.x`）
