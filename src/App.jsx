import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Users,
  Plus,
  Archive,
  CheckCircle2,
} from "lucide-react";

const demoEvents = [];

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
  const [name, setName] = useState("");
  const [archive, setArchive] = useState(false);

  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    maxParticipants: "",
    flyerUrl: "",
  });

  const filteredEvents = useMemo(() => {
    return events.filter((event) =>
      archive ? isPast(event) : !isPast(event)
    );
  }, [events, archive]);

  function toggleParticipation(eventId) {
    const cleanName = name.trim();

    if (!cleanName) {
      alert("Bitte zuerst deinen Namen eintragen.");
      return;
    }

    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;

        const alreadyJoined = event.participants.includes(cleanName);

        return {
          ...event,
          participants: alreadyJoined
            ? event.participants.filter((p) => p !== cleanName)
            : [...event.participants, cleanName],
        };
      })
    );
  }

  function createEvent(e) {
    e.preventDefault();

    if (!form.title || !form.date || !form.time) {
      alert("Bitte mindestens Titel, Datum und Uhrzeit ausfüllen.");
      return;
    }

    const newEvent = {
      id: Date.now(),
      title: form.title,
      date: form.date,
      time: form.time,
      location: form.location || "Noch offen",
      description: form.description || "Keine Beschreibung hinterlegt.",
      maxParticipants: form.maxParticipants
        ? Number(form.maxParticipants)
        : null,
      participants: [],
      flyerUrl: form.flyerUrl,
    };

    setEvents([...events, newEvent]);

    setForm({
      title: "",
      date: "",
      time: "",
      location: "",
      description: "",
      maxParticipants: "",
      flyerUrl: "",
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <p style={styles.badge}>Interner Event-Kalender</p>
          <h1 style={styles.title}>Mitarbeiter-Events</h1>
          <p style={styles.subtitle}>
            Events planen, Zusagen sammeln und vergangene Events automatisch
            ausblenden.
          </p>
        </header>

        <section style={styles.card}>
          <h2>Dein Name</h2>
          <input
            style={styles.input}
            type="text"
            placeholder="Bitte deinen Namen eintragen"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </section>

        <section style={styles.card}>
          <h2>
            <Plus size={18} /> Neues Event anlegen
          </h2>

          <form onSubmit={createEvent} style={styles.form}>
            <input
              style={styles.input}
              placeholder="Titel"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <input
              style={styles.input}
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
            />

            <input
              style={styles.input}
              type="time"
              value={form.time}
              onChange={(e) =>
                setForm({ ...form, time: e.target.value })
              }
            />

            <input
              style={styles.input}
              placeholder="Ort"
              value={form.location}
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
            />

            <input
              style={styles.input}
              type="number"
              placeholder="Max. Teilnehmer"
              value={form.maxParticipants}
              onChange={(e) =>
                setForm({ ...form, maxParticipants: e.target.value })
              }
            />

            <input
              style={styles.input}
              placeholder="Flyer-Link z. B. /flyer.pdf"
              value={form.flyerUrl}
              onChange={(e) =>
                setForm({ ...form, flyerUrl: e.target.value })
              }
            />

            <textarea
              style={styles.textarea}
              placeholder="Beschreibung"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <button style={styles.primaryButton} type="submit">
              Event erstellen
            </button>
          </form>
        </section>

        <div style={styles.toolbar}>
          <button
            style={styles.secondaryButton}
            onClick={() => setArchive(!archive)}
          >
            <Archive size={16} />
            {archive ? " Archiv anzeigen" : " Kommende Events anzeigen"}
          </button>
        </div>

        {filteredEvents.length === 0 && (
          <div style={styles.card}>Keine Events vorhanden.</div>
        )}

        {filteredEvents.map((event) => {
          const cleanName = name.trim();
          const joined = event.participants.includes(cleanName);
          const freePlaces =
            event.maxParticipants !== null
              ? Math.max(event.maxParticipants - event.participants.length, 0)
              : null;

          return (
            <section key={event.id} style={styles.eventCard}>
              <div>
                <h2>{event.title}</h2>

                <p style={styles.infoLine}>
                  <CalendarDays size={16} />
                  {formatDate(event.date)} · {event.time} Uhr
                </p>

                <p style={styles.infoLine}>
                  <MapPin size={16} />
                  {event.location}
                </p>

                <p>{event.description}</p>

                {event.flyerUrl && (
                  <p>
                    <a href={event.flyerUrl} target="_blank" rel="noreferrer">
                      Flyer öffnen
                    </a>
                  </p>
                )}

                <p style={styles.infoLine}>
                  <Users size={16} />
                  {event.participants.length} Zusagen
                  {event.maxParticipants
                    ? ` / ${event.maxParticipants} Plätze`
                    : ""}
                </p>

                {freePlaces !== null && (
                  <p>Noch freie Plätze: {freePlaces}</p>
                )}

                <button
                  style={joined ? styles.secondaryButton : styles.primaryButton}
                  onClick={() => toggleParticipation(event.id)}
                >
                  <CheckCircle2 size={16} />
                  {joined ? " Zusage zurücknehmen" : " Zusagen"}
                </button>
              </div>

              <div style={styles.participantBox}>
                <h3>Teilnehmer</h3>

                {event.participants.length === 0 ? (
                  <p>Noch keine Zusagen.</p>
                ) : (
                  <ul>
                    {event.participants.map((participant) => (
                      <li key={participant}>{participant}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f6f8",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    color: "#1f2937",
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  header: {
    background: "white",
    padding: "28px",
    borderRadius: "18px",
    marginBottom: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
  },
  badge: {
    display: "inline-block",
    background: "#eef2ff",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "14px",
    marginBottom: "10px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
  },
  subtitle: {
    color: "#6b7280",
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "16px",
    marginBottom: "20px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
  },
  form: {
    display: "grid",
    gap: "10px",
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
  },
  textarea: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    minHeight: "90px",
    fontSize: "15px",
  },
  toolbar: {
    marginBottom: "20px",
  },
  eventCard: {
    background: "white",
    padding: "22px",
    borderRadius: "18px",
    marginBottom: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
    display: "grid",
    gridTemplateColumns: "1fr 260px",
    gap: "20px",
  },
  participantBox: {
    background: "#f9fafb",
    padding: "16px",
    borderRadius: "14px",
  },
  infoLine: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  primaryButton: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "11px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  secondaryButton: {
    background: "white",
    color: "#1f2937",
    border: "1px solid #d1d5db",
    padding: "11px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
};
