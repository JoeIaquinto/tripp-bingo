import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import { getServerAuthSession } from "~/server/auth";
import { api } from "~/trpc/server";
import GetBoard from "./_components/get-board";

export default async function Home() {
  noStore();
  const session = await getServerAuthSession();

  return (
    <main className="">
      <div className="flex flex-row items-center">
        <h1 className="flex-grow text-4xl font-bold text-center">Tripp Tracy Bingo</h1>
        <div className="self-center flex-grow-0">
          <Link
            href={session ? "/api/auth/signout" : "/api/auth/signin"}
            className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
          >
            {session ? "Sign out" : "Sign in"}
          </Link>
        </div>
      </div>
      
      <Board />
    </main>
  );
}

async function Board() {
  const session = await getServerAuthSession();
  if (!session?.user) return null;

  return (
    <div className="">
      <GetBoard />
    </div>
  );
}
