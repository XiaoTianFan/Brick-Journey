export default async function HoldPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  
  return (
    <div>
      <h1>Hold Page for {city}</h1>
    </div>
  );
} 