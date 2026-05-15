import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Users, Plus, Archive, CheckCircle2, Search, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const employees = [
  "Kevin Stedtnitz",
  "Jens Schierenbeck",
  "Fabian Meyer",
  "Maxi Hoffmann",
  "Julia Berger",
  "Ole Krüger",
  "Michael Brandt",
  "Luis Wagner",
];

const demoEvents = [
  {
    id: 1,
    title: "Coffee & Cake Afternoon",
    date: "2026-06-05",
    time: "15:00",
    location: "Aufenthaltsbereich",
    description: "Gemütlicher Abteilungsnachmittag mit Kaffee, Kuchen und kleinen Snacks.",
    maxParticipants: 40,
    participants: ["Kevin Stedtnitz", "Jens Schierenbeck", "Fabian Meyer"],
  },
  {
    id: 2,
    title: "After Work Grillen",
    date: "2026-07-17",
    time: "17:30",
    location: "Innenhof",
    description: "Lockeres After Work mit Grill, Getränken und Musik.",
    maxParticipants: 60,
    participants: ["Kevin Stedtnitz", "Maxi Hoffmann", "Ole Krüger"],
  },
  {
    id: 3,
    title: "Vergangenes Test-Event",
    date: "2026-01-10",
    time: "16:00",
    location: "Konferenzraum",
    description: "Dieses Event ist bereits vorbei und wird nur im Archiv angezeigt.",
    maxParticipants: 20,
    participants: ["Michael Brandt", "Luis Wagner"],
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

function ParticipantList({ participants }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-700">
        <span>Zusagen</span>
        <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
          {participants.length}
        </span>
      </div>

      {participants.length ? (
        <div className="space-y-2">
          {participants.map((name) => (
            <div key={name} className="rounded-xl bg-white px-3 py-2 text-sm shadow-sm">
              {name}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-400">
          Noch keine Zusagen
        </div>
      )}
    </div>
  );
}

function EventCard({ event, employee, onToggleParticipation }) {
  const hasJoined = event.participants.includes(employee);
  const free = event.maxParticipants ? Math.max(event.maxParticipants - event.participants.length, 0) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="grid gap-0 p-0 lg:grid-cols-[1fr_320px]">
          <div className="p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  <CalendarDays className="h-4 w-4" /> {formatDate(event.date)} · {event.time} Uhr
                </div>
                <h2 className="text-2xl font-bold tracking-tight">{event.title}</h2>
              </div>

              {hasJoined && (
                <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                  Du bist dabei
                </span>
              )}
            </div>

            <div className="mb-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />{event.location}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />{event.participants.length} Zusagen{event.maxParticipants ? ` / ${event.maxParticipants} Plätze` : ""}
              </div>
            </div>

            <p className="mb-5 leading-relaxed text-slate-700">{event.description}</p>

            <div className="mb-5 flex flex-wrap gap-2">
              <Button
                onClick={() => onToggleParticipation(event.id, employee)}
                className="rounded-xl"
                variant={hasJoined ? "outline" : "default"}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {hasJoined ? "Zusage zurücknehmen" : "Zusagen"}
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-100 p-4 text-emerald-700">
                <div className="text-sm font-semibold">Aktuelle Zusagen</div>
                <div className="mt-2 text-2xl font-bold">{event.participants.length}</div>
              </div>

              {event.maxParticipants && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
                  <div className="text-sm font-semibold">Freie Plätze</div>
                  <div className="mt-2 text-2xl font-bold">{free}</div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t bg-slate-50 p-6 lg:border-l lg:border-t-0">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
              Teilnehmerübersicht
            </h3>
            <ParticipantList participants={event.participants} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function EventKalenderMVP() {
  const [events, setEvents] = useState(demoEvents);
  const [employee, setEmployee] = useState(employees[0]);
  const [archive, setArchive] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    maxParticipants: "",
  });

  const filtered = useMemo(() => events
    .filter((event) => archive ? isPast(event) : !isPast(event))
    .filter((event) => `${event.title} ${event.location} ${event.description}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(a.date) - new Date(b.date)), [events, archive, search]);

  function toggleParticipation(eventId, name) {
    setEvents((prev) => prev.map((event) => {
      if (event.id !== eventId) return event;

      const hasJoined = event.participants.includes(name);

      return {
        ...event,
        participants: hasJoined
          ? event.participants.filter((participant) => participant !== name)
          : [...event.participants, name],
      };
    }));
  }

  function createEvent(e) {
    e.preventDefault();
    if (!form.title || !form.date || !form.time) return;

    setEvents((prev) => [...prev, {
      id: Date.now(),
      title: form.title,
      date: form.date,
      time: form.time,
      location: form.location || "Noch offen",
      description: form.description || "Keine Beschreibung hinterlegt.",
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
      participants: [],
    }]);

    setForm({
      title: "",
      date: "",
      time: "",
      location: "",
      description: "",
      maxParticipants: "",
    });
  }

  const upcomingCount = events.filter((event) => !isPast(event)).length;
  const archiveCount = events.filter((event) => isPast(event)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
            <Clock className="h-4 w-4" />Interner Event-Kalender
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Mitarbeiter-Events</h1>
          <p className="mt-2 text-slate-600">
            Events planen, Zusagen sammeln und vergangene Veranstaltungen automatisch ausblenden.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 md:max-w-md">
            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <div className="text-2xl font-bold">{upcomingCount}</div>
              <div className="text-sm text-slate-500">Kommende Events</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <div className="text-2xl font-bold">{archiveCount}</div>
              <div className="text-sm text-slate-500">Archiv</div>
            </div>
          </div>
        </header>

        <div className="mb-6 grid gap-4 rounded-3xl bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px_180px]">
          <div className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Event suchen..."
              className="w-full outline-none"
            />
          </div>

          <select
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            className="rounded-2xl border px-3 py-2 outline-none"
          >
            {employees.map((name) => <option key={name}>{name}</option>)}
          </select>

          <Button onClick={() => setArchive(!archive)} className="rounded-2xl" variant={archive ? "default" : "outline"}>
            <Archive className="mr-2 h-4 w-4" />{archive ? "Archiv" : "Kommend"}
          </Button>
        </div>

        <form onSubmit={createEvent} className="mb-8 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <Plus className="h-5 w-5" />Neues Event anlegen
          </h2>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded-xl border px-3 py-2"
              placeholder="Titel"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              className="rounded-xl border px-3 py-2"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <input
              className="rounded-xl border px-3 py-2"
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
            <input
              className="rounded-xl border px-3 py-2"
              placeholder="Ort"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <input
              className="rounded-xl border px-3 py-2"
              type="number"
              placeholder="Max. Teilnehmer"
              value={form.maxParticipants}
              onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
            />
            <Button className="rounded-xl" type="submit">Event erstellen</Button>
          </div>

          <textarea
            className="mt-3 w-full rounded-xl border px-3 py-2"
            placeholder="Beschreibung"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </form>

        <div className="space-y-5">
          {filtered.length ? filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              employee={employee}
              onToggleParticipation={toggleParticipation}
            />
          )) : (
            <div className="rounded-3xl border border-dashed bg-white p-10 text-center text-slate-500">
              Keine passenden Events gefunden.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

