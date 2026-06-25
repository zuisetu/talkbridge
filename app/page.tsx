"use client";

import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useState } from "react";

function extractRoomId(input: string) {
  const value = input.trim();

  if (!value) return "";

  if (value.includes("/room/")) {
    const afterRoom = value.split("/room/")[1];
    return afterRoom?.split("?")[0]?.split("#")[0]?.trim() ?? "";
  }

  return value;
}

export default function Home() {
  const router = useRouter();

  const [roomName, setRoomName] = useState("TalkBridge Room");
  const [existingRoomInput, setExistingRoomInput] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const [createErrorMessage, setCreateErrorMessage] = useState("");
  const [openErrorMessage, setOpenErrorMessage] = useState("");

  async function createRoom() {
    setIsCreating(true);
    setCreateErrorMessage("");

    const roomId = nanoid(32);
    const name = roomName.trim() || "TalkBridge Room";

    const { error } = await supabase.from("rooms").insert({
      id: roomId,
      name,
    });

    if (error) {
      console.error(error);
      setCreateErrorMessage("Failed to create room. Please try again.");
      setIsCreating(false);
      return;
    }

    router.push(`/room/${roomId}`);
  }

  async function openExistingRoom() {
    setIsOpening(true);
    setOpenErrorMessage("");

    const roomId = extractRoomId(existingRoomInput);

    if (!roomId) {
      setOpenErrorMessage("Please enter a room URL or room ID.");
      setIsOpening(false);
      return;
    }

    const { data, error } = await supabase
      .from("rooms")
      .select("id")
      .eq("id", roomId)
      .single();

    if (error || !data) {
      console.error(error);
      setOpenErrorMessage("Room not found. Please check the URL or room ID.");
      setIsOpening(false);
      return;
    }

    router.push(`/room/${roomId}`);
  }

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-900">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-medium text-stone-500">
            Japanese / English shared phrase notebook
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">TalkBridge</h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            A shared room for Glenn and me to save Japanese and English phrases
            for video call practice.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold text-stone-800">
            Create a new room
          </p>

          <label className="mt-4 block text-sm font-semibold text-stone-700">
            Room name
          </label>
          <input
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-stone-400"
            placeholder="TalkBridge Room"
          />

          {createErrorMessage ? (
            <p className="mt-3 text-sm text-red-600">{createErrorMessage}</p>
          ) : null}

          <button
            onClick={createRoom}
            disabled={isCreating}
            className="mt-4 w-full rounded-2xl bg-stone-900 px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create shared room"}
          </button>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold text-stone-800">
            Open existing room
          </p>
          <p className="mt-1 text-sm leading-6 text-stone-500">
            Paste a room URL or room ID to continue using the same notebook.
          </p>

          <label className="mt-4 block text-sm font-semibold text-stone-700">
            Room URL or room ID
          </label>
          <textarea
            value={existingRoomInput}
            onChange={(event) => setExistingRoomInput(event.target.value)}
            className="mt-2 min-h-24 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-stone-400"
            placeholder="https://talkbridge-ashy.vercel.app/room/pP41vCbbjxm_ORHeK_ISc3Gqz9mDEHw5"
          />

          {openErrorMessage ? (
            <p className="mt-3 text-sm text-red-600">{openErrorMessage}</p>
          ) : null}

          <button
            onClick={openExistingRoom}
            disabled={isOpening}
            className="mt-4 w-full rounded-2xl bg-stone-100 px-4 py-3 text-base font-semibold text-stone-900 disabled:opacity-50"
          >
            {isOpening ? "Opening..." : "Open room"}
          </button>
        </section>

        <section className="rounded-3xl bg-white p-5 text-sm leading-6 text-stone-600 shadow-sm ring-1 ring-stone-200">
          <p className="font-semibold text-stone-800">How it works</p>
          <p className="mt-2">
            Create a room, copy the room URL, and send it through WhatsApp.
            Anyone with the link can open the same phrase notebook.
          </p>
        </section>
      </div>
    </main>
  );
}