// vite.config.js ─ Vite 建置工具的設定檔
// Vite 負責：開發伺服器（npm run dev）和打包（npm run build）

import { defineConfig } from 'vite'
// ↑ defineConfig：從 vite 套件引入的輔助函式
// 功能：讓 IDE 有型別提示和自動補全，直接 export 物件也可以但少了提示
// 來自：vite 套件（devDependencies）

import react from '@vitejs/plugin-react'
// ↑ 從 @vitejs/plugin-react 引入 React 外掛
// 這個外掛讓 Vite 能夠：
// 1. 解析 .jsx 的 JSX 語法（<div>、<App /> 等轉成 React.createElement()）
// 2. React Fast Refresh：開發時修改程式碼，瀏覽器局部更新不整頁刷新
// 來自：@vitejs/plugin-react 套件（devDependencies）

export default defineConfig({
// ↑ export default：用 ES Module 語法匯出設定物件
// package.json 設了 "type":"module"，所以用 import/export 而非 module.exports

  plugins: [react()],
  // ↑ plugins：要啟用的 Vite 外掛列表（陣列）
  // react()：呼叫 React 外掛函式，回傳外掛設定物件
  // 沒有這個，Vite 不認識 JSX 語法，遇到 <App /> 會直接報錯
})
