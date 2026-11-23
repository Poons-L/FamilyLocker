// The interactive demo family lives as a self-contained page (copied from /demo/index.html).
import { redirect } from 'next/navigation';

export default function Demo() {
  redirect('/family-demo.html');
}
