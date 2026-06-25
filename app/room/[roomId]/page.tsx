export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-900">
      <div className="mx-auto max-w-md">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-medium text-stone-500">Shared room</p>
          <h1 className="mt-2 text-2xl font-bold">TalkBridge Room</h1>
          <p className="mt-3 break-all text-xs text-stone-500">{roomId}</p>
        </section>

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold text-stone-800">Cards</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Card saving will be added next. This room URL is already unique and shareable.
          </p>
        </section>
      </div>
    </main>
  );
}