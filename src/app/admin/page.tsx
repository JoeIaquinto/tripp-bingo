import Link from "next/link";
import { getServerAuthSession } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function Admin() {
  const session = await getServerAuthSession();
  if (!session?.user) return null;
  if (session?.user?.role !== "admin") return null;

  const squares = await api.bingoBoard.list.query();

  return (
    <main className="">
      <div className="flex flex-row items-center">
        <h1 className="flex-grow text-4xl font-bold text-center">Tripp Tracy Bingo</h1>
        <div className="self-center">
          <Link
            href={session ? "/api/auth/signout" : "/api/auth/signin"}
            className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
          >
            {session ? "Sign out" : "Sign in"}
          </Link>
        </div>
      </div>
      
      <ul>
        {squares.map((square) => (
          <li key={square.id}>
            <span>({square.id}) {square.content}</span>
          </li>
        ))}
      </ul>
      
    </main>
  );
}