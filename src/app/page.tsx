import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to holdspiral installation as the landing page
  redirect('/installations/holdspiral');

  return null;
}
