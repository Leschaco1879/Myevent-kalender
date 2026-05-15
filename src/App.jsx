import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Users,
  Plus,
  Archive,
  CheckCircle2,
  Trash2,
  Edit,
  Save,
  X,
  Shield,
} from "lucide-react";
import { supabase } from "./supabase";

const ADMIN_PIN = "1879";

export default function App() {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [name, setName] = useState("");
  const [archive, setArchive] = useState(false);
  const [loading, setLoading] = useState(true);

  const [adminPin, setAdminPin] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    maxParticipants: "",
    flyer: null,
  });

  const [editForm, setEditForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    maxParticipants: "",
    flyer: null,
    flyerUrl: "",
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

  function handleAdminLogin() {
    if (adminPin === ADMIN_PIN) {
      setIsAdmin(true);
      setAdminPin("");
    } else {
      alert("Falscher Admin-PIN.");
    }
  }

  function handleAdminLogout() {
    setIsAdmin(false);
    setEditingEventId(null);
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
    return events.filter((event) =>
      archive ? isPast(event) : !isPast(event)
    );
  }, [events, archive]);

  function getParticipants(eventId) {
    return participants.filter((p) => p.event_id === eventId);
  }

  async function uploadFlyer(file) {
    if (!file) return "";

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;
    const filePath = `event-flyer/${fileName}`;

    const { error } = await supabase.storage
      .from("flyers")
      .upload(filePath, file);

    if (error) {
      console.error(error);
      alert("Flyer konnte nicht hochgeladen werden: " + error.message);
      return "";
    }

    const { data } = supabase.storage
      .from("flyers")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function createEvent(e) {
    e.preventDefault();

    if (!isAdmin) {
      alert("Nur Admins dürfen Events erstellen.");
      return;
    }

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
        max_participants: form.maxParticipants
          ? Number(form.maxParticipants)
          : null,
        flyer_url: flyerUrl,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Event konnte nicht gespeichert werden: " + error.message);
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
      (p) =>
        p.event_id === eventId &&
        p.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (existing) {
      const { error } = await supabase
        .from("participants")
        .delete()
        .eq("id", existing.id);

      if (error) {
        console.error(error);
        alert("Zusage konnte nicht zurückgenommen werden: " + error.message);
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
        alert("Zusage konnte nicht gespeichert werden: " + error.message);
        return;
      }
    }

    await loadData();
  }

  function startEdit(event) {
    setEditingEventId(event.id);
    setEditForm({
      title: event.title || "",
      date: event.event_date || "",
      time: event.event_time ? event.event_time.slice(0, 5) : "",
      location: event.location || "",
      description: event.description || "",
      maxParticipants: event.max_participants || "",
      flyer: null,
      flyerUrl: event.flyer_url || "",
    });
  }

  function cancelEdit() {
    setEditingEventId(null);
    setEditForm({
      title: "",
      date: "",
      time: "",
      location: "",
      description: "",
      maxParticipants: "",
      flyer: null,
      flyerUrl: "",
    });
  }

  async function saveEdit(eventId) {
    if (!isAdmin) {
      alert("Nur Admins dürfen Events bearbeiten.");
      return;
    }

    if (!editForm.title || !editForm.date || !editForm.time) {
      alert("Bitte Titel, Datum und Uhrzeit ausfüllen.");
      return;
    }

    let flyerUrl = editForm.flyerUrl;

    if (editForm.flyer) {
      const uploadedUrl = await uploadFlyer(editForm.flyer);
      if (uploadedUrl) flyerUrl = uploadedUrl;
    }

    const { error } = await supabase
      .from("events")
      .update({
        title: editForm.title,
        event_date: editForm.date,
        event_time: editForm.time,
        location: editForm.location || "Noch offen",
        description: editForm.description || "",
        max_participants: editForm.maxParticipants
          ? Number(editForm.maxParticipants)
          : null,
        flyer_url: flyerUrl,
      })
      .eq("id", eventId);

    if (error) {
      console.error(error);
      alert("Event konnte nicht bearbeitet werden: " + error.message);
      return;
    }

    cancelEdit();
    await loadData();
  }

  async function deleteEvent(eventId) {
    if (!isAdmin) {
      alert("Nur Admins dürfen Events löschen.");
      return;
    }

    if (!confirm("Event wirklich löschen? Alle Zusagen dazu werden ebenfalls gelöscht.")) {
      return;
    }

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      console.error(error);
      alert("Event konnte nicht gelöscht werden: " + error.message);
      return;
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
          <h1 style={styles.title}>Events</h1>
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
          <h2>
            <Shield size={18} /> Adminbereich
          </h2>

          {!isAdmin ? (
            <div style={styles.adminRow}>
              <input
                style={styles.input}
                type="password"
                placeholder="Admin-PIN"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
              />
              <button style={styles.primaryButton} onClick={handleAdminLogin}>
                Admin öffnen
              </button>
            </div>
          ) : (
            <div style={styles.adminInfo}>
              <strong>Adminbereich ist aktiv.</strong>
              <button style={styles.secondaryButton} onClick={handleAdminLogout}>
                Admin verlassen
              </button>
            </div>
          )}
        </section>

        {isAdmin && (
          <section style={styles.card}>
            <h2>
              <Plus size={18} /> Neues Event anlegen
            </h2>

            <form onSubmit={createEvent} style={styles.form}>
              <input
                style={styles.input}
                placeholder="Titel"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              <input
                style={styles.input}
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />

              <input
                style={styles.input}
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
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

              <textarea
                style={styles.textarea}
                placeholder="Beschreibung"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <input
                style={styles.input}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setForm({ ...form, flyer: e.target.files[0] })
                }
              />

              <button style={styles.primaryButton} type="submit">
                Event speichern
              </button>
            </form>
          </section>
        )}

        <div style={styles.toolbar}>
          <button
            style={styles.secondaryButton}
            onClick={() => setArchive(!archive)}
          >
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
          const isEditing = editingEventId === event.id;

          return (
            <section key={event.id} style={styles.eventCard}>
              <div>
                {!isEditing ? (
                  <>
                    <h2>{event.title}</h2>

                    <p style={styles.infoLine}>
                      <CalendarDays size={16} />
                      {formatDate(event.event_date)} ·{" "}
                      {event.event_time?.slice(0, 5)} Uhr
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

                    <div style={styles.buttonRow}>
                      <button
                        style={
                          joined ? styles.secondaryButton : styles.primaryButton
                        }
                        onClick={() => toggleParticipation(event.id)}
                      >
                        <CheckCircle2 size={16} />
                        {joined ? " Zusage zurücknehmen" : " Zusagen"}
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            style={styles.secondaryButton}
                            onClick={() => startEdit(event)}
                          >
                            <Edit size={16} />
                            Bearbeiten
                          </button>

                          <button
                            style={styles.dangerButton}
                            onClick={() => deleteEvent(event.id)}
                          >
                            <Trash2 size={16} />
                            Löschen
                          </button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={styles.form}>
                    <h2>Event bearbeiten</h2>

                    <input
                      style={styles.input}
                      placeholder="Titel"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                    />

                    <input
                      style={styles.input}
                      type="date"
                      value={editForm.date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, date: e.target.value })
                      }
                    />

                    <input
                      style={styles.input}
                      type="time"
                      value={editForm.time}
                      onChange={(e) =>
                        setEditForm({ ...editForm, time: e.target.value })
                      }
                    />

                    <input
                      style={styles.input}
                      placeholder="Ort"
                      value={editForm.location}
                      onChange={(e) =>
                        setEditForm({ ...editForm, location: e.target.value })
                      }
                    />

                    <input
                      style={styles.input}
                      type="number"
                      placeholder="Max. Teilnehmer"
                      value={editForm.maxParticipants}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          maxParticipants: e.target.value,
                        })
                      }
                    />

                    <textarea
                      style={styles.textarea}
                      placeholder="Beschreibung"
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />

                    {editForm.flyerUrl && (
                      <img
                        src={editForm.flyerUrl}
                        alt="Aktueller Flyer"
                        style={styles.flyer}
                      />
                    )}

                    <input
                      style={styles.input}
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          flyer: e.target.files[0],
                        })
                      }
                    />

                    <div style={styles.buttonRow}>
                      <button
                        style={styles.primaryButton}
                        onClick={() => saveEdit(event.id)}
                      >
                        <Save size={16} />
                        Speichern
                      </button>

                      <button style={styles.secondaryButton} onClick={cancelEdit}>
                        <X size={16} />
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
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
  page: {
    minHeight: "100vh",
    background: "#f8f8f8",
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
    background: "#fee2e2",
    color: "#b91c1c",
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
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #f1f1f1",
    display: "grid",
    gridTemplateColumns: "1fr 260px",
    gap: "20px",
  },
  participantBox: {
    background: "#fff5f5",
    border: "1px solid #fecaca",
    padding: "16px",
    borderRadius: "14px",
  },
  infoLine: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  flyer: {
    width: "100%",
    maxWidth: "450px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    margin: "15px 0",
  },
  adminRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  adminInfo: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  buttonRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "12px",
  },
  primaryButton: {
    background: "#dc2626",
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
  dangerButton: {
    background: "#991b1b",
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
};
