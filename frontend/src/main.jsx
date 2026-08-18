// main.jsx ─ React 應用程式的入口點
// 這個檔案只做一件事：把 App 元件掛到 index.html 的 <div id="root">
// 通常幾行就夠，不需要放業務邏輯，幾乎不需要修改

import React from 'react'
// ↑ 引入 React 核心套件
// React 17 後的新 JSX Transform 不強制要求這行，但加上去無害且相容性好
// 來自：react 套件（package.json 的 dependencies）

import ReactDOM from 'react-dom/client'
// ↑ 引入 React 的瀏覽器渲染套件（React 18 的新 Client API）
// react-dom/client 是 react-dom 套件的子路徑，提供 React 18 的新 API
// 來自：react-dom 套件（package.json 的 dependencies）

import App from './App'
// ↑ 從同一資料夾引入 App 元件（./App 對應 ./App.jsx，Vite 允許省略副檔名）
// App 是整個前端應用程式的根元件，所有畫面都在 App.jsx 裡

import './App.css'
// ↑ 引入 CSS 樣式檔
// Vite 允許在 JS/JSX 裡 import CSS，自動把樣式注入到 HTML 的 <head>

ReactDOM.createRoot(document.getElementById('root'))
// ↑ createRoot()：React 18 的新 API，建立應用程式的「根」
// document.getElementById('root')：找到 index.html 裡的 <div id="root">
// React 18 用 createRoot 取代舊的 ReactDOM.render()（效能更好，支援 Concurrent Mode）
// 來自：react-dom/client 子路徑

.render(
  // ↑ .render()：把 JSX 元件渲染進 root div

  <React.StrictMode>
    {/* StrictMode：開發輔助工具，只在開發環境有效（build 後自動移除）
        幫你找出潛在問題：不安全的生命週期、副作用問題等
        注意：StrictMode 會讓每個元件渲染兩次，所以開發時 console.log 可能出現兩次 */}

    <App />
    {/* ↑ 渲染 App 元件（App.jsx 裡 export default 的函式）
        JSX 語法：<App /> 等同於呼叫 App() 函式並回傳它的輸出 */}

  </React.StrictMode>
)
