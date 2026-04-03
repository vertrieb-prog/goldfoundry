export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gold-400 mb-4">404</h1>
        <p className="text-gray-400">Seite nicht gefunden.</p>
        <a href="https://goldfoundry.de" className="text-gold-400 hover:underline mt-4 inline-block">
          Zurück zu Gold Foundry
        </a>
      </div>
    </div>
  );
}
