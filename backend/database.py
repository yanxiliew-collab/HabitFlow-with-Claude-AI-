# database.py ─ 資料庫連線設定
# 負責：建立 PostgreSQL 連線引擎、建立 Session 工廠、提供 get_db() 給 main.py 用

from sqlalchemy import create_engine
# ↑ create_engine：建立資料庫連線引擎（Engine）
# 引擎管理「連線池」：預先建立若干條連線，請求來時借用，用完歸還
# 來自：sqlalchemy 套件

from sqlalchemy.orm import sessionmaker, declarative_base
# ↑ sessionmaker：工廠函式，建立 Session 工廠類別
#   Session 是你和資料庫「對話」的單位，一次 HTTP 請求對應一個 Session
# declarative_base：回傳基礎類別（Base），models.py 的 class 繼承它才能對應 DB 表
# 來自：sqlalchemy.orm 子模組

import os
# ↑ Python 標準函式庫（不需要安裝），提供 os.getenv() 讀取環境變數

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://habituser:habitpw@db:5432/habitdb"
)
# ↑ 從環境變數讀取 PostgreSQL 連線字串
# os.getenv("KEY", "預設值")：找不到環境變數時使用第二個參數
# docker-compose.yml 的 environment: DATABASE_URL=... 就是在設定這個
# 連線字串格式：postgresql://帳號:密碼@主機:端口/資料庫名
# 主機名 "db" 是 docker-compose 的服務名，Docker 內部 DNS 自動解析成正確 IP

engine = create_engine(DATABASE_URL)
# ↑ 用連線字串建立引擎（此時還不會真正連線，只設定連線參數）
# 引擎在底層使用 psycopg2-binary 套件和 PostgreSQL 通訊
# 來自：sqlalchemy 套件

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
# ↑ 建立 Session 工廠（不是 Session 物件本身，是「能建立 Session 的工廠」）
# bind=engine：用上面建立的引擎連線
# autocommit=False：不自動 commit，需手動 db.commit() 寫入才生效
# autoflush=False：不自動把待寫的資料同步到 DB，等 commit 時才送
# 來自：sqlalchemy 套件

Base = declarative_base()
# ↑ 建立 ORM 的基礎類別
# models.py 裡的 Habit、Checkin class 繼承這個 Base
# Base.metadata 記錄所有繼承它的 class 對應的表結構
# main.py 用 Base.metadata.create_all() 一次建立所有表
# 來自：sqlalchemy 套件


def get_db():
    # FastAPI 依賴注入函式（Dependency Injection）
    # 用法：在 main.py 路由函式的參數寫 db: Session = Depends(get_db)
    # FastAPI 每次收到請求時自動呼叫，把 Session 傳進路由函式
    # 請求結束後（不管成功或拋出例外），FastAPI 都會執行 finally 關閉 Session
    db = SessionLocal()
    # ↑ 呼叫工廠建立新的 Session（每個請求都有自己獨立的 Session）
    try:
        yield db
        # ↑ Python generator 語法：把 db 傳出去給路由函式使用
        # yield 之後暫停，等路由函式執行完再繼續
    finally:
        db.close()
        # ↑ 無論成功或失敗，Session 都會關閉並把連線歸還給連線池
