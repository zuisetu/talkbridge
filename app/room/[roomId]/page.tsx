"use client";

import { toRomaji } from "@/lib/romaji";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Room = {
  id: string;
  name: string;
};

type Card = {
  id: string;
  room_id: string;
  target_user: "glenn" | "me" | "both";
  card_type: "japanese" | "english" | "both";
  japanese_text: string | null;
  romaji: string | null;
  english_meaning: string | null;
  pronunciation_note: string | null;
  usage_note: string | null;
  status: "new" | "practicing" | "learned";
  tags: string[] | null;
};

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;

  const [room, setRoom] = useState<Room | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copyMessage, setCopyMessage] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [japaneseText, setJapaneseText] = useState("");
  const [englishMeaning, setEnglishMeaning] = useState("");
  const [pronunciationNote, setPronunciationNote] = useState("");
  const [usageNote, setUsageNote] = useState("");
  const [tagsText, setTagsText] = useState("");

  const romaji = toRomaji(japaneseText);

  useEffect(() => {
    async function loadRoomAndCards() {
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id, name")
        .eq("id", roomId)
        .single();

      if (roomError) {
        console.error(roomError);
      }

      const { data: cardData, error: cardError } = await supabase
        .from("cards")
        .select(
          "id, room_id, target_user, card_type, japanese_text, romaji, english_meaning, pronunciation_note, usage_note, status, tags"
        )
        .eq("room_id", roomId)
        .order("created_at", { ascending: false });

      if (cardError) {
        console.error(cardError);
      }

      setRoom(roomData);
      setCards(cardData ?? []);
      setIsLoading(false);
    }

    if (roomId) {
      loadRoomAndCards();
    }
  }, [roomId]);

  async function copyRoomLink() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopyMessage("Room link copied");
    setTimeout(() => setCopyMessage(""), 2000);
  }

  async function saveJapaneseCard() {
    setIsSaving(true);
    setErrorMessage("");

    const tags = tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const { data, error } = await supabase
      .from("cards")
      .insert({
        room_id: roomId,
        target_user: "glenn",
        card_type: "japanese",
        japanese_text: japaneseText.trim(),
        romaji,
        english_meaning: englishMeaning.trim(),
        pronunciation_note: pronunciationNote.trim(),
        usage_note: usageNote.trim(),
        tags,
        status: "new",
      })
      .select(
        "id, room_id, target_user, card_type, japanese_text, romaji, english_meaning, pronunciation_note, usage_note, status, tags"
      )
      .single();

    if (error) {
      console.error(error);
      setErrorMessage("Failed to save card. Please try again.");
      setIsSaving(false);
      return;
    }

    setCards((current) => [data, ...current]);
    setJapaneseText("");
    setEnglishMeaning("");
    setPronunciationNote("");
    setUsageNote("");
    setTagsText("");
    setShowAddForm(false);
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-900">
        <div className="mx-auto max-w-md">
          <p className="text-sm text-stone-500">Loading room...</p>
        </div>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-900">
        <div className="mx-auto max-w-md">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            <h1 className="text-2xl font-bold">Room not found</h1>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              This room does not exist or the URL is incorrect.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-900">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-medium text-stone-500">Shared room</p>
          <h1 className="mt-2 text-2xl font-bold">{room.name}</h1>
          <p className="mt-3 break-all text-xs text-stone-500">{room.id}</p>

          <button
            onClick={copyRoomLink}
            className="mt-5 w-full rounded-2xl bg-stone-900 px-4 py-3 text-base font-semibold text-white"
          >
            Copy room link
          </button>

          {copyMessage ? (
            <p className="mt-3 text-center text-sm text-stone-600">
              {copyMessage}
            </p>
          ) : null}
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-800">Cards</p>
              <p className="mt-1 text-sm text-stone-500">
                Japanese and English cards will appear here.
              </p>
            </div>

            <button
              onClick={() => setShowAddForm((current) => !current)}
              className="rounded-2xl bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-800"
            >
              {showAddForm ? "Close" : "Add"}
            </button>
          </div>
        </section>

        {showAddForm ? (
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
            <p className="text-sm font-semibold text-stone-800">
              Add Japanese Card
            </p>
            <p className="mt-1 text-sm text-stone-500">
              For Glenn. Use kana-first phrases for now.
            </p>

            <label className="mt-5 block text-sm font-semibold text-stone-700">
              Japanese phrase
            </label>
            <input
              value={japaneseText}
              onChange={(event) => setJapaneseText(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-stone-400"
              placeholder="おはよう"
            />

            <label className="mt-4 block text-sm font-semibold text-stone-700">
              Romaji
            </label>
            <div className="mt-2 rounded-2xl bg-stone-100 px-4 py-3 text-base text-stone-700">
              {romaji || "Auto-generated from kana"}
            </div>

            <label className="mt-4 block text-sm font-semibold text-stone-700">
              English meaning
            </label>
            <input
              value={englishMeaning}
              onChange={(event) => setEnglishMeaning(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-stone-400"
              placeholder="Good morning"
            />

            <label className="mt-4 block text-sm font-semibold text-stone-700">
              Pronunciation note
            </label>
            <textarea
              value={pronunciationNote}
              onChange={(event) => setPronunciationNote(event.target.value)}
              className="mt-2 min-h-20 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-stone-400"
              placeholder="o-ha-yo-u. Say each vowel clearly."
            />

            <label className="mt-4 block text-sm font-semibold text-stone-700">
              Usage note
            </label>
            <textarea
              value={usageNote}
              onChange={(event) => setUsageNote(event.target.value)}
              className="mt-2 min-h-20 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-stone-400"
              placeholder="Morning greeting, casual and common."
            />

            <label className="mt-4 block text-sm font-semibold text-stone-700">
              Tags
            </label>
            <input
              value={tagsText}
              onChange={(event) => setTagsText(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-stone-400"
              placeholder="greeting, daily"
            />

            {errorMessage ? (
              <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
            ) : null}

            <button
              onClick={saveJapaneseCard}
              disabled={isSaving || !japaneseText.trim()}
              className="mt-5 w-full rounded-2xl bg-stone-900 px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Japanese card"}
            </button>
          </section>
        ) : null}

        <div className="flex flex-col gap-4">
          {cards.map((card) => (
            <article
              key={card.id}
              className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  For Glenn
                </p>
                <p className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                  {card.status}
                </p>
              </div>

              <p className="mt-4 text-3xl font-bold text-stone-900">
                {card.japanese_text}
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-500">
                {card.romaji}
              </p>

              {card.english_meaning ? (
                <p className="mt-4 text-base text-stone-700">
                  {card.english_meaning}
                </p>
              ) : null}

              {card.usage_note ? (
                <p className="mt-3 text-sm leading-6 text-stone-500">
                  {card.usage_note}
                </p>
              ) : null}

              {card.tags && card.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}