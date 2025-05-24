export default function BeforeAndAfterPage({ params }: { params: { city: string } }) {
  return (
    <div>
      <h1>Before and After Page for {params.city}</h1>
    </div>
  );
} 