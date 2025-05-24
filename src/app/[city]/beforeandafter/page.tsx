export default async function BeforeAndAfterPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  
  return (
    <div>
      <h1>Before and After Page for {city}</h1>
    </div>
  );
} 