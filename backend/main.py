# main.py ─ 後端 API 路由（後端的核心大腦）
# 所有 HTTP 端點（Endpoint）都在這裡定義
# 每個函式對應一個 API 路由，接收請求、操作 DB、回傳 JSON

from fastapi import FastAPI, Depends, HTTPException
# ↑ fastapi 套件提供：
# FastAPI        應用程式主類別，建立 app 物件
# Depends        依賴注入宣告，讓 FastAPI 自動呼叫 get_db() 並傳入函式
# HTTPException  拋出 HTTP 錯誤（404 Not Found、400 Bad Request 等）

from fastapi.middleware.cors import CORSMiddleware
# ↑ CORS 中介軟體（Cross-Origin Resource Sharing，跨來源資源共用）
# 讓 FastAPI 回應時加上 Access-Control-Allow-Origin 標頭
# 沒有這個，瀏覽器會阻止前端（:5173）讀取後端（:8000）的回應
# 來自：fastapi.middleware.cors 子模組

from sqlalchemy.orm import Session
# ↑ Session 型別，用於函式參數的型別提示（讓 IDE 有自動補全）
# 實際的 Session 物件由 database.py 的 get_db() 建立
# 來自：sqlalchemy.orm 子模組

from sqlalchemy.exc import IntegrityError
# ↑ SQLAlchemy 例外類別
# 違反資料庫約束（例如 UniqueConstraint）時拋出
# 用來捕捉「同一習慣同一天打卡兩次」的錯誤
# 來自：sqlalchemy.exc 子模組

from datetime import date, timedelta
# ↑ Python 標準函式庫 datetime 模組（不需安裝）：
# date      日期型別（只有年月日），date.today() 取得今天日期
# timedelta 時間差，timedelta(days=1) 代表「一天」，用於計算連續天數

from pydantic import BaseModel, Field
# ↑ Pydantic 的基礎 Model 類別
# 繼承 BaseModel 的 class 會自動驗證欄位型別
# FastAPI 用它解析並驗證 HTTP 請求的 JSON body
# pydantic 在安裝 fastapi 時自動一起安裝（是 fastapi 的依賴套件）

import models
# ↑ 引入 models.py（同一資料夾，直接寫模組名）
# 提供 models.Habit、models.Checkin 兩個 ORM Model class

from database import get_db, engine, Base
# ↑ 從 database.py 引入三個物件：
# get_db  依賴注入函式（FastAPI 用它為每個請求建立/關閉 DB Session）
# engine  SQLAlchemy 連線引擎（用於 create_all 建立資料表）
# Base    ORM 基礎類別（Base.metadata 記錄所有表的結構）

Base.metadata.create_all(bind=engine)
# ↑ 應用程式啟動時執行：檢查所有 ORM Model 對應的表是否存在，不存在就建立
# Base.metadata：包含 Habit 和 Checkin 兩張表的結構資訊
# create_all()：對每張表執行 CREATE TABLE IF NOT EXISTS，不用手動寫 SQL

app = FastAPI(title="HabitFlow API", version="1.0.0")
# ↑ 建立 FastAPI 應用程式主物件
# title、version 顯示在 /docs（Swagger UI）頁面上
# 所有路由都掛在這個 app 物件上（用 @app.get/@app.post 等裝飾器）
# 來自：fastapi 套件

app.add_middleware(
    CORSMiddleware,           # 加入 CORS 中介軟體，所有請求先經過這裡
    allow_origins=["*"],      # 允許任何來源（開發用，正式環境改成具體前端網址）
    allow_credentials=True,   # 允許請求攜帶 Cookie
    allow_methods=["*"],      # 允許所有 HTTP 方法（GET POST DELETE PUT OPTIONS 等）
    allow_headers=["*"],      # 允許所有 HTTP 標頭（Content-Type Authorization 等）
)
# ↑ add_middleware：把 CORS 中介軟體加入處理鏈
# 每個請求進來先經過 CORSMiddleware，加上正確的 CORS 標頭再繼續處理


# ── Pydantic Schema ──────────────────────────────────────────────────────
class HabitCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    icon: str = Field(default="⭐", max_length=10)

class CommentCreate(BaseModel):
    date: date
    comment: str = Field(max_length=200)

class HabitUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


