import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function MinIO() {
  const navigate = useNavigate();
  const [exhibiciones, setExhibiciones] = useState([]);
  const [exhibicionSeleccionada, setExhibicionSeleccionada] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    cargarExhibiciones();
  }, []);

  useEffect(() => {
    if (exhibicionSeleccionada) {
      cargarArchivos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exhibicionSeleccionada]);

  const cargarExhibiciones = async () => {
    try {
      const response = await api.get('/exhibicion');
      setExhibiciones(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar exhibiciones:', error);
      alert('Error al cargar exhibiciones');
    }
  };

  const cargarArchivos = async () => {
    if (!exhibicionSeleccionada) {
      setArchivos([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/museo/list-files', {
        params: { prefix: exhibicionSeleccionada }
      });
      setArchivos(response.data.files || []);
    } catch (error) {
      console.error('Error al cargar archivos:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      alert(`Error al cargar archivos de MinIO: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!archivoSeleccionado) {
      alert('Selecciona un archivo primero');
      return;
    }

    if (!exhibicionSeleccionada) {
      alert('Selecciona una exhibición primero');
      return;
    }

    const formData = new FormData();
    formData.append('file', archivoSeleccionado);
    formData.append('prefix', exhibicionSeleccionada);

    setLoading(true);
    setUploadProgress(0);

    try {
      await api.post('/museo/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      alert('Archivo subido exitosamente');
      setArchivoSeleccionado(null);
      setUploadProgress(0);
      cargarArchivos();
    } catch (error) {
      console.error('Error al subir archivo:', error);
      alert('Error al subir archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileName) => {
    if (!confirm(`¿Eliminar ${fileName}?`)) return;

    setLoading(true);
    try {
      await api.delete('/museo/file', {
        params: { objectName: fileName }
      });
      alert('Archivo eliminado');
      cargarArchivos();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar archivo');
    } finally {
      setLoading(false);
    }
  };

  const obtenerUrl = async (fileName) => {
    try {
      const response = await api.get('/museo/presigned-url', {
        params: { objectName: fileName }
      });
      window.open(response.data.url, '_blank');
    } catch (error) {
      console.error('Error al obtener URL:', error);
      alert('Error al obtener URL del archivo');
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-md border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Gestor de Archivos MinIO</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ← Volver
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Panel de Carga */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Gestionar Archivos por Exhibición</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Exhibición
              </label>
              <select
                value={exhibicionSeleccionada}
                onChange={(e) => setExhibicionSeleccionada(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Selecciona una exhibición --</option>
                {exhibiciones.map((exhib) => (
                  <option key={exhib.id} value={exhib.nombre_carpeta}>
                    {exhib.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo
              </label>
              <input
                type="file"
                onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={loading || !archivoSeleccionado || !exhibicionSeleccionada}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Subiendo...' : 'Subir Archivo'}
            </button>
            
            {!exhibicionSeleccionada && (
              <p className="text-sm text-gray-500 text-center">
                Selecciona una exhibición para gestionar sus archivos
              </p>
            )}
          </div>
        </div>

        {/* Lista de Archivos */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Archivos en MinIO</h2>
            <button
              onClick={cargarArchivos}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Actualizar
            </button>
          </div>

          {!exhibicionSeleccionada && (
            <p className="text-gray-500 text-center py-8">
              Selecciona una exhibición para ver sus archivos
            </p>
          )}

          {exhibicionSeleccionada && loading && (
            <p className="text-gray-500">Cargando archivos de {exhibicionSeleccionada}...</p>
          )}

          {exhibicionSeleccionada && !loading && archivos.length === 0 && (
            <p className="text-gray-500">No hay archivos en esta exhibición</p>
          )}

          {!loading && archivos.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamaño</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {archivos.map((archivo, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{archivo.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatBytes(archivo.size)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(archivo.lastModified).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm space-x-2">
                        <button
                          onClick={() => obtenerUrl(archivo.name)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleDelete(archivo.name)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
