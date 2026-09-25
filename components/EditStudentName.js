'use client';

import { useState } from 'react';

// Имя ученика в шапке страницы + кнопка ✎, по которой имя можно исправить.
export function EditStudentName({ name, action }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="student-name-view">
        <h1>{name}</h1>
        <button
          type="button"
          className="btn-secondary edit-btn"
          title="Изменить имя ученика"
          onClick={() => setEditing(true)}
        >
          ✎
        </button>
      </div>
    );
  }

  return (
    <form
      className="student-name-form"
      action={async (formData) => {
        await action(formData);
        setEditing(false);
      }}
    >
      <input
        name="full_name"
        type="text"
        defaultValue={name}
        required
        autoFocus
        aria-label="Имя ученика"
      />
      <button className="btn" type="submit">
        Сохранить
      </button>
      <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
        Отмена
      </button>
    </form>
  );
}
