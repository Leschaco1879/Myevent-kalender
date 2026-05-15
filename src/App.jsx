import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, Users, Plus, Archive, CheckCircle2 } from "lucide-react";
import { supabase } from "./supabase";

export default function App() {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [name, setName] = useState("");
  const [archive, setArchive] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    maxParticipants: "",
    flyer: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    const { data: participantsData, error: participantsError } = await supabase
      .from("participants")
      .select("*");

if (eventsError || participantsError) {
  const error = eventsError || participantsError;
  alert("Fehler beim Laden der Daten: " + error.message);
  console.error(error);
} else {
      setEvents(eventsData || []);
      setParticipants(participantsData || []);
    }

    setLoading(false);
  }

  function isPast(event) {
    return new Date(`${event.event_date}T23:59:59`) < new Date();
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(`${date}T12:00:00`));
  }

  const filteredEvents = useMemo(() => {
    return events.filter((event) => (archive ? isPast(event) : !isPast(event)));
  }, [events, archive]);

  function getParticipants(eventId) {
    return participants.filter((p) => p.event_id === eventId);
  }

  async function uploadFlyer(file) {
    if (!file) return "";

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `event-flyer/${fileName}`;

    const { error } = await supabase.storage
      .from("flyers")
      .upload(filePath, file);

    if (error) {
      console.error(error);
      alert("Flyer konnte nicht hochgeladen werden.");
      return "";
    }

    const { data } = supabase.storage
      .from("flyers")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function createEvent(e) {
    e.preventDefault();

    if (!form.title || !form.date || !form.time) {
      alert("Bitte Titel, Datum und Uhrzeit ausfüllen.");
      return;
    }

    const flyerUrl = await uploadFlyer(form.flyer);

    const { error } = await supabase.from("events").insert([
      {
        title: form.title,
        event_date: form.date,
        event_time: form.time,
        location: form.location || "Noch offen",
        description: form.description || "",
        max_participants: form.maxParticipants ? Number(form.maxParticipants) : null,
        flyer_url: flyerUrl,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Event konnte nicht gespeichert werden.");
      return;
    }

    setForm({
      title: "",
      date: "",
      time: "",
      location: "",
      description: "",
      maxParticipants: "",
      flyer: null,
    });

    await loadData();
  }

  async function toggleParticipation(eventId) {
    const cleanName = name.trim();

    if (!cleanName) {
      alert("Bitte zuerst deinen Namen eintragen.");
      return;
    }

    const existing = participants.find(
      (p) => p.event_id === eventId && p.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (existing) {
      const { error } = await supabase
        .from("participants")
        .delete()
        .eq("id", existing.id);

      if (error) {
        console.error(error);
        alert("Zusage konnte nicht zurückgenommen werden.");
        return;
      }
    } else {
      const { error } = await supabase.from("participants").insert([
        {
          event_id: eventId,
          name: cleanName,
        },
      ]);

      if (error) {
        console.error(error);
        alert("Zusage konnte nicht gespeichert werden.");
        return;
      }
    }

    await loadData();
  }

  if (loading) {
    return <div style={styles.page}>Lade Events...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <p style={styles.badge}>Interner Event-Kalender</p>
          <h1 style={styles.title}>Mitarbeiter-Events</h1>
          <p style={styles.subtitle}>
            Events planen, Flyer hochladen und Zusagen dauerhaft speichern.
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
          <h2><Plus size={18} /> Neues Event anlegen</h2>

          <form onSubmit={createEvent} style={styles.form}>
            <input style={styles.input} placeholder="Titel" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input style={styles.input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <input style={styles.input} type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            <input style={styles.input} placeholder="Ort" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <input style={styles.input} type="number" placeholder="Max. Teilnehmer" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })} />
            <textarea style={styles.textarea} placeholder="Beschreibung" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <input
              style={styles.input}
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, flyer: e.target.files[0] })}
            />

            <button style={styles.primaryButton} type="submit">
              Event speichern
            </button>
          </form>
        </section>

        <div style={styles.toolbar}>
          <button style={styles.secondaryButton} onClick={() => setArchive(!archive)}>
            <Archive size={16} />
            {archive ? " Kommende Events anzeigen" : " Archiv anzeigen"}
          </button>
        </div>

        {filteredEvents.length === 0 && (
          <div style={styles.card}>Keine Events vorhanden.</div>
        )}

        {filteredEvents.map((event) => {
          const eventParticipants = getParticipants(event.id);
          const joined = eventParticipants.some(
            (p) => p.name.toLowerCase() === name.trim().toLowerCase()
          );

          return (
            <section key={event.id} style={styles.eventCard}>
              <div>
                <h2>{event.title}</h2>

                <p style={styles.infoLine}>
                  <CalendarDays size={16} />
                  {formatDate(event.event_date)} · {event.event_time?.slice(0, 5)} Uhr
                </p>

                <p style={styles.infoLine}>
                  <MapPin size={16} />
                  {event.location}
                </p>

                <p>{event.description}</p>

                {event.flyer_url && (
                  <img
                    src={event.flyer_url}
                    alt="Event Flyer"
                    style={styles.flyer}
                  />
                )}

                <p style={styles.infoLine}>
                  <Users size={16} />
                  {eventParticipants.length} Zusagen
                  {event.max_participants
                    ? ` / ${event.max_participants} Plätze`
                    : ""}
                </p>

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
                {eventParticipants.length === 0 ? (
                  <p>Noch keine Zusagen.</p>
                ) : (
                  <ul>
                    {eventParticipants.map((p) => (
                      <li key={p.id}>{p.name}</li>
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
  page: { minHeight: "100vh", background: "#f4f6f8", padding: "24px", fontFamily: "Arial, sans-serif", color: "#1f2937" },
  container: { maxWidth: "1000px", margin: "0 auto" },
  header: { background: "white", padding: "28px", borderRadius: "18px", marginBottom: "20px", boxShadow: "0 8px 20px rgba(0,0,0,0.05)" },
  badge: { display: "inline-block", background: "#eef2ff", padding: "6px 12px", borderRadius: "999px", fontSize: "14px", marginBottom: "10px" },
  title: { margin: 0, fontSize: "34px" },
  subtitle: { color: "#6b7280" },
  card: { background: "white", padding: "20px", borderRadius: "16px", marginBottom: "20px", boxShadow: "0 6px 16px rgba(0,0,0,0.04)" },
  form: { display: "grid", gap: "10px" },
  input: { padding: "12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "15px" },
  textarea: { padding: "12px", borderRadius: "10px", border: "1px solid #d1d5db", minHeight: "90px", fontSize: "15px" },
  toolbar: { marginBottom: "20px" },
  eventCard: { background: "white", padding: "22px", borderRadius: "18px", marginBottom: "20px", boxShadow: "0 8px 20px rgba(0,0,0,0.05)", display: "grid", gridTemplateColumns: "1fr 260px", gap: "20px" },
  participantBox: { background: "#f9fafb", padding: "16px", borderRadius: "14px" },
  infoLine: { display: "flex", alignItems: "center", gap: "8px" },
  flyer: { width: "100%", maxWidth: "450px", borderRadius: "12px", border: "1px solid #ddd", margin: "15px 0" },
  primaryButton: { background: "#2563eb", color: "white", border: "none", padding: "11px 16px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "6px" },
  secondaryButton: { background: "white", color: "#1f2937", border: "1px solid #d1d5db", padding: "11px 16px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "6px" },
};
