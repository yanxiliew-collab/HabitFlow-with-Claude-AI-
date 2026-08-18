// App.jsx ─ 前端應用程式的核心元件
// 所有畫面和互動邏輯都在這裡，這個檔案你會花最多時間修改

import { useState, useEffect, useRef } from 'react'
// ↑ 從 react 套件引入兩個最常用的 Hook：
// useState   管理元件「狀態」：資料改變時 React 自動重新渲染畫面
// useEffect  執行「副作用」：載入時打 API、訂閱事件等
// useRef     獲取 DOM 元素的參考
// 來自：react 套件（package.json 的 dependencies）

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
// ↑ 讀取後端 API 的基礎網址
// import.meta.env：Vite 提供的環境變數物件（Vite 特有，不是瀏覽器原生）
// VITE_API_URL：在 build 時被 Vite 讀取 .env 並寫死進 JS bundle
// || 'http://localhost:8000'：沒有設定 VITE_API_URL 時的備用值

const EMOJIS = ['⭐','📖','💪','💻','🎵','🧘','🍎','✏️','🏃','💧','🎯','🌟','🎨','📝','🔥']
// ↑ 新增習慣時可選的 emoji 清單（普通 JavaScript 常數陣列）
// const：宣告常數（不可重新賦值這個參考，但陣列內容可以改）



