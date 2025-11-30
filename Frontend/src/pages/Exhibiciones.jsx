import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Exhibiciones() {
  const navigate = useNavigate();
  const [exhibiciones, setExhibiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExhibicion, setEditingExhibicion] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    relato_escrito: ''
  });

  useEffect(() => {
    cargarExhibiciones();
  }, []);

  const cargarExhibiciones = async () => {
    try {
      const response = await api.get('/exhibicion');
      const data = response.data.data || response.data;
      // Ordenar por id_exhibicion alfabéticamente para mantener orden consistente
      const ordenadas = data.sort((a, b) => a.id_exhibicion.localeCompare(b.id_exhibicion));
      setExhibiciones(ordenadas);
    } catch (error) {
      console.error('Error al cargar exhibiciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/exhibicion/${editingExhibicion.id_exhibicion}`, formData);
      setShowModal(false);
      setEditingExhibicion(null);
      setFormData({ nombre: '', relato_escrito: '' });
      cargarExhibiciones();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Error al actualizar exhibición');
    }
  };

  const openEditModal = (exhibicion) => {
    setEditingExhibicion(exhibicion);
    setFormData({
      nombre: exhibicion.nombre,
      relato_escrito: exhibicion.relato_escrito
    });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Exhibiciones del Museo</h1>
            <p className="text-sm text-gray-600 mt-1">Solo se puede editar el nombre y relato</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ← Volver
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-center text-gray-600">Cargando...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exhibiciones.map((exhibicion) => (
              <div key={exhibicion.id_exhibicion} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {exhibicion.nombre}
                      </h3>
                      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        ID: {exhibicion.id_exhibicion}
                      </span>
                    </div>
                    <button
                      onClick={() => openEditModal(exhibicion)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Editar
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Relato:</h4>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
                      {exhibicion.relato_escrito}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {exhibiciones.length === 0 && !loading && (
          <p className="text-center text-gray-500">No hay exhibiciones registradas</p>
        )}
      </main>

      {/* Modal de Edición */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              Editar Exhibición
            </h2>
            <div className="mb-4 p-3 bg-gray-100 rounded">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">ID:</span> {editingExhibicion?.id_exhibicion}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Exhibición
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Huemul"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relato Escrito
                </label>
                <textarea
                  value={formData.relato_escrito}
                  onChange={(e) => setFormData({...formData, relato_escrito: e.target.value})}
                  required
                  rows="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder="Descripción detallada de la exhibición..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.relato_escrito.length} caracteres
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
