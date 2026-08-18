# models.py ─ 資料表結構定義（ORM Models）
# SQLAlchemy 把這裡的 Python class 翻譯成 PostgreSQL 的 CREATE TABLE
# 查詢時，DB 回傳的 row 也會被包成這些 class 的物件

from sqlalchemy import Column, Integer, String, Date, ForeignKey, UniqueConstraint
# ↑ 從 sqlalchemy 套件引入欄位相關的類別：
# Column            定義一個資料表欄位
# Integer           整數型別（→ SQL INTEGER，主鍵時自動用 SERIAL 自動遞增）
# String            字串型別（→ SQL VARCHAR）
# Date              日期型別，只有年月日（→ SQL DATE）
# ForeignKey        外鍵約束，讓欄位參照另一張表的主鍵
# UniqueConstraint  多欄位組合的唯一約束

from sqlalchemy.orm import relationship
# ↑ relationship：定義兩個 ORM Model 之間的關聯關係（一對多、多對多等）
# 設定後可以用 habit.checkins 直接取得所有打卡紀錄（SQLAlchemy 自動 JOIN 查詢）
# 來自：sqlalchemy.orm 子模組

from database import Base
# ↑ 從 database.py 引入 Base 類別（同一資料夾，直接寫模組名）
# Habit 和 Checkin 都要繼承 Base，SQLAlchemy 才知道它們是 ORM Model


class Habit(Base):
    # ↑ 繼承 Base，告訴 SQLAlchemy 這個 class 對應一張 DB 資料表

    __tablename__ = "habits"
    # ↑ 對應的資料表名稱，DB 裡真正的表名叫 "habits"
    # create_all() 會建立這張表；db.query(Habit) 會查這張表

    id = Column(Integer, primary_key=True, index=True)
    # ↑ 整數主鍵欄位
    # primary_key=True：主鍵（不可重複、不可為空）
    # index=True：建立索引，讓依 id 查詢更快
    # PostgreSQL 看到 Integer + primary_key 自動使用 SERIAL（1,2,3... 自動遞增）

    name = Column(String(100), nullable=False)
    # ↑ 習慣名稱欄位，最多 100 個字元
    # nullable=False：不能是 NULL（必填）
    # → SQL：name VARCHAR(100) NOT NULL

    icon = Column(String(10), default="⭐")
    # ↑ 習慣圖示欄位，最多 10 個字元（一個 emoji 約 1-4 bytes）
    # default="⭐"：SQLAlchemy 層面的預設值，新增時沒傳 icon 就用 ⭐

    checkins = relationship(
        "Checkin",                       # 關聯的 Model 名稱（字串，避免循環引入）
        back_populates="habit",          # 對應 Checkin.habit 的反向關聯
        cascade="all, delete-orphan",    # 刪除 Habit 時，所有相關 Checkin 也一起刪
    )
    # ↑ 一對多關係：一個 Habit 對應多個 Checkin
    # 使用後：habit.checkins 回傳該習慣所有打卡紀錄（Python list）
    # 來自：sqlalchemy.orm 子模組

    comments = relationship(
        "Comment",                       # 關聯的 Model 名稱（字串，避免循環引入）
        back_populates="habit",          # 對應 Comment.habit 的反向關聯
        cascade="all, delete-orphan",    # 刪除 Habit 時，所有相關 Comment 也一起刪
    )
    # ↑ 一對多關係：一個 Habit 對應多個 Comment
    # 使用後：habit.comments 回傳該習慣所有留言（Python list）


class Checkin(Base):
    __tablename__ = "checkins"
    # ↑ 對應 checkins 資料表

    __table_args__ = (
        UniqueConstraint("habit_id", "date", name="uq_habit_date"),
        # ↑ 多欄位唯一約束：habit_id + date 的組合不能重複
        # 作用：防止同一習慣在同一天打卡兩次
        # name：這個約束在 DB 裡的識別名稱（錯誤訊息會顯示）
        # → SQL：CONSTRAINT uq_habit_date UNIQUE(habit_id, date)
    )
    # ↑ __table_args__：傳入 tuple，設定表格層級的約束和選項

    id = Column(Integer, primary_key=True, index=True)
    # ↑ 自動遞增主鍵（同 Habit.id）

    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    # ↑ 外鍵欄位，參照 habits 表的 id
    # ForeignKey("habits.id")：值必須存在於 habits.id 中
    # ondelete="CASCADE"：被參照的 Habit 刪除時，這筆 Checkin 自動刪除
    # nullable=False：每筆打卡一定要屬於某個習慣

    date = Column(Date, nullable=False)
    # ↑ 打卡日期（只有年月日）
    # 搭配 UniqueConstraint 確保每天每個習慣只能打一次卡
    # 在 main.py 用 Python 的 date.today() 取得今天日期

    habit = relationship("Habit", back_populates="checkins")
    # ↑ 反向關聯：從 Checkin 可以存取所屬的 Habit
    # 使用後：checkin.habit 回傳對應的 Habit 物件

class Comment(Base):
    __tablename__ = "comments"
    # ↑ 對應 comments 資料表

    __table_args__ = (
        UniqueConstraint("habit_id", "date", name="uq_comments_habit_date"),
        # ↑ 多欄位唯一約束：habit_id + date 的組合不能重複
        # 作用：防止同一習慣在同一天打卡兩次
        # name：這個約束在 DB 裡的識別名稱（錯誤訊息會顯示）
        # → SQL：CONSTRAINT uq_habit_date UNIQUE(habit_id, date)
    )
    # ↑ __table_args__：傳入 tuple，設定表格層級的約束和選項

    id = Column(Integer, primary_key=True, index=True)
    # ↑ 自動遞增主鍵（同 Habit.id）

    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    # ↑ 外鍵欄位，參照 habits 表的 id
    # ForeignKey("habits.id")：值必須存在於 habits.id 中
    # ondelete="CASCADE"：被參照的 Habit 刪除時，這筆 Checkin 自動刪除
    # nullable=False：每筆打卡一定要屬於某個習慣

    date = Column(Date, nullable=False)
    # ↑ 打卡日期（只有年月日）
    # 搭配 UniqueConstraint 確保每天每個習慣只能打一次卡
    # 在 main.py 用 Python 的 date.today() 取得今天日期

    comment = Column(String(200), nullable=True)
    # ↑ 打卡留言欄位，最多 200 個字元

    habit = relationship("Habit", back_populates="comments")
    # ↑ 反向關聯：從 Checkin 可以存取所屬的 Habit
    # 使用後：checkin.habit 回傳對應的 Habit 物件

