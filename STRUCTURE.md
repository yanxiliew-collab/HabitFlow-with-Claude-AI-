# HabitFlow 檔案分工說明

## 整體架構圖

```
.env                     ← 機密設定（密碼、API 網址），不進 GitHub
docker-compose.yml       ← 指揮官，統一啟動所有容器
│
├── backend/             ← 後端容器（FastAPI + Python）
│   ├── Dockerfile           說明怎麼把後端打包成 Image
│   ├── requirements.txt     Python 套件清單（pip install 用）
│   ├── database.py          建立 DB 連線，提供 Session
│   ├── models.py            定義資料表（Python class → SQL table）
│   └── main.py              API 路由，後端的大腦
│
└── frontend/            ← 前端容器（React → Nginx）
    ├── Dockerfile           Node 建置 React，再交給 Nginx
    ├── nginx.conf           Nginx 的路由設定（支援 React Router）
    ├── package.json         JS 套件清單（npm install 用）
    ├── vite.config.js       Vite 建置工具設定
    ├── index.html           HTML 骨架，只有 <div id="root">
    └── src/
        ├── main.jsx         React 入口點，把 App 掛到 HTML 上
        ├── App.jsx          前端核心，所有畫面和邏輯
        └── App.css          樣式
```

---

## 各檔案詳細說明

---

### `.env`
**角色：** 存放機密設定，不進 Git  
**提供給：** docker-compose.yml（讀 VITE_API_URL）、backend 容器（環境變數）

```
VITE_API_URL=http://localhost:8000
# VMware 用戶改成你的 VM IP，例如：
```

> ⚠️ `.gitignore` 已把這個檔案排除，不會上傳到 GitHub。

---

### `docker-compose.yml`
**角色：** 統一管理所有容器，定義端口、環境變數、啟動順序  
**從誰那裡拿：** `.env`、`backend/Dockerfile`、`frontend/Dockerfile`  
**提供給：** 啟動 backend、frontend、db、adminer 四個容器

重點設定：
- `depends_on: db: condition: service_healthy` → 確保 PostgreSQL 完全啟動後才啟動後端
- `VITE_API_URL: ${VITE_API_URL:-http://localhost:8000}` → 從 `.env` 讀取，傳給前端 build
- `pgdata` volume → 容器重啟後資料不會消失

---

### `backend/Dockerfile`
**角色：** 說明怎麼把後端打包成 Docker Image  
**從誰那裡拿：** `requirements.txt`、所有 `.py` 檔  
**提供給：** docker-compose.yml（build backend 用）

```dockerfile
COPY requirements.txt .
RUN pip install ...      # ← 先裝套件（這層會被 cache，之後 build 更快）
COPY . .                 # ← 再複製程式碼
CMD ["uvicorn", "main:app", ...]
```

> 💡 requirements.txt 先複製的原因：如果只改了 .py 而沒改套件，
> Docker 會直接用 cache 跳過 pip install，大幅加速 build。

---

### `backend/requirements.txt`
**角色：** 列出後端所有 Python 套件  
**提供給：** `backend/Dockerfile`（pip install 時讀這份）

```
fastapi          ← Web API 框架
uvicorn          ← 執行 FastAPI 的伺服器
sqlalchemy       ← ORM：用 Python class 操作資料庫
psycopg2-binary  ← PostgreSQL 的底層驅動（SQLAlchemy 用它）
```

---

### `backend/database.py`
**角色：** 建立與 PostgreSQL 的連線，提供 Session 給 main.py 用  
**從誰那裡拿：** `DATABASE_URL` 環境變數（來自 docker-compose → .env）  
**提供給：** `main.py`（`get_db` 函式）、`models.py`（`Base` 物件）

```python
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()   # models.py 繼承它

def get_db():               # main.py 用 Depends(get_db) 拿到 session
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()          # 請求結束自動關閉，不用自己管
```

---

### `backend/models.py`
**角色：** 用 Python class 描述資料庫的 table 結構  
**從誰那裡拿：** `database.py`（`Base` 物件，讓 class 繼承它）  
**提供給：** `main.py`（`Habit`、`Checkin` 類別）

```python
class Habit(Base):
    __tablename__ = "habits"
    id   = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    icon = Column(String(10), default="⭐")
    # SQLAlchemy 會自動把這個 class 翻譯成 SQL CREATE TABLE

class Checkin(Base):
    __tablename__ = "checkins"
    habit_id = Column(Integer, ForeignKey("habits.id"))  # 外鍵，關聯到 habits
    date     = Column(Date)
    # UniqueConstraint("habit_id", "date") → 每天每個習慣只能打一次卡
```

---

