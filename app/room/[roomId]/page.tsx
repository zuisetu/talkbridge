"use client";

import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Room = {
  id: string;
  name: string;
};

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    async function loadRoom() {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name")
        .eq("id", roomId)
        .single();

      if (error) {
        console.error(error);
      }

      setRoom(data);
      setIsLoading(false);
    }

    if (roomId) {
      loadRoom();
    }
  }, [roomId]);

  async function copyRoomLink() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopyMessage("Room link copied");
    setTimeout(() => setCopyMessage(""), 2000);
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

            <button className="rounded-2xl bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-800">
              Add
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}