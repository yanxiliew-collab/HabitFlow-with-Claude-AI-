# backend/Dockerfile ─ 後端容器建置說明書
# Docker 從上到下執行每一行，每行產生一個「層（layer）」
# 沒改動的層會被 cache 重用，加速下次 build

FROM python:3.11-slim
# ↑ 基礎映像：官方 Python 3.11 精簡版（slim = 去掉文件和除錯工具，Image 更小）
# FROM 是每個 Dockerfile 的第一行，指定從哪個基礎開始建置

WORKDIR /app
# ↑ 設定容器內的工作目錄（等同 mkdir -p /app && cd /app）
# 之後的 COPY、RUN 指令都以 /app 為基準路徑

COPY requirements.txt .
# ↑ 只先複製 requirements.txt，利用 Docker cache 機制：
# 若 requirements.txt 沒變，下一行 pip install 直接用 cache，不重新下載套件
# 若先 COPY . . 再 pip install，任何 .py 改動都讓 pip 重新執行（很慢）

RUN pip install --no-cache-dir -r requirements.txt
# ↑ 在容器裡安裝所有 Python 套件
# --no-cache-dir：不把 pip 的下載暫存存進 Image（讓 Image 更小）
# -r requirements.txt：從檔案讀取套件清單

COPY . .
# ↑ 把 backend/ 所有檔案（main.py、models.py、database.py）複製進 /app
# 放在 pip install 後：修改 .py 不影響套件安裝的 cache

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
# ↑ 容器啟動時執行的指令（每個容器只能有一個 CMD）
# uvicorn：ASGI 伺服器，負責接收 HTTP 並交給 FastAPI 處理（來自 uvicorn[standard] 套件）
# main:app：main.py 裡的 app 變數，格式：模組名:物件名
# --host 0.0.0.0：監聽所有網路介面（不寫只監聽 127.0.0.1，Docker 外面連不進來）
# --port 8000：對應 docker-compose.yml 的端口映射