### `backend/main.py`
**角色：** 後端的大腦，定義所有 API 路由  
**從誰那裡拿：** `models.py`（Habit, Checkin）、`database.py`（get_db）  
**提供給：** 前端（HTTP JSON API）

```
GET    /habits              → 回傳所有習慣（含今日打卡狀態、連續天數）
POST   /habits              → 新增習慣（body: {name, icon}）
DELETE /habits/{id}         → 刪除習慣（打卡紀錄一起刪）
POST   /habits/{id}/checkin → 今日打卡
DELETE /habits/{id}/checkin → 取消今日打卡
GET    /                    → 健康檢查
```

資料流程：收到 HTTP 請求 → 拿 Session → 用 ORM 查/寫資料庫 → 序列化成 JSON 回傳

---

### `frontend/Dockerfile`
**角色：** 兩階段 build，最終用 Nginx 提供靜態頁面  
**從誰那裡拿：** `package.json`（npm install）、`src/`（React 原始碼）  
**提供給：** docker-compose.yml（frontend Image）

```
第一階段：node:20
  npm install → 安裝套件
  npm run build → 把 React 編譯成靜態 HTML/JS/CSS（輸出到 /app/dist）

第二階段：nginx:alpine
  把 /app/dist 放進 Nginx 的靜態目錄
  → 最終 Image 不含 Node.js，體積更小
```

> 💡 VITE_API_URL 在這裡被 build 進去，所以改了 .env 一定要重新 build。

---

### `frontend/nginx.conf`
**角色：** 設定 Nginx 的路由規則  
**提供給：** `frontend/Dockerfile`（COPY 進容器）

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
# ↑ 這行很重要：讓 React Router 的路徑（如 /about）不會 404
#   任何找不到的路徑都回 index.html，讓 React 自己處理路由
```

---

### `frontend/package.json`
**角色：** JS 套件清單 + 定義指令，等同於 requirements.txt  
**提供給：** `frontend/Dockerfile`（npm install 依據）

```json
"scripts": {
  "dev":   "vite",        ← 本地開發用（不是 Docker，直接 npm run dev）
  "build": "vite build"   ← Docker build 時用這個
}
```

---

### `frontend/vite.config.js`
**角色：** 告訴 Vite 這個專案用 React，需要 JSX 支援  
**提供給：** `npm run build`（build 工具的設定）

```js
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })
// 沒有這個，Vite 不認識 JSX 語法（<div> 這種寫法）
```

---

### `frontend/index.html`
**角色：** 網頁的 HTML 骨架，幾乎是空的  
**從誰那裡拿：** `src/main.jsx`（透過 script 載入）  
**提供給：** React（掛載點 `<div id="root">`）

```html
<body>
  <div id="root"></div>   ← React 把所有畫面塞進這裡
  <script type="module" src="/src/main.jsx"></script>
</body>
```

---

### `frontend/src/main.jsx`
**角色：** React 入口點，把 App 元件掛到 HTML 上  
**從誰那裡拿：** `index.html`（#root）、`App.jsx`  
**提供給：** 瀏覽器（把 App 渲染到頁面上）

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
// 這個檔案通常幾行就夠了，幾乎不需要改動
```

---

### `frontend/src/App.jsx`
**角色：** 整個前端的核心，所有畫面邏輯都在這裡  
**從誰那裡拿：** 後端 API（fetch 呼叫）、React（useState, useEffect）  
**提供給：** 使用者看到的所有畫面

主要邏輯：
```
useState([])       → 習慣清單的狀態，改了畫面自動更新
useEffect(fetchHabits, [])  → 載入時去後端拿一次資料
toggleCheckin(habit)  → 已打卡? DELETE /checkin : POST /checkin
addHabit()            → POST /habits，新增後重新 fetch
deleteHabit(id)       → DELETE /habits/{id}，刪除後重新 fetch
```

---

### `frontend/src/App.css`
**角色：** 所有樣式  
**提供給：** `App.jsx` 的 HTML 元素

---

## 資料流總覽

```
使用者按下「打卡」
    ↓
App.jsx: toggleCheckin(habit) 被呼叫
    ↓ HTTP POST /habits/1/checkin
main.py: checkin() 函式接收請求
    ↓ db.add(Checkin(...))  ← SQLAlchemy ORM
PostgreSQL: INSERT INTO checkins VALUES (...)
    ↑ 回傳成功
main.py: habit_to_dict() 重新查詢並回傳 JSON
    ↑ { id:1, name:"讀英文", done_today:true, streak:6 }
App.jsx: setHabits(data) 更新狀態
    ↓
瀏覽器：✅ 讀英文 🔥 6天
```
