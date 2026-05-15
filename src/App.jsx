import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Users,
  Plus,
  Archive,
  CheckCircle2,
  Search,
} from "lucide-react";

const employees = [
  "Kevin",
  "Jens",
  "Fabian",
  "Julia",
  "Ole",
  "Maxi",
];

const demoEvents = [
  {
    id: 1,
    title: "Coffee & Cake Afternoon",
    date: "2026-06-05",
    time: "15:00",
    location: "Aufenthaltsbereich",
    description: "Gemütlicher Nachmittag mit Kaffee und Kuchen.",
    maxParticipants: 40,
    participants: ["Kevin", "Fabian"],
  },
];

function isPast(event) {
  return new Date(`${event.date}T23:59:59`) < new Date();
}

function formatDate(date) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export default function App() {
  const [events, setEvents] = useState(demoEvents);
  const [employee, setEmployee] = useState(employees[0]);
  const [archive, setArchive] = useState(false);

  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    maxParticipants: "",
  });

  const filteredEvents = useMemo(() => {
    return events.filter((event) =>
      archive ? isPast(event) : !isPast(event)
    );
  }, [events, archive]);

  function toggleParticipation(eventId) {
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;

        const joined = event.participants.includes(employee);

        return {
          ...event,
          participants: joined
            ? event.participants.filter((p) => p !== employee)
            : [...event.participants, employee],
        };
      })
    );
  }

  function createEvent(e) {
    e.preventDefault();

    if (!form.title || !form.date || !form.time) return;

    const newEvent = {
      id: Date.now(),
      title: form.title,
      date: form.date,
      time: form.time,
      location: form.location,
      description: form.description,
      maxParticipants: Number(form.maxParticipants),
      participants: [],
    };

    setEvents([...events, newEvent]);

    setForm({
      title: "",
      date: "",
      time: "",
      location: "",
      description: "",
      maxParticipants: "",
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f4f4",
        padding: "30px",
        fontFamily: "Arial",
      }}
    >
      <h1>Mitarbeiter Event-Kalender</h1>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "30px",
        }}
      >
        <h2>Neues Event</h2>

        <form onSubmit={createEvent}>
          <div style={{ display: "grid", gap: "10px" }}>
            <input
              placeholder="Titel"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
            />

            <input
              type="time"
              value={form.time}
              onChange={(e) =>
                setForm({ ...form, time: e.target.value })
              }
            />

            <input
              placeholder="Ort"
              value={form.location}
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
            />

            <textarea
              placeholder="Beschreibung"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Max Teilnehmer"
              value={form.maxParticipants}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxParticipants: e.target.value,
                })
              }
            />

            <button type="submit">
              <Plus size={16} /> Event erstellen
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <select
          value={employee}
          onChange={(e) => setEmployee(e.target.value)}
        >
          {employees.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>

        <button
          style={{ marginLeft: "10px" }}
          onClick={() => setArchive(!archive)}
        >
          <Archive size={16} />{" "}
          {archive ? "Archiv" : "Kommende Events"}
        </button>
      </div>

      {filteredEvents.map((event) => {
        const joined = event.participants.includes(employee);

        return (
          <div
            key={event.id}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <h2>{event.title}</h2>

            <p>
              <CalendarDays size={16} />{" "}
              {formatDate(event.date)} - {event.time}
            </p>

            <p>
              <MapPin size={16} /> {event.location}
            </p>

            <p>{event.description}</p>

            <p>
              <Users size={16} /> Teilnehmer:{" "}
              {event.participants.length}
            </p>

            <button onClick={() => toggleParticipation(event.id)}>
              <CheckCircle2 size={16} />{" "}
              {joined
                ? "Zusage zurücknehmen"
                : "Zusagen"}
            </button>

            <h3>Teilnehmer:</h3>

            <ul>
              {event.participants.map((participant) => (
                <li key={participant}>{participant}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
