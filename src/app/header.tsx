import Link from "next/link";
import { getServerAuthSession } from "~/server/auth";
import Image from "next/image";
import { ModeToggle } from "./_components/ui/dark-toggle";

export default async function Header() {
  const session = await getServerAuthSession();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2x1 items-center">
        <div className="flex">
          <Link href="/" className="flex flex-row items-center space-x-2">
            <Image
              src="/logo.png"
              alt="Tripp Tracy Bingo Logo"
              width={24}
              height={24}
               />
            <span className="hidden font-bold sm:inline-block text-sm md:text-lg">Bingorts</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center space-x-2 justify-end">
          {
            session?.user?.role === "admin" ? (
              <Link href="/admin" className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20 text-sm md:text-md">
                Admin
              </Link>
            ) : null
          }
          {
            session ? (
              <Link href="/game/create" className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20 text-sm md:text-md">
                New Game
              </Link>
            ) : null
          }
          <Link
            href={session ? "/api/auth/signout" : "/api/auth/signin"}
            className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20 text-sm md:text-md"
          >
            {session ? "Sign out" : "Sign in"}
          </Link>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