# ── 工具函式 ─────────────────────────────────────────────────────────────
def get_streak(habit_id: int, db: Session, target_date: date | None = None) -> int:
    # 計算從今天往回數的連續打卡天數（streak）
    dates = {
        c.date for c in                       # Set comprehension，建立日期集合
        db.query(models.Checkin)              # 查詢 checkins 表（SQLAlchemy ORM）
        .filter(models.Checkin.habit_id == habit_id)  # WHERE habit_id = habit_id
        .all()                                # 取所有結果（回傳 Python list）
    }
    # ↑ 等同 SQL：SELECT date FROM checkins WHERE habit_id = x
    # 建成集合（Set）方便用 in 快速查詢（O(1) 時間複雜度）

    streak = 0            # 連續天數計數器
    check = target_date if target_date is not None else date.today()  # 從指定日期開始往前找
    while check in dates: # 如果這一天有打卡紀錄
        streak += 1                    # 連續天數加一
        check -= timedelta(days=1)     # 往前一天（timedelta 來自 Python datetime 模組）
    return streak                      # 回傳連續天數（0 表示今天沒打卡或從未打卡）


def habit_to_dict(habit: models.Habit, db: Session, target_date: date | None = None) -> dict:
    # 把 Habit ORM 物件轉成含額外資訊的 dict，供 API 序列化成 JSON 回傳
    today = target_date if target_date is not None else date.today()
    done_today = (
        db.query(models.Checkin)                           # 查 checkins 表
        .filter(
            models.Checkin.habit_id == habit.id,           # WHERE habit_id = id
            models.Checkin.date == today                   # AND date = 今天
        )
        .first()    # 取第一筆（有打卡回傳物件，沒有回傳 None）
    ) is not None   # 轉成布林值：有打卡 = True，沒打卡 = False
    # ↑ 等同 SQL：SELECT 1 FROM checkins WHERE habit_id=x AND date=今天 LIMIT 1

    return {
        "id": habit.id,                      # 習慣 ID（來自 habits 表）
        "name": habit.name,                  # 習慣名稱
        "icon": habit.icon,                  # 習慣圖示
        "done_today": done_today,            # 今天是否已打卡（布林值）
        "streak": get_streak(habit.id, db, today),  # 呼叫上方函式計算連續天數
        "comments": [
            {
                "id": c.id,
                "date": c.date.isoformat(),
                "text": c.comment
            }
            for c in habit.comments  # 取出該習慣的所有打卡留言（Checkin ORM 物件）
        ],
        "checkins": [
                    {
                        "date": c.date.isoformat(),
                    }
                    for c in habit.checkins  # 取出該習慣的所有打卡留言（Checkin ORM 物件）
                ]
    }
    # ↑ FastAPI 看到路由函式 return dict，自動序列化成 JSON 字串回傳


# ── API 路由 ─────────────────────────────────────────────────────────────

@app.get("/")
# ↑ 裝飾器：把下面的函式綁定到 HTTP GET 方法 + "/" 路徑
def root():
    return {"status": "ok", "message": "HabitFlow API running ✅"}
    # ↑ 回傳 dict，FastAPI 自動轉成 JSON（健康檢查端點）


@app.get("/habits")
# ↑ GET /habits：取得所有習慣清單
def get_habits(target_date: date | None = None, db: Session = Depends(get_db)):
    # ↑ db：FastAPI 自動呼叫 get_db() 拿到 Session 並注入
    # Depends(get_db)：依賴注入宣告，來自 fastapi 套件
    if target_date is None:
        target_date = date.today()
    habits = db.query(models.Habit).all()
    # ↑ SQLAlchemy：等同 SQL → SELECT * FROM habits
    # db.query(Model)：建立查詢物件；.all()：執行並取所有結果
    return [habit_to_dict(h, db, target_date) for h in habits]
    # ↑ 列表生成式：對每個 Habit 物件呼叫 habit_to_dict，組成回傳的 list


@app.post("/habits", status_code=201)
# ↑ POST /habits：新增一個習慣
# status_code=201：成功時回傳 HTTP 201 Created（比 200 更符合 REST 語義）
def create_habit(body: HabitCreate, db: Session = Depends(get_db)):
    # ↑ body: HabitCreate：FastAPI 自動從 HTTP 請求 JSON body 解析並驗證
    habit = models.Habit(name=body.name.strip(), icon=body.icon)
    # ↑ 建立 Habit ORM 物件（還沒寫進 DB）
    # body.name.strip()：去掉前後空白（Python 字串內建方法）
    db.add(habit)    # 把物件加入 Session（標記為「待新增」）
    db.commit()      # 提交：INSERT INTO habits (name, icon) VALUES (...); COMMIT;
    db.refresh(habit)  # 重新從 DB 讀取（主要是取得 DB 自動產生的 id）
    return {"message": "Created"}


