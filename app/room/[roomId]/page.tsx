"use client";

import { toRomaji, toRomajiTokens } from "@/lib/romaji";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type Room = {
  id: string;
  name: string;
  memo: string | null;
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

type CardPayload = {
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

  tags: string[];
  status: "new" | "practicing" | "learned";
};

type CardMode = "japanese" | "english";
type LanguageFilter = "all" | "ja" | "en";
type StudyLanguage = "ja" | "en";
type StatusFilter = "all" | "new" | "practicing" | "learned";

const LAST_ROOM_KEY = "talkbridge:lastRoom";

const cardSelect =
  "id, room_id, target_user, card_type, japanese_text, romaji, english_meaning, japanese_intent, english_attempt, natural_english, casual_english, pronunciation_note, pronunciation_chunks, usage_note, meaning_note, status, tags";

function saveLastRoom(room: { id: string; name: string }) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    LAST_ROOM_KEY,
    JSON.stringify({
      id: room.id,
      name: room.name || "TalkBridge Room",
    })
  );
}

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

function getCardLabel(cardType: Card["card_type"]) {
  if (cardType === "japanese") return "JA";
  if (cardType === "english") return "EN";
  return "BOTH";
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white"
          : "rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600"
      }
    >
      {children}
    </button>
  );
}

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;

  const [room, setRoom] = useState<Room | null>(null);
  const [roomMemo, setRoomMemo] = useState("");
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [memoMessage, setMemoMessage] = useState("");

  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copyMessage, setCopyMessage] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardMode, setCardMode] = useState<CardMode>("japanese");

  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [studyLanguage, setStudyLanguage] = useState<StudyLanguage>("ja");
  const [activeStudyCardId, setActiveStudyCardId] = useState<string | null>(
    null
  );
  const [showStudyAnswer, setShowStudyAnswer] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
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

  const jaStudyCards = cards.filter((card) => card.card_type === "japanese");
  const enStudyCards = cards.filter((card) => card.card_type === "english");

  const currentStudyCards =
    studyLanguage === "ja" ? jaStudyCards : enStudyCards;

  const activeStudyCard =
    cards.find((card) => card.id === activeStudyCardId) ?? null;

  const filteredCards = cards.filter((card) => {
    const languageMatches =
      languageFilter === "all" ||
      (languageFilter === "ja" && card.card_type === "japanese") ||
      (languageFilter === "en" && card.card_type === "english");

    const statusMatches =
      statusFilter === "all" || card.status === statusFilter;

    return languageMatches && statusMatches;
  });

  useEffect(() => {
    async function loadRoomAndCards() {
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id, name, memo")
        .eq("id", roomId)
        .single();

      if (roomError) {
        console.error(roomError);
      }

      const { data: cardData, error: cardError } = await supabase
        .from("cards")
        .select(cardSelect)
        .eq("room_id", roomId)
        .order("created_at", { ascending: false });

      if (cardError) {
        console.error(cardError);
      }

      const loadedRoom = roomData as Room | null;

      setRoom(loadedRoom);
      setRoomMemo(loadedRoom?.memo ?? "");
      setCards((cardData ?? []) as Card[]);
      setIsLoading(false);

      if (loadedRoom) {
        saveLastRoom({
          id: loadedRoom.id,
          name: loadedRoom.name || "TalkBridge Room",
        });
      }
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
    setEditingCardId(null);
  }

  function openCreateForm() {
    resetForm();
    setCardMode("japanese");
    setShowAddForm(true);
  }

  function closeForm() {
    resetForm();
    setShowAddForm(false);
  }

  function startEditingCard(card: Card) {
    setEditingCardId(card.id);
    setCardMode(card.card_type === "english" ? "english" : "japanese");

    setJapaneseText(card.japanese_text ?? "");
    setEnglishMeaning(card.english_meaning ?? "");
    setPronunciationNote(card.pronunciation_note ?? "");
    setUsageNote(card.usage_note ?? "");

    setJapaneseIntent(card.japanese_intent ?? "");
    setEnglishAttempt(card.english_attempt ?? "");
    setNaturalEnglish(card.natural_english ?? "");
    setCasualEnglish(card.casual_english ?? "");
    setPronunciationChunks(card.pronunciation_chunks ?? "");
    setMeaningNote(card.meaning_note ?? "");

    setTagsText(card.tags?.join(", ") ?? "");
    setErrorMessage("");
    setShowAddForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildCardPayload(status: Card["status"] = "new"): CardPayload {
    const tags = tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (cardMode === "japanese") {
      return {
        room_id: roomId,
        target_user: "glenn",
        card_type: "japanese",

        japanese_text: japaneseText.trim(),
        romaji,
        english_meaning: englishMeaning.trim(),

        japanese_intent: null,
        english_attempt: null,
        natural_english: null,
        casual_english: null,

        pronunciation_note: pronunciationNote.trim(),
        pronunciation_chunks: null,
        usage_note: usageNote.trim(),
        meaning_note: null,

        tags,
        status,
      };
    }

    return {
      room_id: roomId,
      target_user: "me",
      card_type: "english",

      japanese_text: null,
      romaji: null,
      english_meaning: null,

      japanese_intent: japaneseIntent.trim(),
      english_attempt: englishAttempt.trim(),
      natural_english: naturalEnglish.trim(),
      casual_english: casualEnglish.trim(),

      pronunciation_note: null,
      pronunciation_chunks: pronunciationChunks.trim(),
      usage_note: null,
      meaning_note: meaningNote.trim(),

      tags,
      status,
    };
  }

  function pickRandomStudyCard(language: StudyLanguage = studyLanguage) {
    const pool =
      language === "ja"
        ? cards.filter((card) => card.card_type === "japanese")
        : cards.filter((card) => card.card_type === "english");

    if (pool.length === 0) {
      setActiveStudyCardId(null);
      setShowStudyAnswer(false);
      return;
    }

    const candidatePool =
      pool.length > 1
        ? pool.filter((card) => card.id !== activeStudyCardId)
        : pool;

    const randomIndex = Math.floor(Math.random() * candidatePool.length);
    const pickedCard = candidatePool[randomIndex];

    setStudyLanguage(language);
    setActiveStudyCardId(pickedCard.id);
    setShowStudyAnswer(false);
  }

  async function copyRoomLink() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopyMessage("Room link copied");
    setTimeout(() => setCopyMessage(""), 2000);
  }

  async function saveRoomMemo() {
    if (!room) return;

    setIsSavingMemo(true);
    setMemoMessage("");

    const { error } = await supabase
      .from("rooms")
      .update({
        memo: roomMemo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);

    if (error) {
      console.error(error);
      setMemoMessage("Failed to save memo.");
      setIsSavingMemo(false);
      return;
    }

    setRoom((current) => (current ? { ...current, memo: roomMemo } : current));
    setMemoMessage("Memo saved");
    setIsSavingMemo(false);
    setTimeout(() => setMemoMessage(""), 2000);
  }

  async function saveCard() {
    setIsSaving(true);
    setErrorMessage("");

    if (editingCardId) {
      const currentCard = cards.find((card) => card.id === editingCardId);
      const payload = buildCardPayload(currentCard?.status ?? "new");

      const { data, error } = await supabase
        .from("cards")
        .update(payload)
        .eq("id", editingCardId)
        .select(cardSelect)
        .single();

      if (error) {
        console.error(error);
        setErrorMessage("Failed to update card. Please try again.");
        setIsSaving(false);
        return;
      }

      setCards((current) =>
        current.map((card) =>
          card.id === editingCardId ? (data as Card) : card
        )
      );

      resetForm();
      setShowAddForm(false);
      setIsSaving(false);
      return;
    }

    const payload = buildCardPayload("new");

    const { data, error } = await supabase
      .from("cards")
      .insert(payload)
      .select(cardSelect)
      .single();

    if (error) {
      console.error(error);
      setErrorMessage("Failed to save card. Please try again.");
      setIsSaving(false);
      return;
    }

    setCards((current) => [data as Card, ...current]);
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

  async function deleteCard(cardId: string) {
    const confirmed = window.confirm("Delete this card?");
    if (!confirmed) return;

    setDeletingCardId(cardId);

    const { error } = await supabase.from("cards").delete().eq("id", cardId);

    if (error) {
      console.error(error);
      setDeletingCardId(null);
      return;
    }

    setCards((current) => current.filter((card) => card.id !== cardId));

    if (editingCardId === cardId) {
      resetForm();
      setShowAddForm(false);
    }

    if (activeStudyCardId === cardId) {
      setActiveStudyCardId(null);
      setShowStudyAnswer(false);
    }

    setDeletingCardId(null);
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
          <p className="text-sm font-semibold text-stone-800">Room memo</p>
          <p className="mt-1 text-sm leading-6 text-stone-500">
            Write what this room is for, what you are practicing, or the next
            call theme.
          </p>

          <textarea
            value={roomMemo}
            onChange={(event) => setRoomMemo(event.target.value)}
            className="mt-4 min-h-28 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-stone-400"
            placeholder="Example: Glenn Japanese basics / daily phrases / next call: greetings and food."
          />

          <button
            onClick={saveRoomMemo}
            disabled={isSavingMemo}
            className="mt-4 w-full rounded-2xl bg-stone-100 px-4 py-3 text-base font-semibold text-stone-900 disabled:opacity-50"
          >
            {isSavingMemo ? "Saving..." : "Save memo"}
          </button>

          {memoMessage ? (
            <p className="mt-3 text-center text-sm text-stone-600">
              {memoMessage}
            </p>
          ) : null}
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold text-stone-800">Study Mode</p>
          <p className="mt-1 text-sm leading-6 text-stone-500">
            Pick a random saved card and review it like a flashcard.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1">
            <button
              onClick={() => {
                setStudyLanguage("ja");
                setActiveStudyCardId(null);
                setShowStudyAnswer(false);
              }}
              className={
                studyLanguage === "ja"
                  ? "rounded-xl bg-white px-3 py-2 text-sm font-semibold text-stone-900 shadow-sm"
                  : "rounded-xl px-3 py-2 text-sm font-semibold text-stone-500"
              }
            >
              JA Review
            </button>
            <button
              onClick={() => {
                setStudyLanguage("en");
                setActiveStudyCardId(null);
                setShowStudyAnswer(false);
              }}
              className={
                studyLanguage === "en"
                  ? "rounded-xl bg-white px-3 py-2 text-sm font-semibold text-stone-900 shadow-sm"
                  : "rounded-xl px-3 py-2 text-sm font-semibold text-stone-500"
              }
            >
              EN Review
            </button>
          </div>

          <div className="mt-4 rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                {studyLanguage === "ja" ? "JA cards" : "EN cards"} ·{" "}
                {currentStudyCards.length}
              </p>

              {activeStudyCard ? (
                <button
                  onClick={() =>
                    updateCardStatus(
                      activeStudyCard.id,
                      activeStudyCard.status
                    )
                  }
                  className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600"
                >
                  {activeStudyCard.status}
                </button>
              ) : null}
            </div>

            {!activeStudyCard ? (
              <div className="mt-4">
                <p className="text-sm leading-6 text-stone-500">
                  Press Start random to begin.
                </p>
                <button
                  onClick={() => pickRandomStudyCard(studyLanguage)}
                  disabled={currentStudyCards.length === 0}
                  className="mt-4 w-full rounded-2xl bg-stone-900 px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
                >
                  Start random
                </button>
              </div>
            ) : null}

            {activeStudyCard && activeStudyCard.card_type === "japanese" ? (
              <div className="mt-4">
                {activeStudyCard.japanese_text ? (
                  <KanaRomajiLine text={activeStudyCard.japanese_text} />
                ) : null}

                {showStudyAnswer ? (
                  <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
                    {activeStudyCard.english_meaning ? (
                      <p className="text-base font-semibold text-stone-900">
                        {activeStudyCard.english_meaning}
                      </p>
                    ) : null}

                    {activeStudyCard.pronunciation_note ? (
                      <p className="mt-3 text-sm leading-6 text-stone-500">
                        {activeStudyCard.pronunciation_note}
                      </p>
                    ) : null}

                    {activeStudyCard.usage_note ? (
                      <p className="mt-3 text-sm leading-6 text-stone-500">
                        {activeStudyCard.usage_note}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeStudyCard && activeStudyCard.card_type === "english" ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Japanese intent
                </p>

                {activeStudyCard.japanese_intent ? (
                  <p className="mt-2 text-base leading-7 text-stone-700">
                    {activeStudyCard.japanese_intent}
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-stone-500">
                    No Japanese intent saved.
                  </p>
                )}

                {showStudyAnswer ? (
                  <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
                    {activeStudyCard.natural_english ? (
                      <p className="text-xl font-bold leading-8 text-stone-900">
                        {activeStudyCard.natural_english}
                      </p>
                    ) : null}

                    {activeStudyCard.casual_english ? (
                      <p className="mt-4 rounded-2xl bg-stone-100 px-4 py-3 text-base font-semibold leading-7 text-stone-800">
                        {activeStudyCard.casual_english}
                      </p>
                    ) : null}

                    {activeStudyCard.pronunciation_chunks ? (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                          Chunks
                        </p>
                        <p className="mt-1 text-sm leading-6 text-stone-600">
                          {activeStudyCard.pronunciation_chunks}
                        </p>
                      </div>
                    ) : null}

                    {activeStudyCard.meaning_note ? (
                      <p className="mt-3 text-sm leading-6 text-stone-500">
                        {activeStudyCard.meaning_note}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeStudyCard ? (
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowStudyAnswer((current) => !current)}
                  className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-900"
                >
                  {showStudyAnswer ? "Hide answer" : "Show answer"}
                </button>

                <button
                  onClick={() => pickRandomStudyCard(studyLanguage)}
                  className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white"
                >
                  Next random
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-800">Cards</p>
              <p className="mt-1 text-sm text-stone-500">
                {filteredCards.length} shown / {cards.length} total
              </p>
            </div>

            <button
              onClick={() => {
                if (showAddForm) {
                  closeForm();
                } else {
                  openCreateForm();
                }
              }}
              className="rounded-2xl bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-800"
            >
              {showAddForm ? "Close" : "Add"}
            </button>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Language
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <FilterButton
                active={languageFilter === "all"}
                onClick={() => setLanguageFilter("all")}
              >
                All
              </FilterButton>
              <FilterButton
                active={languageFilter === "ja"}
                onClick={() => setLanguageFilter("ja")}
              >
                JA
              </FilterButton>
              <FilterButton
                active={languageFilter === "en"}
                onClick={() => setLanguageFilter("en")}
              >
                EN
              </FilterButton>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Status
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <FilterButton
                active={statusFilter === "all"}
                onClick={() => setStatusFilter("all")}
              >
                All
              </FilterButton>
              <FilterButton
                active={statusFilter === "new"}
                onClick={() => setStatusFilter("new")}
              >
                New
              </FilterButton>
              <FilterButton
                active={statusFilter === "practicing"}
                onClick={() => setStatusFilter("practicing")}
              >
                Practicing
              </FilterButton>
              <FilterButton
                active={statusFilter === "learned"}
                onClick={() => setStatusFilter("learned")}
              >
                Learned
              </FilterButton>
            </div>
          </div>
        </section>

        {showAddForm ? (
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-800">
                  {editingCardId ? "Edit Card" : "Add Card"}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {editingCardId
                    ? "Update this saved phrase card."
                    : "Save phrases for Japanese and English practice."}
                </p>
              </div>

              {editingCardId ? (
                <button
                  onClick={closeForm}
                  className="rounded-2xl bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-800"
                >
                  Cancel
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1">
              <button
                onClick={() => {
                  if (editingCardId) return;
                  setCardMode("japanese");
                  setErrorMessage("");
                }}
                className={
                  cardMode === "japanese"
                    ? "rounded-xl bg-white px-3 py-2 text-sm font-semibold text-stone-900 shadow-sm"
                    : "rounded-xl px-3 py-2 text-sm font-semibold text-stone-500"
                }
              >
                JA
              </button>
              <button
                onClick={() => {
                  if (editingCardId) return;
                  setCardMode("english");
                  setErrorMessage("");
                }}
                className={
                  cardMode === "english"
                    ? "rounded-xl bg-white px-3 py-2 text-sm font-semibold text-stone-900 shadow-sm"
                    : "rounded-xl px-3 py-2 text-sm font-semibold text-stone-500"
                }
              >
                EN
              </button>
            </div>

            {editingCardId ? (
              <p className="mt-3 text-xs leading-5 text-stone-500">
                Card language is locked while editing. Delete and recreate the
                card if you need to change JA/EN.
              </p>
            ) : null}

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
                : editingCardId
                  ? "Update card"
                  : cardMode === "japanese"
                    ? "Save JA card"
                    : "Save EN card"}
            </button>
          </section>
        ) : null}

        <div className="flex flex-col gap-4">
          {filteredCards.map((card) => (
            <article
              key={card.id}
              className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  {getCardLabel(card.card_type)}
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

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => startEditingCard(card)}
                  className="rounded-2xl bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-800"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteCard(card.id)}
                  disabled={deletingCardId === card.id}
                  className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                >
                  {deletingCardId === card.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}

          {filteredCards.length === 0 ? (
            <section className="rounded-3xl bg-white p-5 text-center shadow-sm ring-1 ring-stone-200">
              <p className="text-sm font-semibold text-stone-700">
                No cards found
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Change the filters or add a new card.
              </p>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}