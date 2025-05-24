import { redirect } from 'next/navigation';

const CITIES = ['prague', 'shanghai']; // Add more cities here
const SUBPAGES = ['hold', 'beforeandafter']; // Add more subpages here

export default function Home() {
  const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
  const randomSubpage = SUBPAGES[Math.floor(Math.random() * SUBPAGES.length)];

  redirect(`/${randomCity}/${randomSubpage}`);

  // This part will not be reached because of the redirect
  // but it's good practice to return null or a loading indicator
  // if the redirect was conditional.
  return null;
}
