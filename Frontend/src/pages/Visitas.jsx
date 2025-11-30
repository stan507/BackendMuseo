import { useNavigate } from 'react-router-dom';

export default function Visitas() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Visitas</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ← Volver
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-600">Módulo de visitas en construcción...</p>
      </main>
    </div>
  );
}
