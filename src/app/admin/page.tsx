
import Link from "next/link";
import Header from "../header";

export default async function Page() {
  return (
    <main className="">
      <Header />
      <div className="flex flex-col space-y-6 gap-4 ml-4 mb-4">
        <Link href="/admin/games">
          Games
        </Link>
        <Link href="/admin/squares">
          <span>Bingo Squares</span>
        </Link>
        <Link href="/admin/bingo-patterns">
          <span>Bingo Patterns</span>
        </Link>
      </div>
    </main>
  )
}