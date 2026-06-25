"use client";

import { toRomaji, toRomajiTokens } from "@/lib/romaji";
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

  japanese_intent: string | null;
  english_attempt: string | null;
  natural_english: string | null;
  casual_english: string | null;

  pronunciation_note: string | null;
  pronunciation_chunks: string | null;
  usage_note: string | null;
  meaning_note: string | null;

  status: "new" | "practicing" | "learned";
  tags: string[] | null;
};

type CardMode = "japanese" | "english";

function KanaRomajiLine({
  text,
  size = "large",
}: {
  text: string;
  size?: "large" | "small";
}) {
  const tokens = toRomajiTokens(text);

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-3">
      {tokens.map((token, index) => (
        <div
          key={`${token.kana}-${index}`}
          className="flex min-w-8 flex-col items-center"
        >
          <span
            className={
              size === "large"
                ? "text-3xl font-bold leading-none text-stone-900"
                : "text-2xl font-bold leading-none text-stone-900"
            }
          >
            {token.kana}
          </span>
          <span
            className={
              size === "large"
                ? "mt-2 text-sm font-semibold leading-none text-stone-500"
                : "mt-2 text-xs font-semibold leading-none text-stone-500"
            }
          >
            {token.romaji}
          </span>
        </div>
      ))}
    </div>
  );
}

function getNextStatus(status: Card["status"]): Card["status"] {
  if (status === "new") return "practicing";
  if (status === "practicing") return "learned";
  return "new";
}

