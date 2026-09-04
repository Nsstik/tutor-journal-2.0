      <div className="card">
        <div className="card-title">Уроки</div>
        {lessons && lessons.length > 0 ? (
          <>
            <div className="lessons-table-wrap">
              <table className="ledger">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Тема</th>
                    <th>Поведение</th>
                    <th>Работа на уроке</th>
                    <th>ДЗ</th>
                    {profile.show_payment && <th>Оплата</th>}
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((l) => {
                    const payment = l.payments;
                    return (
                      <tr key={l.id}>
                        <td>{l.lesson_date}</td>
                        <td>
                          {l.topic}
                          {l.behavior_comment && <div className="muted">{l.behavior_comment}</div>}
                        </td>
                        <td>
                          {l.behavior_rating ? (
                            <StarsDisplay value={l.behavior_rating} />
                          ) : l.behavior ? (
                            <span className="tag tag-neutral">{l.behavior}</span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>
                          <StarsDisplay value={l.work_rating} />
                        </td>
                        <td>
                          {l.homework_done ? (
                            <span className="check">✓ выполнено</span>
                          ) : (
                            <span className="cross">не выполнено</span>
                          )}
                          {l.homework_comment && <div className="muted">{l.homework_comment}</div>}
                        </td>
                        {profile.show_payment && (
                          <td>
                            {payment ? (
                              payment.paid ? (
                                <span className="check">✓ Оплачено</span>
                              ) : (
                                <span className="cross">Не оплачено</span>
                              )
                            ) : (
                              '—'
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="lesson-feed">
              {lessons.map((l) => {
                const payment = l.payments;
                const d = new Date(l.lesson_date);
                const day = d.getDate();
                const month = d.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '');
                return (
                  <div key={l.id} className="lesson-card">
                    <div className="lesson-card-date">
                      <div className="lesson-card-day">{day}</div>
                      <div className="lesson-card-sub">{month}</div>
                    </div>
                    <div className="lesson-card-body">
                      <div className="lesson-card-topic">{l.topic}</div>
                      {l.behavior_comment && <div className="muted">{l.behavior_comment}</div>}

                      <div className="lesson-card-meta">
                        <span className="lesson-card-meta-item">
                          {l.behavior_rating ? (
                            <StarsDisplay value={l.behavior_rating} />
                          ) : l.behavior ? (
                            <span className="tag tag-neutral">{l.behavior}</span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </span>
                        <span className="lesson-card-meta-item">
                          <StarsDisplay value={l.work_rating} />
                        </span>
                      </div>

                      <div className="lesson-card-badges">
                        <span className={`badge ${l.homework_done ? 'badge-done' : 'badge-pending'}`}>
                          {l.homework_done ? '✓ ДЗ выполнено' : 'ДЗ не выполнено'}
                        </span>
                        {profile.show_payment && (
                          <span className={`badge ${payment?.paid ? 'badge-done' : 'badge-pending'}`}>
                            {payment?.paid ? '✓ Оплачено' : 'Не оплачено'}
                          </span>
                        )}
                      </div>

                      {l.homework_comment && (
                        <div className="muted" style={{ marginTop: 6 }}>{l.homework_comment}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="muted">Уроков пока нет.</p>
        )}
      </div>