export default function App() {
// ↑ export default：把 App 函式匯出為預設匯出（main.jsx 的 import App from './App' 引入）
// function App()：React 函式元件（名稱首字母大寫是 React 的規定，區分 HTML 標籤和元件）

  const now = new Date()
  const today =`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [selectedDate, setSelectedDate] = useState(new Map());
  const [inputYear, setInputYear] = useState(new Map())
  const [inputMonth, setInputMonth] = useState(new Map())

  const strDate = (convertedDate) => {
    const year = convertedDate.getFullYear();
    const month = String(convertedDate.getMonth() + 1).padStart(2, '0');
    const day = String(convertedDate.getDate()).padStart(2, '0');

    return {
      year,
      month,
      day,
      str: `${year}-${month}-${day}`,
    };
  };

  const isValidDateString = (value) => {
    if (typeof value !== 'string') {
      return false;
    }

    const match = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);

    if (!match) {
      return false;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return false;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const [habits, setHabits]     = useState([])
  // ↑ useState([])：宣告一個狀態變數，初始值是空陣列
  // habits：目前的習慣清單（讀取用）
  // setHabits：更新函式（呼叫它 React 才會重新渲染）
  // 來自：react 套件

  const [loading, setLoading]   = useState(true)
  // ↑ 載入狀態，初始 true（一開始顯示載入中）
  // API 回應後設為 false，隱藏載入提示

  const [error, setError]       = useState(null)
  // ↑ 錯誤訊息，初始 null（沒有錯誤）
  // API 失敗時設定錯誤文字顯示提示框

  const [showForm, setShowForm] = useState(false)
  // ↑ 控制新增習慣表單的顯示/隱藏
  // false = 隱藏（顯示「+新增」按鈕），true = 顯示表單

  const [showModal, setShowModal] = useState(false)

  const [showCalendar,setShowCalendar] = useState(null)

  const [modalInfo, setModalInfo] = useState(null)

  const [showCommentOrCalendar, setShowCommentOrCalendar] = useState(new Map())
  // ↑ 選擇顯示comment的habitID

  const [showNewComment, setShowNewComment] = useState(new Set())

  const [inputNewComment, setInputNewComment] = useState(new Map())

  const [inputComment, setInputComment] = useState(new Map())

  const [inputModal, setInputModal] = useState('')

  const [inputName, setInputName] = useState(new Map())

  const [newCommentDate, setNewCommentDate] = useState(new Map())

  const [focus, setFocus] = useState(new Map())

  const textareaRefs = useRef(new Map())

  const newtextareaRefs = useRef(new Map())

  const [name, setName]         = useState('')
  // ↑ 新增表單「名稱」輸入框的值（初始空字串）

  const [icon, setIcon]         = useState('⭐')
  // ↑ 目前選取的 emoji 圖示，初始值 ⭐

  const [busy, setBusy]         = useState(false)
  // ↑ 是否正在等待 API 回應，防止重複送出請求

  const [calendarPosition, setCalendarPosition] = useState('right');

  const openCalendar = (habit) => {
    const input = document.querySelector(
      `[data-date-input="${habit.id}"]`
    );

    if (!input) return;

    const rect = input.getBoundingClientRect();

    const calendarWidth = 320;
    const margin = 10;

    const spaceRight =
      window.innerWidth - rect.left;

    const spaceLeft =
      rect.right;

    if (spaceRight >= calendarWidth + margin) {
      setCalendarPosition('right');
    } else if (spaceLeft >= calendarWidth + margin) {
      setCalendarPosition('left');
    } else {
      setCalendarPosition('right');
    }

    setShowCalendar(habit.id);
  };

  const fetchHabits = async () => {
  // ↑ async：非同步函式宣告，函式裡可以用 await 等待 Promise
  // 這個函式從後端取得習慣清單並更新 habits state
  
    try {
      const res = await fetch(`${API}/habits?target_date=${today}`)
      // ↑ fetch()：瀏覽器內建的 HTTP 請求函式（不需要額外套件）
      // await：等待 HTTP 回應，才繼續執行（等同 GET http://localhost:8000/habits）
      // 模板字面值（Template Literal）：用反引號包住，${...} 插入變數

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      // ↑ res.ok：HTTP 狀態碼 200-299 時為 true
      // 4xx/5xx 時拋出錯誤（fetch 預設不自動拋出 HTTP 錯誤）

      setHabits(await res.json())
      // ↑ res.json()：把 HTTP 回應的 JSON body 解析成 JavaScript 物件
      // setHabits(...)：更新 state，觸發 React 重新渲染畫面

      setError(null)        // 成功時清除錯誤訊息
    } catch (e) {
      setError(`無法連到後端 API (${API})，請確認 docker compose 有在跑。`)
      // ↑ 任何錯誤（網路問題、API 回傳錯誤）都設定錯誤訊息
    } finally {
      setLoading(false)     // 無論成功或失敗都結束載入狀態
    }
  }

  useEffect(() => { fetchHabits() }, [])
  // ↑ useEffect(函式, 依賴陣列)：元件生命週期 Hook
  // 第一個參數：要執行的函式（呼叫 fetchHabits 去打 API）
  // 第二個參數 []：空陣列 = 只在元件「第一次載入」時執行一次
  // 相當於舊式 class 元件的 componentDidMount
  // 來自：react 套件

  const addHabit = async () => {
    if (!name.trim() || busy) return

    setBusy(true)

    try {
      const res = await fetch(`${API}/habits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          icon
        }),
      })

      if (!res.ok) {
        const message = await res.text()
        throw new Error(`HTTP ${res.status}: ${message}`)
      }

      setName('')
      setShowForm(false)
      setError(null)

      await fetchHabits()
    } catch (e) {
      console.error('新增習慣失敗:', e)
      setError(`新增習慣失敗：${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  const toggleCheckin = async (habit) => {
    if (busy) return

    setBusy(true)

    try {
      const res = await fetch(
        `${API}/habits/${habit.id}/checkin?target_date=${today}`,
        {
          method: habit.done_today ? 'DELETE' : 'POST',
        }
      )

      if (!res.ok) {
        const message = await res.text()
        throw new Error(`HTTP ${res.status}: ${message}`)
      }

      setError(null)

      await fetchHabits()
    } catch (e) {
      console.error('打卡操作失敗:', e)
      setError(`打卡操作失敗：${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  const deleteHabit = async (habit) => {
    if (!confirm(`刪除「${habit.name}」？打卡紀錄也會一起消失。`)) return
    if (busy) return

    setBusy(true)

    try {
      const res = await fetch(`${API}/habits/${habit.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const message = await res.text()
        throw new Error(`HTTP ${res.status}: ${message}`)
      }

      setError(null)
      await fetchHabits()
    } catch (e) {
      console.error('刪除習慣失敗:', e)
      setError(`刪除習慣失敗：${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  const deleteComment = async (habit, comment) => {
    if (busy) return

    if (!confirm(`刪除「${habit.name}」的「${comment.text}」？`)) {
      return
    }

    setBusy(true)

    try {
      const res = await fetch(`${API}/comments/${comment.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const message = await res.text()
        throw new Error(`HTTP ${res.status}: ${message}`)
      }

      setError(null)
      await fetchHabits()
    } catch (e) {
      console.error('刪除留言失敗:', e)
      setError(`刪除留言失敗：${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  const postComment = async (habit, commentDate, comment) => {
    commentDate = isValidDateString(commentDate)
    if (!comment?.trim()) {
      await deleteComment(habit, habit.comments.find(findComment => findComment.date === commentDate) || comment)
      return
    }
    if (!commentDate || busy) return
    setBusy(true)

    try {
      const res = await fetch(`${API}/habits/${habit.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment: comment.trim(),
          date: commentDate
        }),
      })

      if (!res.ok) {
        const message = await res.text()
        throw new Error(`HTTP ${res.status}: ${message}`)
      }

      setInputComment(prev => {
        const next = new Map(prev)
        const habitMap = new Map(next.get(habit.id) || [])
        habitMap.delete(commentDate)
        next.set(habit.id, habitMap)
        return next
      })

      setError(null)

      await fetchHabits()
    } catch (e) {
      console.error('新增留言失敗:', e)
      setError(`新增留言失敗：${e.message}`)
      throw e
    } finally {
      setBusy(false)
    }
  }

  const changeName = async (habitId, newName) => {
    if (!newName || newName === habits.find(h => h.id === habitId)?.name) {
      return
    }

    if (busy) return

    setBusy(true)

    try {
      const res = await fetch(`${API}/habits/${habitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newName
        })
      })

      if (!res.ok) {
        const message = await res.text()
        throw new Error(`HTTP ${res.status}: ${message}`)
      }

      setError(null)

      await fetchHabits()
    } catch (e) {
      console.error('修改名稱失敗:', e)
      setError(`修改名稱失敗：${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  const calendarFirstRow = (habit, dateForYearMonth) =>(
    <div className = "calendar-first-row">
      <button className = "prev-month" 
      text = '<'
      onClick={e => {
        e.stopPropagation()
        setSelectedDate(prevDateMap => {
        const nextDateMap = new Map(prevDateMap);
        const prevDate = prevDateMap.get(habit.id) || now
        const newDate = new Date(prevDate.getFullYear(),prevDate.getMonth() - 1,1)
        nextDateMap.set(habit.id, newDate)
        return nextDateMap
      })}}
      > &lt;
      </button>
      <div className ="year-month">
      <input className = "input-year"
        value={inputYear.get(habit.id) ?? strDate(dateForYearMonth).year}
        onClick={e => e.stopPropagation()}
        onChange={e => setInputYear(prev => {
          const next = new Map(prev)
          next.set(habit.id, e.target.value)
          return next
        })}
        onBlur={e => {
          setSelectedDate(prevDateMap => {
            const value = inputYear.get(habit.id);

            // 輸入不是 4 位數 → 保持原本 state
            if (!/^\d{4}$/.test(value)) {
              setInputYear(prev => {
                const next = new Map(prev);
                next.delete(habit.id);
                return next;
            });
              return prevDateMap;
            }

            const year = Number(value);

            // 年份超出範圍 → 保持原本 state
            if (year < 1 || year > 9999) {
              setInputYear(prev => {
                const next = new Map(prev);
                next.delete(habit.id);
                return next;
            });
              return prevDateMap;
            }

            const nextDateMap = new Map(prevDateMap);

            const prevDate =
              prevDateMap.get(habit.id) || now;

            const newDate = new Date(
              year,
              prevDate.getMonth(),
              1
            );

            nextDateMap.set(habit.id, newDate);



            return nextDateMap;
          });
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
      /><span>年</span><input className = "input-month"
        value={inputMonth.get(habit.id) ?? strDate(dateForYearMonth).month}
        onClick={e => e.stopPropagation()}
        onChange={e => setInputMonth(prev => {
          const next = new Map(prev)
          next.set(habit.id, e.target.value)
          return next
        })}
        onBlur={e => {setSelectedDate(prevDateMap => {
          const inputMonthNum = Number(inputMonth.get(habit.id));
          if (
            !Number.isInteger(inputMonthNum) ||
            inputMonthNum < 1 ||
            inputMonthNum > 12
          ) {
            setInputMonth(prev => {
              const next = new Map(prev);
              next.delete(habit.id);
              return next;
            });
            return prevDateMap;
          }

          const nextDateMap = new Map(prevDateMap);
          const prevDate = prevDateMap.get(habit.id) || now;

          const newDate = new Date(
            prevDate.getFullYear(),
            inputMonthNum - 1,
            1
          );

          nextDateMap.set(habit.id, newDate);
          return nextDateMap
        })}}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
        /><span>月</span><button className = "next-month" 
          text = '>'
          onClick={e => {
            e.stopPropagation()
            setSelectedDate(prevDateMap => {
            const nextDateMap = new Map(prevDateMap);
            const prevDate = prevDateMap.get(habit.id) || now
            const newDate = new Date(prevDate.getFullYear(),prevDate.getMonth() + 1,1)
            nextDateMap.set(habit.id, newDate)
            return nextDateMap
          })}}
          > &gt;
          </button>
      </div>
    </div>
  )
  
  const weekdayNames = () => (
    <div className="weekdayNames">
      <div className='weekdayName'>日</div>
      <div className='weekdayName'>一</div>
      <div className='weekdayName'>二</div>
      <div className='weekdayName'>三</div>
      <div className='weekdayName'>四</div>
      <div className='weekdayName'>五</div>
      <div className='weekdayName'>六</div>
    </div>
  );

  const weekday = (habit,dateForWeek, columnid, compare_date, newCommentBool = false) => {
    dateForWeek = dateForWeek || now
    const sunday = new Date(dateForWeek);
    sunday.setDate(dateForWeek.getDate() - dateForWeek.getDay());
    const weeklist = []
    for (let i = 0; i < 7; i++) {
      const dateInWeek = new Date(sunday);
      dateInWeek.setDate(sunday.getDate() + i);
      weeklist.push(dateInWeek);
    }
    return (
      <div className="week" key={columnid}>
        {weeklist.map(dateInWeek => (
            <button
              className = {`weekday-btn${
                dateInWeek.getFullYear() != compare_date.getFullYear() ||
                (
                  dateInWeek.getFullYear() === compare_date.getFullYear() &&
                  dateInWeek.getMonth() != compare_date.getMonth()
                )
                  ? ' non-target-month'
                  : ''
              }${
                habit.checkins.some(e => e.date === strDate(dateInWeek).str)
                  ? ' checkin-day'
                  : ''
              }${
                habit.comments.some(e => e.date === strDate(dateInWeek).str)
                  ? ' has-comment'
                  : ''
              }`} key={strDate(dateInWeek).str}
              onClick={e => {
                e.stopPropagation();

                if(newCommentBool === true) {
                  const clickedDate = new Date(dateInWeek);
                  const clickedDateString = strDate(clickedDate).str;
                  
                  setSelectedDate(prev => {
                    const next = new Map(prev);
                    next.set(habit.id, clickedDate);
                    return next;
                  });
                  setNewCommentDate(prev => {
                    const next = new Map(prev);
                    next.set(habit.id, clickedDateString);
                    return next;
                  });
                } else {
                  const buttonComment = habit.comments.find(
                    comment => comment.date === strDate(dateInWeek).str
                  );

                  setModalInfo({
                    habit,
                    comment: buttonComment ?? {
                      id: null,
                      date: strDate(dateInWeek).str,
                      text: ''
                    }
                  });

                  setInputModal(buttonComment?.text ?? '');
                  setShowModal(true);
              }}}
            >
            {
              habit.checkins.some(e => e.date === strDate(dateInWeek).str)
                ? <span className="weekday-content"><><span className = 'checkinfire'>🔥</span><sup>{strDate(dateInWeek).day}</sup></></span>
                : <span className="weekday-content">{strDate(dateInWeek).day}</span>
            }
            {habit.comments.some(e => e.date === strDate(dateInWeek).str) && (
              <span className="comment-tooltip">
                {habit.comments.find(
                  e => e.date === strDate(dateInWeek).str
                )?.text}
              </span>)}
            
            </button>))}
      </div>
    )
  }

  const calendar = (habit, newCommentBool = false) => {
    const habitDate = selectedDate.get(habit.id) || now;
    const firstDay = new Date(
      habitDate.getFullYear(),
      habitDate.getMonth(),
      1
    );
    const weeks = [calendarFirstRow(habit,habitDate),weekdayNames()];
    let addWeekDate = new Date(firstDay);
    for (let i = 0; i < 6; i++) {
      weeks.push(weekday(habit,addWeekDate, i, firstDay, newCommentBool));
      addWeekDate.setDate(addWeekDate.getDate() + 7);
    }
    return weeks;
  }



  if (loading) return <div className="center">載入中…</div>
  // ↑ 尚未取得資料時顯示載入提示（JSX 的 className 等同 HTML 的 class）

  return (
  // ↑ return：回傳這個元件的 JSX（即畫面的 HTML 結構）

    <div className="app">

      <header>
        <h1>🗓️ HabitFlow</h1>
        <p>每天打卡，養成好習慣</p>
      </header>

      {error && <div className="error-box">{error}</div>}
      {/* ↑ 條件渲染：error 有值時才渲染 div
          && 短路求值：左邊 false 就不執行右邊
          {error}：JSX 的大括號插入 JavaScript 表達式 */}

      <div className="list">

        {habits.length === 0 && !showForm && !error && (
          <div className="empty">還沒有習慣，點下方按鈕新增一個！</div>
        )}
        {/* ↑ 三個條件都成立才顯示空狀態提示 */}

        {habits.slice().sort((a, b) => a.id - b.id).map(habit => (
        // ↑ Array.map()：把 habits 陣列每個元素轉成 JSX 元素（JavaScript 陣列內建方法）
        
        <div
            key={habit.id}
            className={`card ${habit.done_today ? 'done' : ''}`}
            onClick={() => {
              if (busy) return

              setShowCommentOrCalendar(prev => {
                const next = new Map(prev)

                if (next.has(habit.id)) {
                  next.delete(habit.id)
                } else {
                  next.set(habit.id, 'comment');
                }

                return next
              })
            }}
          >
          {/* ↑ key={habit.id}：React 需要列表元素有唯一 key，用於高效更新 DOM
              className 裡用模板字面值，done_today 為 true 時加上 done CSS class */}
            <div className="habit-card">
              <button
                className="checkin-btn"
                onClick={e => {
                  e.stopPropagation()
                  toggleCheckin(habit)
                }}
                // ↑ onClick：點擊事件；() => toggleCheckin(habit) 是箭頭函式（避免立即執行）
                disabled={busy}
                // ↑ disabled：布林值，busy 時禁用按鈕（JSX 的 {} 插入 JS 表達式）
              >
                {habit.done_today ? '✅' : '⬜'}
                {/* ↑ 三元運算子：已打卡顯示 ✅，未打卡顯示 ⬜ */}
              </button>

              <div className="habit-info">
                <span className="habit-icon">{habit.icon}</span>
                {/* ↑ {habit.icon}：把 habit.icon 的值插入 JSX（來自 API 回應的 JSON） */}
                <input
                  className="habit-name"
                  value={inputName.get(habit.id) ?? habit.name}
                  onClick={e => e.stopPropagation()}
                  onChange={e => setInputName(prev => {
                    const next = new Map(prev)
                    next.set(habit.id, e.target.value)
                    return next
                  })}
                  onBlur={e => {
                    changeName(habit.id, inputName.get(habit.id)?.trim())
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      e.currentTarget.blur()
                    }
                  }}
                />
              </div>

              <div className="habit-meta">
                {habit.streak > 0 && (
                  <span className="streak">🔥 {habit.streak} 天</span>
                )}
                {/* ↑ streak > 0 才顯示連續天數 */}

                <button className={`toggle-comment-btn${ showCommentOrCalendar.get(habit.id) === 'comment' ? ' open' : ' close'}`}
                  onClick={e =>{
                    e.stopPropagation()
                    setShowCommentOrCalendar(prev =>{
                      const next = new Map(prev)
                      if (next.get(habit.id) === 'comment') {
                        next.delete(habit.id);
                      } else {
                        next.set(habit.id, 'comment');
                      }
                      return next
                    })}}
                > 📝</button>

                <button className="toggle-calender-btn" onClick={e =>{
                  e.stopPropagation()
                  setShowCommentOrCalendar(prev =>{
                    const next = new Map(prev)
                    if (next.get(habit.id) === 'calendar') {
                      next.delete(habit.id);
                    } else {
                      next.set(habit.id, 'calendar');
                    }
                    return next
                  })}}
                > 🗓️</button>

                <button className="del-btn" onClick={e => {
                  e.stopPropagation()
                  deleteHabit(habit)}}
                  >🗑️</button>
              </div>
            </div>

            {showCommentOrCalendar.get(habit.id) === 'comment' ? (

            <div className="comments-info">
              {(() => {const inputValue =inputComment.get(habit.id)?.get(today) ??habit.comments.find(comment => comment.date === today)?.text ?? ''
              return (
                <div className="comment-info">
                  <textarea
                    value={inputValue}
                    // ↑ 受控元件，input 的值由 React state 控制
                    onClick={e => e.stopPropagation()}

                    onChange={e => setInputComment(prev => {
                      const next = new Map(prev)
                      const part = new Map(next.get(habit.id) || [])

                      part.set(today, e.target.value)
                      next.set(habit.id, part)

                      return next
                    })}
                    // ↑ onChange：每次輸入時更新 comment state
                    // e.target.value：輸入框當前的值（原生 DOM 事件物件）
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        postComment(habit,today, e.target.value)}}}
                    // ↑ 按 Enter 鍵時觸發新增（e.key 是鍵盤按鍵名稱）
                    onFocus={() => setFocus(prev => {
                      const next = new Map(prev)
                      next.set(`${habit.id}-${today}`, true)
                      return next
                    })}
                    onBlur={() => setFocus(prev => {
                      const next = new Map(prev)
                      next.delete(`${habit.id}-${today}`)
                      return next
                    })}

                    placeholder="記錄點東西嗎？"

                    ref={el => {
                      if (el) {
                        textareaRefs.current.set(`${habit.id}-${today}`, el)
                      }
                    }}
                  />
                  <span className={`comment-date${habit.done_today ? '-done' : ''}`}>
                    {habit.done_today ? '今日已簽到！' : '今日未簽到'}
                  </span>
                  
                  <button className={`comment-check-btn${inputValue === (habit.comments.find(comment => comment.date === today)?.text ?? "") ? " edit" : ""}${focus.get(`${habit.id}-${today}`) ? " typing" : ""}`} 
                    disabled={busy}
                    onClick={e => {
                      e.stopPropagation()
                      if (inputValue === (habit.comments.find(comment => comment.date === today)?.text ?? "")) {
                        const textarea = textareaRefs.current.get(`${habit.id}-${today}`)
                        if (textarea) {
                          textarea.focus()
                          textarea.setSelectionRange(
                            textarea.value.length,
                            textarea.value.length
                          )
                        }
                      } else {
                        postComment(habit, today, inputValue)
                      }}}
                    // ↑ 點擊按鈕時，如果輸入框的值和原本的值一樣就送出，否則 focus 到輸入框
                    // textareaRefs.current.get(...)：取得對應的 textarea DOM 元素
                    >{inputValue === (habit.comments.find(comment => comment.date === today)?.text ?? "") ? "✎" : "✓"}</button> 

                  <button className={`comment-${inputValue === (habit.comments.find(comment => comment.date === today)?.text ?? "") ? "del" : "undo"}-btn`}
                    disabled={busy}
                    onClick={e => {
                      e.stopPropagation()
                      const comment = habit.comments.find(comment => comment.date === today) || ''
                      if (comment) {
                        if (inputValue === (habit.comments.find(comment => comment.date === today)?.text ?? "")) {
                          deleteComment(habit, comment)
                        } else {
                          setInputComment(prev =>{
                          const next = new Map(prev)
                          const part = new Map(next.get(habit.id) || [])

                          part.set(today, comment.text)
                          next.set(habit.id, part)

                          return next})}
                    }}}
                    >{(inputValue === (habit.comments.find(comment => comment.date === today)?.text ?? "")) ? '🗑️' : '↩️'}</button>
                </div>)
              })()}

                {habit.comments.slice().sort((a, b) => b.date.localeCompare(a.date)).map(comment => {
                  const inputValue = inputComment.get(habit.id)?.get(comment.date) ?? comment.text

                  return(
                  comment.date !== today && (
                  <div className="comment-info">
                    <textarea
                      value={inputValue}
                      // ↑ 受控元件，input 的值由 React state 控制
                      onClick={e => e.stopPropagation()}
                      onChange={e => setInputComment(prev => {
                        const next = new Map(prev)
                        const part = new Map(next.get(habit.id) || [])

                        part.set(comment.date, e.target.value)
                        next.set(habit.id, part)

                        return next
                      })}
                      // ↑ onChange：每次輸入時更新 comment state
                      // e.target.value：輸入框當前的值（原生 DOM 事件物件）
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          postComment(habit, comment.date, e.target.value)
                        }
                      }}

                      onFocus={() => setFocus(prev => {
                        const next = new Map(prev)
                        next.set(`${habit.id}-${comment.date}`, true)
                        return next
                      })}
                      onBlur={() => setFocus(prev => {
                        const next = new Map(prev)
                        next.delete(`${habit.id}-${comment.date}`)
                        return next
                      })}

                      ref={el => {
                        if (el) {
                          textareaRefs.current.set(`${habit.id}-${comment.date}`, el)
                        }
                      }}
                      // ↑ 按 Enter 鍵時觸發新增（e.key 是鍵盤按鍵名稱）
                      placeholder="記錄點東西嗎？"
                    />
                    <span className={`comment-date${habit.checkins.some(c => c.date === comment.date) ? '-done' : ''}`}>
                      {comment.date}
                    </span>
                    <button className={`comment-check-btn${inputValue === (comment.text ?? "") ? ' edit' : ''}${focus.get(`${habit.id}-${comment.date}`) ? ' typing' : ''}`} 
                      disabled={busy}
                      onClick={e => {
                        e.stopPropagation()
                        if (inputValue === (comment.text ?? "")) {
                          const textarea = textareaRefs.current.get(`${habit.id}-${comment.date}`)
                          if (textarea) {
                            textarea.focus()
                            textarea.setSelectionRange(
                              textarea.value.length,
                              textarea.value.length
                            )
                          }
                        } else {
                          postComment(habit, comment.date, inputValue)
                        }}}
                      >{inputValue === (comment.text ?? "") ? "✎" : "✓"}</button>
                    <button className={`comment-${inputValue === (comment.text ?? "") ? 'del' : 'undo' }-btn`}
                    disabled={busy}
                    onClick={e => {
                      e.stopPropagation();

                      if (inputValue === (comment.text ?? "")) {
                        deleteComment(habit, comment);
                      } else {
                        setInputComment(prev => {
                          const next = new Map(prev);
                          const part = new Map(next.get(habit.id) || []);

                          part.set(comment.date, comment.text);
                          next.set(habit.id, part);

                          return next;
                        });
                      }
                    }}
                    >{inputValue === (comment.text ?? "") ? '🗑️' : '↩️' }</button>
                  </div>
                ))})}
              

            
            {!showNewComment.has(habit.id) ? (
              <div className="action-new-comment">
                <button className="new-comment-btn" 
                        disabled={busy}
                        onClick={e => {
                          e.stopPropagation()
                          setShowNewComment(prev => {
                            const next = new Set(prev)
                            if (next.has(habit.id)) {
                              next.delete(habit.id)
                            } else {
                              next.add(habit.id)
                            }
                            return next
                          })}}
                        >新增筆記</button>
                </div>
            ) : (
              <div className="new-comments-info">
                {(() => {const inputValue = inputNewComment.get(habit.id) ?? ""
                return (
                  <div className="comment-info">
                    <textarea
                      value={inputValue}
                      // ↑ 受控元件，input 的值由 React state 控制
                      onClick={e => e.stopPropagation()}

                      onChange={e => setInputNewComment(prev => {
                        const next = new Map(prev)
                        next.set(habit.id, e.target.value)
                        return next
                      })}
                      // ↑ onChange：每次輸入時更新 comment state
                      // e.target.value：輸入框當前的值（原生 DOM 事件物件）
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          if(isValidDateString(newCommentDate)) {
                            postComment(habit, newCommentDate.get(habit.id), inputValue)
                          } else {
                          const textarea = newtextareaRefs.current.get(`${habit.id}-date`)
                          if (textarea) {
                            textarea.focus()
                            textarea.setSelectionRange(
                              textarea.value.length,
                              textarea.value.length
                            )
                          }
                        }}}}
                      // ↑ 按 Enter 鍵時觸發新增（e.key 是鍵盤按鍵名稱）
                      onFocus={() => setFocus(prev => {
                        const next = new Map(prev)
                        next.set(`${habit.id}-newComment`, true)
                        return next
                      })}
                      onBlur={() => setFocus(prev => {
                        const next = new Map(prev)
                        next.delete(`${habit.id}-newComment`)
                        return next
                      })}

                      placeholder="記錄點東西嗎？"

                      ref={el => {
                        if (el) {
                          newtextareaRefs.current.set(`${habit.id}-textarea`, el)
                        }
                      }}
                    />
                    <div
                      className="date-picker"
                      tabIndex={-1}
                      onBlur={e => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          setShowCalendar(null)
                        }
                      }}
                    >
                    <input
                      className="comment-date-input"
                      data-date-input={habit.id}
                      value={newCommentDate.get(habit.id) ?? ''}
                      onClick={e => {
                        e.stopPropagation()
                      }}
                      onChange={e => setNewCommentDate(prev => {
                        const next = new Map(prev)
                        next.set(habit.id, e.target.value)
                        return next
                      })}
                      onFocus={() => {setFocus(prev => {
                        const next = new Map(prev)
                        next.set(`${habit.id}-newDate`, true)
                        return next
                        })
                        openCalendar(habit)
                        setShowCalendar(habit.id)
                      }}
                      onBlur={() => {setFocus(prev => {
                        const next = new Map(prev)
                        next.delete(`${habit.id}-newDate`)
                        return next
                        })
                      }}

                      ref={el => {
                        if (el) {
                          newtextareaRefs.current.set(`${habit.id}-date`, el)
                        }
                      }}
                    />
                    {showCalendar === habit.id && (
                      <div className={`calendar-popup ${calendarPosition}`}
                        onMouseDown={e => e.preventDefault()}
                      >
                        <div className = "calendar">
                          {calendar(habit,true)}
                        </div>
                      </div>
                    )}
                    </div>
                    <button className={`comment-check-btn${!inputNewComment.get(habit.id) || !isValidDateString(newCommentDate.get(habit.id)) ? " edit" : ""}${focus.get(`${habit.id}-newComment`) || focus.get(`${habit.id}-newDate`) ? " typing" : ""}`}
                      disabled={( habit.comments.some(comment => comment.date === isValidDateString(newCommentDate.get(habit.id))) &&!!inputNewComment.get(habit.id) &&!!isValidDateString(newCommentDate.get(habit.id))) ||busy}
                      onClick={async e => {
                        e.stopPropagation()

                        if (!inputNewComment.get(habit.id)) {
                          const textarea = newtextareaRefs.current.get(`${habit.id}-textarea`)
                          if (textarea) {
                            textarea.focus()
                            textarea.setSelectionRange(
                              textarea.value.length,
                              textarea.value.length
                            )
                          }
                        } else if (!isValidDateString(newCommentDate.get(habit.id))) {
                          const textarea = newtextareaRefs.current.get(`${habit.id}-date`)
                          if (textarea) {
                            textarea.focus()
                            textarea.setSelectionRange(
                              textarea.value.length,
                              textarea.value.length
                            )
                          }
                        } else {
                          try {
                            await postComment(
                              habit,
                              newCommentDate.get(habit.id),
                              inputValue
                            )

                            setShowNewComment(prev => {
                              const next = new Set(prev)
                              next.delete(habit.id)
                              return next
                            })

                            setInputNewComment(prev => {
                              const next = new Map(prev)
                              next.delete(habit.id)
                              return next
                            })

                            setNewCommentDate(prev => {
                              const next = new Map(prev)
                              next.delete(habit.id)
                              return next
                            })
                          } catch (e) {
                            // postComment() 已經顯示錯誤
                            // API 失敗時保留目前輸入
                          }
                        }
                      }}
                    >{!inputNewComment.get(habit.id) || !isValidDateString(newCommentDate.get(habit.id)) ? "✎" : "✓"}</button> 
                    <button className={`comment-del-btn`}
                      disabled={busy}
                      onClick={e => {
                        e.stopPropagation()

                        setShowNewComment(prev => {
                          const next = new Set(prev)
                          next.delete(habit.id)
                          return next
                        })

                        setInputNewComment(prev => {
                          const next = new Map(prev)
                          next.delete(habit.id)
                          return next
                        })

                        setNewCommentDate(prev => {
                          const next = new Map(prev)
                          next.delete(habit.id)
                          return next
                        })
                      }}
                    >🗑️</button>
                  </div>)
              })()}</div>)}
            </div>
        ) : null}
        {showCommentOrCalendar.get(habit.id) === 'calendar' ? (
          <div className="calendar">
            {calendar(habit)}
          </div>
        ) : null}
      </div>
    ))}

        {showForm ? (
        // ↑ 三元運算子條件渲染：showForm 為 true 顯示表單，否則顯示「+新增」按鈕
          <div className="form-card">
            <div className="emoji-grid">
              {EMOJIS.map(e => (
              // ↑ 渲染 emoji 選擇器，把 EMOJIS 陣列每個元素渲染成按鈕
                <button
                  key={e}
                  className={`emoji-btn ${icon === e ? 'selected' : ''}`}
                  // ↑ 選取的 emoji 加上 selected class
                  onClick={() => setIcon(e)}
                  // ↑ 點擊時更新 icon state
                >{e}</button>
              ))}
            </div>

            <div className="form-row">
              <span className="form-icon">{icon}</span>
              <input
                value={name}
                // ↑ value={name}：受控元件，input 的值由 React state 控制
                onChange={e => setName(e.target.value)}
                // ↑ onChange：每次輸入時更新 name state
                // e.target.value：輸入框當前的值（原生 DOM 事件物件）
                onKeyDown={e => e.key === 'Enter' && addHabit()}
                // ↑ 按 Enter 鍵時觸發新增（e.key 是鍵盤按鍵名稱）
                placeholder="習慣名稱，例如「讀英文 30 分鐘」"
                autoFocus
                // ↑ autoFocus：表單出現時自動 focus 到這個輸入框
              />
            </div>

            <div className="form-actions">
              <button
                className="btn-cancel"
                onClick={() => { setShowForm(false); setName('') }}
                // ↑ 取消：隱藏表單並清空輸入
              >取消</button>
              <button
                className="btn-save"
                onClick={addHabit}
                disabled={!name.trim() || busy}
                // ↑ 名稱空白或忙碌時禁用按鈕
              >新增</button>
            </div>
          </div>
        ) : (
          // ↑ 點擊後 setShowForm(true) 顯示表單
          <button className="add-btn" onClick={() => setShowForm(true)}
          >
            + 新增習慣
          </button>
        )}
      </div>
      {showModal && modalInfo && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
          >
            <h2>
              編輯 {modalInfo.habit.name} {modalInfo.comment.date} 的筆記
            </h2>

            <textarea
              value={inputModal}
              onChange={e => setInputModal(e.target.value)}
            />

            <div className="modal-actions">
            <button
              className="modal-btn modal-confirm-btn"
              disabled={busy}
              onClick={async e => {
                e.stopPropagation();

                const commentId = modalInfo.comment.id;

                if (!inputModal.trim()) {
                  if (commentId) {
                    await deleteComment(modalInfo.habit, modalInfo.comment);
                  }

                  setShowModal(false);
                  setInputModal('');
                  setModalInfo(null);
                  return;
                }

                await postComment(
                  modalInfo.habit,
                  modalInfo.comment.date,
                  inputModal
                );

                setShowModal(false);
                setInputModal('');
                setModalInfo(null);
              }}
            >
              確定
            </button>

            <button
              className="modal-btn modal-close-btn"
              onClick={() => {
                setShowModal(false)
                setInputModal('')
                setModalInfo(null)
              }}
            >
              關閉
            </button>
          </div>
        </div></div>
      )}
    </div>
  )
}
