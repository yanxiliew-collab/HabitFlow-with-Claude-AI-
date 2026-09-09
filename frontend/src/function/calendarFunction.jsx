import * as dateFunction from './dateFunction.jsx'

const now = new Date();

export const openCalendar = (habit,context) => {
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
      context.setCalendarPosition('right');
    } else if (spaceLeft >= calendarWidth + margin) {
      context.setCalendarPosition('left');
    } else {
      context.setCalendarPosition('right');
    }

    context.setShowCalendar(habit.id);
  };



  const calendarFirstRow = (habit, dateForYearMonth, context) =>(
    <div className = "calendar-first-row">
      <button className = "prev-month" 
      text = '<'
      onClick={e => {
        e.stopPropagation()
        context.setSelectedDate(prevDateMap => {
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
        value={context.inputYear.get(habit.id) ?? dateFunction.strDate(dateForYearMonth).year}
        onClick={e => e.stopPropagation()}
        onChange={e => context.setInputYear(prev => {
          const next = new Map(prev)
          next.set(habit.id, e.target.value)
          return next
        })}
        onBlur={e => {
          context.setSelectedDate(prevDateMap => {
            const value = context.inputYear.get(habit.id);

            // 輸入不是 4 位數 → 保持原本 state
            if (!/^\d{4}$/.test(value)) {
              context.setInputYear(prev => {
                const next = new Map(prev);
                next.delete(habit.id);
                return next;
            });
              return prevDateMap;
            }

            const year = Number(value);

            // 年份超出範圍 → 保持原本 state
            if (year < 1 || year > 9999) {
              context.setInputYear(prev => {
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
        value={context.inputMonth.get(habit.id) ?? dateFunction.strDate(dateForYearMonth).month}
        onClick={e => e.stopPropagation()}
        onChange={e => context.setInputMonth(prev => {
          const next = new Map(prev)
          next.set(habit.id, e.target.value)
          return next
        })}
        onBlur={e => {context.setSelectedDate(prevDateMap => {
          const inputMonthNum = Number(context.inputMonth.get(habit.id));
          if (
            !Number.isInteger(inputMonthNum) ||
            inputMonthNum < 1 ||
            inputMonthNum > 12
          ) {
            context.setInputMonth(prev => {
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
            context.setSelectedDate(prevDateMap => {
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

  const weekday = (habit,dateForWeek, columnid, compare_date, newCommentBool = false, context) => {
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
                habit.checkins.some(e => e.date === dateFunction.strDate(dateInWeek).str)
                  ? ' checkin-day'
                  : ''
              }${
                habit.comments.some(e => e.date === dateFunction.strDate(dateInWeek).str)
                  ? ' has-comment'
                  : ''
              }`} key={dateFunction.strDate(dateInWeek).str}
              onClick={e => {
                e.stopPropagation();

                if(newCommentBool === true) {
                  const clickedDate = new Date(dateInWeek);
                  const clickedDateString = dateFunction.strDate(clickedDate).str;
                  
                  context.setSelectedDate(prev => {
                    const next = new Map(prev);
                    next.set(habit.id, clickedDate);
                    return next;
                  });
                  context.setNewCommentDate(prev => {
                    const next = new Map(prev);
                    next.set(habit.id, clickedDateString);
                    return next;
                  });
                } else {
                  const buttonComment = habit.comments.find(
                    comment => comment.date === dateFunction.strDate(dateInWeek).str
                  );

                  context.setModalInfo({
                    habit,
                    comment: buttonComment ?? {
                      id: null,
                      date: dateFunction.strDate(dateInWeek).str,
                      text: ''
                    }
                  });

                  context.setInputModal(buttonComment?.text ?? '');
                  context.setShowModal(true);
              }}}
            >
            {
              habit.checkins.some(e => e.date === dateFunction.strDate(dateInWeek).str)
                ? <span className="weekday-content"><><span className = 'checkinfire'>🔥</span><sup>{dateFunction.strDate(dateInWeek).day}</sup></></span>
                : <span className="weekday-content">{dateFunction.strDate(dateInWeek).day}</span>
            }
            {habit.comments.some(e => e.date === dateFunction.strDate(dateInWeek).str) && (
              <span className="comment-tooltip">
                {habit.comments.find(
                  e => e.date === dateFunction.strDate(dateInWeek).str
                )?.text}
              </span>)}
            
            </button>))}
      </div>
    )
  }

  export const calendar = (habit, newCommentBool = false, context) => {
    const habitDate = context.selectedDate.get(habit.id) || now;
    const firstDay = new Date(
      habitDate.getFullYear(),
      habitDate.getMonth(),
      1
    );
    const weeks = [calendarFirstRow(habit,habitDate, context),weekdayNames()];
    let addWeekDate = new Date(firstDay);
    for (let i = 0; i < 6; i++) {
      weeks.push(weekday(habit,addWeekDate, i, firstDay, newCommentBool, context));
      addWeekDate.setDate(addWeekDate.getDate() + 7);
    }
    return weeks;
  }

