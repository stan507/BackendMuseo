import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function MinIO() {
  const navigate = useNavigate();
  const [exhibiciones, setExhibiciones] = useState([]);
  const [exhibicionSeleccionada, setExhibicionSeleccionada] = useState('');
  const [tipoArchivo, setTipoArchivo] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const tiposArchivo = [
    { value: 'videos', label: 'Videos', extensiones: ['.mp4', '.webm'] },
    { value: 'fotos', label: 'Fotos', extensiones: ['.jpg', '.jpeg', '.png'] },
    { value: 'audios', label: 'Audios', extensiones: ['.mp3'] },
    { value: 'modelo3D', label: 'Modelos 3D', extensiones: ['.gltf', '.glb', '.bin'] },
    { value: 'textura', label: 'Texturas', extensiones: ['.jpg', '.jpeg', '.png'] }
  ];

  const obtenerExtensionesPermitidas = () => {
    const tipo = tiposArchivo.find(t => t.value === tipoArchivo);
    return tipo ? tipo.extensiones : [];
  };

  const validarExtension = (archivo) => {
    if (!archivo || !tipoArchivo) return false;
    const extension = '.' + archivo.name.toLowerCase().split('.').pop();
    const tipo = tiposArchivo.find(t => t.value === tipoArchivo);
    return tipo ? tipo.extensiones.includes(extension) : false;
  };

  const validarNombreArchivo = (nombreArchivo) => {
    // Caracteres problemáticos para MinIO, Unity y URLs
    const caracteresProblematicos = /[^a-zA-Z0-9._-]/g;
    const caracteresEncontrados = nombreArchivo.match(caracteresProblematicos);
    
    if (caracteresEncontrados) {
      return {
        valido: false,
        mensaje: `El nombre contiene caracteres no permitidos: ${[...new Set(caracteresEncontrados)].join(', ')}\n\nSolo se permiten: letras, números, guiones (-), guiones bajos (_) y puntos (.)`
      };
    }

    // Validar que no empiece con punto o guion
    if (nombreArchivo.startsWith('.') || nombreArchivo.startsWith('-')) {
      return {
        valido: false,
        mensaje: 'El nombre no puede comenzar con punto (.) o guion (-)'
      };
    }

    // Validar longitud
    if (nombreArchivo.length > 200) {
      return {
        valido: false,
        mensaje: 'El nombre es demasiado largo (máximo 200 caracteres)'
      };
    }

    return { valido: true };
  };

  const sanitizarNombreArchivo = (nombreArchivo) => {
    // Reemplazar espacios con guiones bajos
    let nombreLimpio = nombreArchivo.replace(/\s+/g, '_');
    
    // Eliminar caracteres problemáticos
    nombreLimpio = nombreLimpio.replace(/[^a-zA-Z0-9._-]/g, '');
    
    // Eliminar múltiples guiones/puntos consecutivos
    nombreLimpio = nombreLimpio.replace(/[-_.]{2,}/g, '_');
    
    return nombreLimpio;
  };

  useEffect(() => {
    cargarExhibiciones();
  }, []);

  useEffect(() => {
    if (exhibicionSeleccionada && tipoArchivo) {
      cargarArchivos();
    } else {
      setArchivos([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exhibicionSeleccionada, tipoArchivo]);

  const cargarExhibiciones = async () => {
    try {
      const response = await api.get('/exhibicion');
      setExhibiciones(response.data.data || []);
    } catch {
      alert('Error al cargar exhibiciones');
    }
  };

  const cargarArchivos = async () => {
    if (!exhibicionSeleccionada || !tipoArchivo) {
      setArchivos([]);
      return;
    }

    setLoading(true);
    try {
      const prefix = `${exhibicionSeleccionada}/${tipoArchivo}/`;
      
      const response = await api.get('/museo/list-files', {
        params: { prefix }
      });
      
      setArchivos(response.data.files || []);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      const statusCode = error.response?.status;
      
      let mensajeUsuario = `❌ Error al cargar archivos:\n${errorMsg}`;
      
      if (statusCode === 400) {
        mensajeUsuario = `❌ Petición inválida: ${errorMsg}`;
      } else if (statusCode === 401) {
        mensajeUsuario = '❌ No autorizado. Inicia sesión nuevamente.';
      } else if (statusCode === 500) {
        mensajeUsuario = `❌ Error del servidor:\n${errorMsg}\n\nVerifica que MinIO esté corriendo y configurado correctamente.`;
      }
      
      alert(mensajeUsuario);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!archivoSeleccionado) {
      alert('Selecciona uno o más archivos primero');
      return;
    }

    if (!exhibicionSeleccionada || !tipoArchivo) {
      alert('Selecciona una exhibición y tipo de archivo primero');
      return;
    }

    // Preparar lista de archivos (soportar FileList o File único)
    const archivos = archivoSeleccionado instanceof FileList 
      ? Array.from(archivoSeleccionado)
      : [archivoSeleccionado];

    // Validar todos los archivos antes de subir
    const archivosValidados = [];
    
    for (const archivo of archivos) {
      // Validar extensión
      if (!validarExtension(archivo)) {
        const tipo = tiposArchivo.find(t => t.value === tipoArchivo);
        alert(`❌ "${archivo.name}" no es válido para ${tipo.label}\n\nExtensiones permitidas: ${tipo.extensiones.join(', ')}`);
        return;
      }

      // Validar nombre de archivo
      const validacionNombre = validarNombreArchivo(archivo.name);
      if (!validacionNombre.valido) {
        const nombreSanitizado = sanitizarNombreArchivo(archivo.name);
        const confirmar = window.confirm(
          `❌ "${archivo.name}": ${validacionNombre.mensaje}\n\n` +
          `Nombre sugerido: ${nombreSanitizado}\n\n` +
          `¿Deseas subir este archivo con el nombre corregido?`
        );
        
        if (!confirmar) {
          return;
        }
        
        // Crear nuevo archivo con nombre sanitizado
        const archivoCorregido = new File([archivo], nombreSanitizado, {
          type: archivo.type
        });
        archivosValidados.push(archivoCorregido);
      } else {
        archivosValidados.push(archivo);
      }
    }

    await subirArchivos(archivosValidados);
  };

  const subirArchivos = async (archivos) => {
    const formData = new FormData();
    
    // Agregar todos los archivos con el campo 'files' (array)
    archivos.forEach(archivo => {
      formData.append('files', archivo);
    });
    
    formData.append('subcarpeta', exhibicionSeleccionada);
    formData.append('tipo', tipoArchivo);

    setLoading(true);
    setUploadProgress(0);

    try {
      const response = await api.post('/museo/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      const mensaje = response.data.message || `✅ ${archivos.length} archivo(s) subido(s)`;
      
      if (response.data.errores && response.data.errores.length > 0) {
        alert(`⚠️ ${mensaje}\n\nErrores:\n${response.data.errores.map(e => `- ${e.archivo}: ${e.error}`).join('\n')}`);
      } else {
        alert(mensaje);
      }
      
      setArchivoSeleccionado(null);
      setUploadProgress(0);
      cargarArchivos();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
      alert(`❌ Error al subir archivos:\n${errorMsg}`);
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
      alert('Error al eliminar archivo');
    } finally {
      setLoading(false);
    }
  };

  const verArchivo = async (fileName) => {
    try {
      const response = await api.get('/museo/presigned-url', {
        params: { object: fileName }
      });
      // Abrir en nueva pestaña para visualizar
      window.open(response.data.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error al obtener URL:', error);
      const errorMsg = error.response?.data?.error || error.message;
      alert(`Error al obtener URL del archivo:\n${errorMsg}`);
    }
  };

  const descargarArchivo = async (fileName) => {
    try {
      const response = await api.get('/museo/presigned-url', {
        params: { object: fileName }
      });
      
      // Descargar usando fetch para forzar descarga
      const urlDescarga = response.data.url;
      const respuestaArchivo = await fetch(urlDescarga);
      const blob = await respuestaArchivo.blob();
      
      // Crear enlace temporal para descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.split('/').pop();
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      const errorMsg = error.response?.data?.error || error.message;
      alert(`Error al descargar archivo:\n${errorMsg}`);
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
                  <option key={exhib.id_exhibicion} value={exhib.id_exhibicion}>
                    {exhib.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Archivo
              </label>
              <select
                value={tipoArchivo}
                onChange={(e) => setTipoArchivo(e.target.value)}
                disabled={!exhibicionSeleccionada}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Selecciona tipo de archivo --</option>
                {tiposArchivo.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label} ({tipo.extensiones.join(', ')})
                  </option>
                ))}
              </select>
              {tipoArchivo && (
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceptados: {tiposArchivo.find(t => t.value === tipoArchivo)?.extensiones.join(', ')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo(s) - Selección Múltiple
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => setArchivoSeleccionado(e.target.files)}
                disabled={!exhibicionSeleccionada || !tipoArchivo}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {archivoSeleccionado && archivoSeleccionado.length > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  {archivoSeleccionado.length} archivo(s) seleccionado(s)
                </p>
              )}
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
              disabled={loading || !archivoSeleccionado || archivoSeleccionado.length === 0 || !exhibicionSeleccionada || !tipoArchivo}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Subiendo...' : archivoSeleccionado && archivoSeleccionado.length > 1 ? `Subir ${archivoSeleccionado.length} Archivos` : 'Subir Archivo(s)'}
            </button>
            
            {!exhibicionSeleccionada && (
              <p className="text-sm text-gray-500 text-center">
                Selecciona una exhibición y tipo de archivo para comenzar
              </p>
            )}
            {exhibicionSeleccionada && !tipoArchivo && (
              <p className="text-sm text-gray-500 text-center">
                Selecciona el tipo de archivo (videos, fotos, etc.)
              </p>
            )}
          </div>
        </div>

        {/* Lista de Archivos */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Archivos en MinIO</h2>
              {exhibicionSeleccionada && tipoArchivo && (
                <p className="text-sm text-gray-500 mt-1">
                  💡 Doble clic en un archivo para descargarlo
                </p>
              )}
            </div>
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
              Selecciona una exhibición y tipo de archivo para ver los archivos
            </p>
          )}

          {exhibicionSeleccionada && !tipoArchivo && (
            <p className="text-gray-500 text-center py-8">
              Selecciona un tipo de archivo para continuar
            </p>
          )}

          {exhibicionSeleccionada && tipoArchivo && loading && (
            <p className="text-gray-500">Cargando {tipoArchivo} de {exhibicionSeleccionada}...</p>
          )}

          {exhibicionSeleccionada && tipoArchivo && !loading && archivos.length === 0 && (
            <p className="text-gray-500">No hay archivos en {exhibicionSeleccionada}/{tipoArchivo}</p>
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
                    <tr 
                      key={idx} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onDoubleClick={() => descargarArchivo(archivo.name)}
                      title="Doble clic para descargar"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">{archivo.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatBytes(archivo.size)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(archivo.lastModified).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            verArchivo(archivo.name);
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          title="Abrir en nueva pestaña"
                        >
                          👁️ Ver
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(archivo.name);
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          title="Eliminar archivo"
                        >
                          🗑️ Eliminar
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
