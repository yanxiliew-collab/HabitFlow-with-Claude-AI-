# HabitFlow 習慣打卡追蹤器

## 啟動方式

```bash
# 1. 複製並進入專案
git clone https://github.com/yanxiliew-collab/HabitFlow-with-Claude-AI-.git
cd HabitFlow-with-Claude-AI-


# 2. 如果你是用 VMware 虛擬機，先修改 .env
#    把 VITE_API_URL=http://localhost:8000
#    改成 VITE_API_URL=http://你的VM-IP:8000

# 3. 啟動所有服務
docker compose up --build
```

## 瀏覽器打開

| 服務 | 網址 |
|---|---|
| 前端 App | http://localhost:5173 |
| API 文件（Swagger）| http://localhost:8000/docs |
| 資料庫管理（Adminer）| http://localhost:8080 |

> Adminer 登入資訊：System=PostgreSQL, Server=db, Username=habituser, Password=habitpw, Database=habitdb

## 功能

- ✅ 新增習慣（選 emoji + 輸入名稱）
- ✅ 每天打卡 / 取消打卡
- ✅ 顯示連續天數（🔥 N 天）
- ✅ 刪除習慣
