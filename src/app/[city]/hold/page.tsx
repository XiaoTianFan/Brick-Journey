export default function HoldPage({ params }: { params: { city: string } }) {
  return (
    <div>
      <h1>Hold Page for {params.city}</h1>
    </div>
  );
} 