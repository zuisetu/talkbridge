"use client";

import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("TalkBridge Room");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function createRoom() {
    setIsCreating(true);
    setErrorMessage("");

    const roomId = nanoid(32);
    const name = roomName.trim() || "TalkBridge Room";

    const { error } = await supabase.from("rooms").insert({
      id: roomId,
      name,
    });

    if (error) {
      console.error(error);
      setErrorMessage("Failed to create room. Please try again.");
      setIsCreating(false);
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
          <label className="text-sm font-semibold text-stone-700">
            Room name
          </label>

          <input
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-stone-400"
            placeholder="TalkBridge Room"
          />

          {errorMessage ? (
            <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
          ) : null}

          <button
            onClick={createRoom}
            disabled={isCreating}
            className="mt-4 w-full rounded-2xl bg-stone-900 px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create shared room"}
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