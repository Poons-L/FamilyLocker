import Link from 'next/link';
import { signOut } from './actions';

export function Nav({ household }: { household?: string }) {
  return (
    <nav className="top" aria-label="Main">
      <Link href="/" className="brand">FamilyOS</Link>
      {household && <>
        <Link href="/">Home</Link>
        <Link href="/people">People</Link>
        <Link href="/items/new">Add something</Link>
        <Link href="/find">Find</Link>
      </>}
      <span className="spacer" />
      {household && <Link href="/emergency" className="sos">Something happened</Link>}
      <Link href="/demo">Demo family</Link>
      {household && <form action={signOut}><button className="linkbtn" type="submit">Sign out</button></form>}
    </nav>
  );
}
