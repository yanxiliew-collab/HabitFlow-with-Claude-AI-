# frontend/Dockerfile ─ 前端容器建置說明書
# 使用兩階段建置（Multi-stage Build）：
# 第一階段用 Node.js 編譯 React，第二階段用 Nginx 提供靜態頁面
# 最終 Image 不含 Node.js，體積更小

# ── 第一階段：建置（Build Stage）────────────────────────────────
FROM node:20-alpine AS builder
# ↑ 基礎映像：node:20-alpine（Node.js 20 + Alpine Linux 輕量版）
# AS builder：給這個階段命名，第二階段 COPY --from=builder 用到

WORKDIR /app
# ↑ 設定容器內工作目錄

ARG VITE_API_URL=http://localhost:8000
# ↑ ARG：宣告建置參數（Build Argument），只在建置過程中有效
# docker-compose.yml 的 args: VITE_API_URL: ... 就是傳入這個參數
# 預設值 http://localhost:8000（沒有傳入時使用）

ENV VITE_API_URL=$VITE_API_URL
# ↑ 把 ARG 的值轉成環境變數（ENV）
# Vite 在 npm run build 時讀取環境變數，把 VITE_API_URL 寫死進 JS bundle
# 必須用 ENV，因為 RUN 命令只能讀 ENV，不能讀 ARG

COPY package*.json .
# ↑ 先只複製 package.json 和 package-lock.json（利用 Docker cache）
# package*.json：通配符，匹配 package.json 和 package-lock.json

RUN npm install
# ↑ 安裝 package.json 裡所有 JS 套件到 node_modules/
# 放在 COPY . . 前面：若 package.json 沒改，npm install 直接用 cache

COPY . .
# ↑ 複製所有前端原始碼（src/、index.html、vite.config.js 等）

RUN npm run build
# ↑ 執行 npm run build（對應 package.json 的 "build": "vite build"）
# Vite 把 JSX 編譯成最佳化的 HTML/JS/CSS，輸出到 /app/dist 資料夾

# ── 第二階段：服務（Serve Stage）────────────────────────────────
FROM nginx:alpine
# ↑ 新的基礎映像：Nginx + Alpine Linux
# 這個階段不含第一階段的 node_modules 和原始碼，只有編譯好的靜態檔案

COPY --from=builder /app/dist /usr/share/nginx/html
# ↑ 從第一階段（builder）的 /app/dist 複製靜態檔案到 Nginx 的網頁根目錄
# Nginx 預設從 /usr/share/nginx/html 提供靜態頁面

COPY nginx.conf /etc/nginx/conf.d/default.conf
# ↑ 把自訂的 nginx.conf 覆蓋 Nginx 的預設設定
# 這樣才能啟用 React Router 支援

EXPOSE 80
# ↑ 聲明容器監聽 80 端口（文件用途，實際端口映射在 docker-compose.yml）

CMD ["nginx", "-g", "daemon off;"]
# ↑ 啟動 Nginx（daemon off = 在前景執行，Docker 需要主程序在前景，daemon 模式會讓容器立刻退出）