function getTargetLabel(targetUser: Card["target_user"]) {
  if (targetUser === "glenn") return "For Glenn";
  if (targetUser === "me") return "For Me";
  return "For Both";
}

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;

  const [room, setRoom] = useState<Room | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copyMessage, setCopyMessage] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [cardMode, setCardMode] = useState<CardMode>("japanese");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [japaneseText, setJapaneseText] = useState("");
  const [englishMeaning, setEnglishMeaning] = useState("");
  const [pronunciationNote, setPronunciationNote] = useState("");
  const [usageNote, setUsageNote] = useState("");

  const [japaneseIntent, setJapaneseIntent] = useState("");
  const [englishAttempt, setEnglishAttempt] = useState("");
  const [naturalEnglish, setNaturalEnglish] = useState("");
  const [casualEnglish, setCasualEnglish] = useState("");
  const [pronunciationChunks, setPronunciationChunks] = useState("");
  const [meaningNote, setMeaningNote] = useState("");

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
          "id, room_id, target_user, card_type, japanese_text, romaji, english_meaning, japanese_intent, english_attempt, natural_english, casual_english, pronunciation_note, pronunciation_chunks, usage_note, meaning_note, status, tags"
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

  function resetForm() {
    setJapaneseText("");
    setEnglishMeaning("");
    setPronunciationNote("");
    setUsageNote("");

    setJapaneseIntent("");
    setEnglishAttempt("");
    setNaturalEnglish("");
    setCasualEnglish("");
    setPronunciationChunks("");
    setMeaningNote("");

    setTagsText("");
    setErrorMessage("");
  }

  async function copyRoomLink() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopyMessage("Room link copied");
    setTimeout(() => setCopyMessage(""), 2000);
  }

  async function saveCard() {
    setIsSaving(true);
    setErrorMessage("");

    const tags = tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const insertData =
      cardMode === "japanese"
        ? {
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
          }
        : {
            room_id: roomId,
            target_user: "me",
            card_type: "english",
            japanese_intent: japaneseIntent.trim(),
            english_attempt: englishAttempt.trim(),
            natural_english: naturalEnglish.trim(),
            casual_english: casualEnglish.trim(),
            pronunciation_chunks: pronunciationChunks.trim(),
            meaning_note: meaningNote.trim(),
            tags,
            status: "new",
          };

    const { data, error } = await supabase
      .from("cards")
      .insert(insertData)
      .select(
        "id, room_id, target_user, card_type, japanese_text, romaji, english_meaning, japanese_intent, english_attempt, natural_english, casual_english, pronunciation_note, pronunciation_chunks, usage_note, meaning_note, status, tags"
      )
      .single();

    if (error) {
      console.error(error);
      setErrorMessage("Failed to save card. Please try again.");
      setIsSaving(false);
      return;
    }

    setCards((current) => [data, ...current]);
    resetForm();
    setShowAddForm(false);
    setIsSaving(false);
  }

  async function updateCardStatus(cardId: string, currentStatus: Card["status"]) {
    const nextStatus = getNextStatus(currentStatus);

    setCards((current) =>
      current.map((card) =>
        card.id === cardId ? { ...card, status: nextStatus } : card
      )
    );

    const { error } = await supabase
      .from("cards")
      .update({ status: nextStatus })
      .eq("id", cardId);

    if (error) {
      console.error(error);

      setCards((current) =>
        current.map((card) =>
          card.id === cardId ? { ...card, status: currentStatus } : card
        )
      );
    }
  }

  const canSave =
    cardMode === "japanese"
      ? Boolean(japaneseText.trim())
      : Boolean(naturalEnglish.trim() || casualEnglish.trim());

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
              onClick={() => {
                setShowAddForm((current) => !current);
                setErrorMessage("");
              }}
              className="rounded-2xl bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-800"
            >
              {showAddForm ? "Close" : "Add"}
            </button>
          </div>
        </section>

        {showAddForm ? (
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
            <p className="text-sm font-semibold text-stone-800">Add Card</p>
            <p className="mt-1 text-sm text-stone-500">
              Save phrases for Japanese and English practice.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1">
              <button
                onClick={() => {
                  setCardMode("japanese");
                  setErrorMessage("");
                }}
                className={
                  cardMode === "japanese"
                    ? "rounded-xl bg-white px-3 py-2 text-sm font-semibold text-stone-900 shadow-sm"
                    : "rounded-xl px-3 py-2 text-sm font-semibold text-stone-500"
                }
              >
                Japanese
              </button>
              <button
                onClick={() => {
                  setCardMode("english");
                  setErrorMessage("");
                }}
                className={
                  cardMode === "english"
                    ? "rounded-xl bg-white px-3 py-2 text-sm font-semibold text-stone-900 shadow-sm"
                    : "rounded-xl px-3 py-2 text-sm font-semibold text-stone-500"
                }
              >
                English
              </button>
            </div>

            {cardMode === "japanese" ? (
              <>
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
                  Romaji guide
                </label>
                <div className="mt-2 rounded-2xl bg-stone-100 px-4 py-3">
                  {japaneseText ? (
                    <KanaRomajiLine text={japaneseText} size="small" />
                  ) : (
                    <p className="text-base text-stone-500">
                      Auto-generated from kana
                    </p>
                  )}
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
              </>
            ) : (
              <>
                <label className="mt-5 block text-sm font-semibold text-stone-700">
                  Japanese intent
                </label>
                <textarea
                  value={japaneseIntent}
                  onChange={(event) => setJapaneseIntent(event.target.value)}
                  className="mt-2 min-h-20 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-stone-400"
                  placeholder="間違っても伝わらなくても良いから、とにかく声に出すことが大切だと思う。"
                />

                <label className="mt-4 block text-sm font-semibold text-stone-700">
                  My English attempt
                </label>
                <textarea
                  value={englishAttempt}
                  onChange={(event) => setEnglishAttempt(event.target.value)}
                  className="mt-2 min-h-20 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-stone-400"
                  placeholder="I think it is important to speak even if mistakes."
                />

                <label className="mt-4 block text-sm font-semibold text-stone-700">
                  Natural English
                </label>
                <textarea
                  value={naturalEnglish}
                  onChange={(event) => setNaturalEnglish(event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-stone-400"
                  placeholder="I think the important thing is to just say things out loud, even if we make mistakes."
                />

                <label className="mt-4 block text-sm font-semibold text-stone-700">
                  Casual English
                </label>
                <textarea
                  value={casualEnglish}
                  onChange={(event) => setCasualEnglish(event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-stone-400"
                  placeholder="I think we just need to say things out loud, even if we mess up."
                />

                <label className="mt-4 block text-sm font-semibold text-stone-700">
                  Pronunciation chunks
                </label>
                <textarea
                  value={pronunciationChunks}
                  onChange={(event) =>
                    setPronunciationChunks(event.target.value)
                  }
                  className="mt-2 min-h-20 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-stone-400"
                  placeholder="I think / the important thing is / to just say things out loud"
                />

                <label className="mt-4 block text-sm font-semibold text-stone-700">
                  Notes
                </label>
                <textarea
                  value={meaningNote}
                  onChange={(event) => setMeaningNote(event.target.value)}
                  className="mt-2 min-h-20 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-stone-400"
                  placeholder="mess up = ミスる / get it across = 言いたいことを伝える"
                />
              </>
            )}

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
              onClick={saveCard}
              disabled={isSaving || !canSave}
              className="mt-5 w-full rounded-2xl bg-stone-900 px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
            >
              {isSaving
                ? "Saving..."
                : cardMode === "japanese"
                  ? "Save Japanese card"
                  : "Save English card"}
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
                  {getTargetLabel(card.target_user)}
                </p>

                <button
                  onClick={() => updateCardStatus(card.id, card.status)}
                  className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600"
                >
                  {card.status}
                </button>
              </div>

              {card.card_type === "japanese" ? (
                <>
                  {card.japanese_text ? (
                    <div className="mt-5">
                      <KanaRomajiLine text={card.japanese_text} />
                    </div>
                  ) : null}

                  {card.english_meaning ? (
                    <p className="mt-5 text-base text-stone-700">
                      {card.english_meaning}
                    </p>
                  ) : null}

                  {card.pronunciation_note ? (
                    <p className="mt-3 text-sm leading-6 text-stone-500">
                      {card.pronunciation_note}
                    </p>
                  ) : null}

                  {card.usage_note ? (
                    <p className="mt-3 text-sm leading-6 text-stone-500">
                      {card.usage_note}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  {card.japanese_intent ? (
                    <p className="mt-5 text-sm leading-6 text-stone-500">
                      {card.japanese_intent}
                    </p>
                  ) : null}

                  {card.natural_english ? (
                    <p className="mt-4 text-xl font-bold leading-8 text-stone-900">
                      {card.natural_english}
                    </p>
                  ) : null}

                  {card.casual_english ? (
                    <p className="mt-4 rounded-2xl bg-stone-100 px-4 py-3 text-base font-semibold leading-7 text-stone-800">
                      {card.casual_english}
                    </p>
                  ) : null}

                  {card.english_attempt ? (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                        My attempt
                      </p>
                      <p className="mt-1 text-sm leading-6 text-stone-500">
                        {card.english_attempt}
                      </p>
                    </div>
                  ) : null}

                  {card.pronunciation_chunks ? (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                        Chunks
                      </p>
                      <p className="mt-1 text-sm leading-6 text-stone-600">
                        {card.pronunciation_chunks}
                      </p>
                    </div>
                  ) : null}

                  {card.meaning_note ? (
                    <p className="mt-3 text-sm leading-6 text-stone-500">
                      {card.meaning_note}
                    </p>
                  ) : null}
                </>
              )}

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