@app.delete("/habits/{habit_id}")
# ↑ DELETE /habits/{habit_id}：刪除指定習慣
# {habit_id} 是路徑參數（Path Parameter），從 URL 取出
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    # ↑ habit_id: int：FastAPI 自動從 URL 取出並轉型為整數
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
    # ↑ 等同 SQL：SELECT * FROM habits WHERE id = habit_id LIMIT 1
    # .filter(條件)：加 WHERE 子句；.first()：取第一筆，找不到回傳 None
    if not habit:
        raise HTTPException(404, "Habit not found")
    # ↑ HTTPException 來自 fastapi 套件，FastAPI 自動轉成 JSON 錯誤回應
    db.delete(habit)  # 標記刪除（cascade 會連同 Checkin 一起刪）
    db.commit()       # DELETE FROM habits WHERE id = habit_id; COMMIT;
    return {"message": "Deleted"}


@app.post("/habits/{habit_id}/checkin")
# ↑ POST /habits/{habit_id}/checkin：今日打卡
def checkin(habit_id: int, db: Session = Depends(get_db), target_date: date | None = None):
    target_date = target_date if target_date is not None else date.today()
    if not db.query(models.Habit).filter(models.Habit.id == habit_id).first():
        raise HTTPException(404, "Habit not found")
    # ↑ 先確認習慣存在，否則回傳 404
    try:
        c = models.Checkin(habit_id=habit_id, date=target_date)
        # ↑ 建立打卡紀錄（habit_id + 今天日期）
        db.add(c)    # 加入 Session
        db.commit()  # INSERT INTO checkins (habit_id, date) VALUES (...);
    except IntegrityError:
        # ↑ 違反 UniqueConstraint（今天此習慣已打卡）時拋出，來自 sqlalchemy.exc
        db.rollback()  # 回滾：撤銷未完成的操作，讓 DB 回到原本狀態
        raise HTTPException(400, "Already checked in today")
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
    return habit_to_dict(habit, db, target_date)


@app.delete("/habits/{habit_id}/checkin")
# ↑ DELETE /habits/{habit_id}/checkin：取消今日打卡
def undo_checkin(habit_id: int, db: Session = Depends(get_db), target_date: date | None = None):
    target_date = target_date if target_date is not None else date.today()
    c = (
        db.query(models.Checkin)
        .filter(
            models.Checkin.habit_id == habit_id,  # WHERE habit_id = x
            models.Checkin.date == target_date           # AND date = 指定日期
        )
        .first()  # 取指定日期的打卡紀錄（沒有就是 None）
    )
    # ↑ 等同 SQL：SELECT * FROM checkins WHERE habit_id=x AND date=指定日期 LIMIT 1
    if not c:
        raise HTTPException(404, "No checkin found for the specified date")
    db.delete(c)   # 標記刪除
    db.commit()    # DELETE FROM checkins WHERE id = c.id; COMMIT;
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
    return habit_to_dict(habit, db, target_date)

@app.post("/habits/{habit_id}/comments")
def post_comment(habit_id: int, body: CommentCreate, db: Session = Depends(get_db)):
    habit = (db.query(models.Habit).filter(models.Habit.id == habit_id).first())

    if not habit:
        raise HTTPException(404, "Habit not found")

    comment = (
        db.query(models.Comment)
        .filter(
            models.Comment.habit_id == habit_id,
            models.Comment.date == body.date
        )
        .first()
    )

    if comment:
        # 已經有 comment → 修改
        comment.comment = body.comment
    else:
        # 沒有 comment → 新增
        comment = models.Comment(
            habit_id=habit_id,
            date=body.date,
            comment=body.comment
        )
        db.add(comment)

    db.commit()

    return {"message": "Comment saved"}

@app.delete("/comments/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = (
        db.query(models.Comment)
        .filter(models.Comment.id == comment_id)
        .first()
    )

    if not comment:
        raise HTTPException(404, "Comment not found")

    habit_id = comment.habit_id

    db.delete(comment)
    db.commit()

    habit = (
        db.query(models.Habit)
        .filter(models.Habit.id == habit_id)
        .first()
    )

    return {"message": "Comment deleted"}

@app.put("/habits/{habit_id}")
def change_name(habit_id: int, body: HabitUpdate, db: Session = Depends(get_db)):
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(404, "Habit not found")
    habit.name = body.name
    db.commit()
    return {"message": "Habit renamed"}