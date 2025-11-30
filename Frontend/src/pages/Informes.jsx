import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Informes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    desde: '',
    hasta: ''
  });
  const [estadisticas, setEstadisticas] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [quizSeleccionado, setQuizSeleccionado] = useState('');
  const [analisisQuiz, setAnalisisQuiz] = useState(null);
  const [quizzesParaPDF, setQuizzesParaPDF] = useState([]);

  // Función para establecer presets de fecha
  const aplicarPreset = (preset) => {
    const hoy = new Date();
    let desde = new Date();
    
    switch(preset) {
      case 'hoy':
        desde = new Date(hoy.setHours(0, 0, 0, 0));
        break;
      case 'semana':
        desde = new Date(hoy.setDate(hoy.getDate() - 7));
        break;
      case 'mes':
        desde = new Date(hoy.setMonth(hoy.getMonth() - 1));
        break;
      case 'anio':
        desde = new Date(hoy.setFullYear(hoy.getFullYear() - 1));
        break;
      default:
        desde = new Date();
    }

    setFiltros({
      desde: desde.toISOString().split('T')[0],
      hasta: new Date().toISOString().split('T')[0]
    });
  };

  // Cargar lista de quizzes al montar el componente
  useEffect(() => {
    const cargarQuizzes = async () => {
      try {
        const response = await api.get('/quizz');
        // El backend puede devolver response.data directamente o response.data.data
        const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        setQuizzes(data);
      } catch (error) {
        console.error('Error al cargar quizzes:', error);
        setQuizzes([]); // Asegurar que sea array vacío en caso de error
      }
    };
    cargarQuizzes();
  }, []);

  // Función para cargar estadísticas
  const cargarEstadisticas = async () => {
    if (!filtros.desde || !filtros.hasta) {
      alert('Selecciona un rango de fechas');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/visita/estadisticas', {
        params: {
          desde: filtros.desde,
          hasta: filtros.hasta
        }
      });

      setEstadisticas(response.data.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      alert('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar análisis de un quiz específico
  const cargarAnalisisQuiz = async (idQuiz) => {
    if (!idQuiz) {
      setAnalisisQuiz(null);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/visita/analisis-quiz/${idQuiz}`);
      setAnalisisQuiz(response.data.data);
    } catch (error) {
      console.error('Error al cargar análisis del quiz:', error);
      alert('Error al cargar análisis del quiz');
    } finally {
      setLoading(false);
    }
  };

  // Función para descargar PDF
  const descargarPDF = async () => {
    if (!filtros.desde || !filtros.hasta) {
      alert('Selecciona un rango de fechas');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/informe/pdf', {
        params: {
          desde: filtros.desde,
          hasta: filtros.hasta,
          quizzes: quizzesParaPDF.join(',')
        },
        responseType: 'blob'
      });

      // Crear blob y descargar
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `informe-museo-${filtros.desde}-${filtros.hasta}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-md border-b-4 border-purple-600">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            📊 Informes y Estadísticas
          </h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ← Volver
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Panel de Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📅 Selecciona el Periodo</h2>
          
          {/* Presets rápidos */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => aplicarPreset('hoy')}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium transition"
            >
              📆 Hoy
            </button>
            <button
              onClick={() => aplicarPreset('semana')}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition"
            >
              📅 Última Semana
            </button>
            <button
              onClick={() => aplicarPreset('mes')}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium transition"
            >
              📊 Último Mes
            </button>
            <button
              onClick={() => aplicarPreset('anio')}
              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium transition"
            >
              📈 Último Año
            </button>
          </div>

          {/* Filtros personalizados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desde
              </label>
              <input
                type="date"
                value={filtros.desde}
                onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasta
              </label>
              <input
                type="date"
                value={filtros.hasta}
                onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={cargarEstadisticas}
                disabled={loading || !filtros.desde || !filtros.hasta}
                className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Cargando...' : '🔍 Generar Informe'}
              </button>
              <button
                onClick={descargarPDF}
                disabled={loading || !filtros.desde || !filtros.hasta}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                📥 PDF
              </button>
            </div>
          </div>
        </div>

        {/* Área de Estadísticas */}
        {estadisticas && (
          <div className="space-y-6">
            {/* Resumen General */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📊 Resumen General
                <span className="text-sm font-normal text-gray-500">
                  ({filtros.desde} a {filtros.hasta})
                </span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <div className="text-blue-600 text-sm font-medium mb-1">📱 Total de Visitas</div>
                  <div className="text-3xl font-bold text-blue-700 mb-2">{estadisticas.totalVisitas}</div>
                  <div className="text-xs text-blue-600">
                    Número total de personas que visitaron las exhibiciones en este periodo
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <div className="text-green-600 text-sm font-medium mb-1">✅ Completaron Quiz</div>
                  <div className="text-3xl font-bold text-green-700 mb-2">{estadisticas.visitasConQuiz}</div>
                  <div className="text-xs text-green-600">
                    Visitantes que respondieron el quiz interactivo y guardaron sus respuestas
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
                  <div className="text-orange-600 text-sm font-medium mb-1">⏭️ Sin Responder Quiz</div>
                  <div className="text-3xl font-bold text-orange-700 mb-2">{estadisticas.visitasSinQuiz}</div>
                  <div className="text-xs text-orange-600">
                    Visitantes que no respondieron el quiz o solo vieron la exhibición
                  </div>
                </div>
              </div>
            </div>

            {/* Visitas por Exhibición */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🏛️ Visitas por Exhibición</h3>
              <div className="space-y-3">
                {estadisticas.visitasPorExhibicion.map(exhibicion => (
                  <div key={exhibicion.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-700">{exhibicion.nombre}</span>
                      <span className="text-2xl font-bold text-purple-600">{exhibicion.cantidad}</span>
                    </div>
                    {exhibicion.duracion_promedio > 0 && (
                      <div className="text-sm text-gray-600">
                        ⏱️ Duración promedio: {Math.floor(exhibicion.duracion_promedio / 60)} min {exhibicion.duracion_promedio % 60} seg
                      </div>
                    )}
                    {/* Barra de progreso visual */}
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${(exhibicion.cantidad / estadisticas.totalVisitas) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribución de Puntajes de Quizzes */}
            {estadisticas.distribucionPuntajes.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 Distribución de Puntajes</h3>
                <div className="space-y-2">
                  {estadisticas.distribucionPuntajes.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-20 text-right">
                        <span className="font-semibold text-gray-700">{item.puntaje}</span>
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-8 rounded-full flex items-center justify-end pr-3 transition-all"
                          style={{ width: `${(item.cantidad / estadisticas.visitasConQuiz) * 100}%` }}
                        >
                          <span className="text-white font-bold text-sm">{item.cantidad}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visitas por Día */}
            {estadisticas.visitasPorDia.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">📅 Visitas por Día</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-2 px-4 text-gray-700">Fecha</th>
                        <th className="text-right py-2 px-4 text-gray-700">Visitas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estadisticas.visitasPorDia.map((dia, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-4 text-gray-600">
                            {new Date(dia.fecha + 'T00:00:00').toLocaleDateString('es-ES', { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="py-2 px-4 text-right">
                            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                              {dia.cantidad}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Preguntas Más Difíciles */}
            {estadisticas.preguntasDificiles && estadisticas.preguntasDificiles.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">❌ Preguntas con Más Errores</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Las preguntas que más visitantes respondieron incorrectamente
                </p>
                <div className="space-y-3">
                  {estadisticas.preguntasDificiles.map((pregunta, idx) => (
                    <div key={idx} className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-red-600 font-bold text-lg">#{idx + 1}</span>
                            <span className="text-sm text-gray-500">({pregunta.errores} {pregunta.errores === 1 ? 'error' : 'errores'})</span>
                          </div>
                          <p className="text-gray-800">{pregunta.texto}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-lg">
                            {pregunta.errores}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!estadisticas && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Selecciona un periodo para ver las estadísticas
            </h3>
            <p className="text-gray-500">
              Usa los botones de arriba para seleccionar un rango de fechas
            </p>
          </div>
        )}

        {/* Sección de Análisis Detallado por Quiz */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            🎯 Análisis Detallado por Quiz
          </h2>
          <p className="text-gray-600 mb-4">
            Selecciona un quiz para ver el análisis detallado de cada pregunta con los porcentajes de respuesta
          </p>
          
          {/* Selección de Quizzes para PDF */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
              📄 Seleccionar Quizzes para incluir en el PDF
            </h3>
            <p className="text-sm text-blue-600 mb-3">
              Marca los quizzes que deseas incluir en el informe PDF (se incluirá el análisis detallado de cada pregunta)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.isArray(quizzes) && quizzes.length > 0 ? (
                quizzes.map((quiz) => (
                  <label key={quiz.id_quizz} className="flex items-center gap-2 bg-white p-3 rounded-lg border-2 border-gray-200 hover:border-blue-400 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={quizzesParaPDF.includes(quiz.id_quizz)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setQuizzesParaPDF([...quizzesParaPDF, quiz.id_quizz]);
                        } else {
                          setQuizzesParaPDF(quizzesParaPDF.filter(id => id !== quiz.id_quizz));
                        }
                      }}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {quiz.titulo} ({quiz.cant_preguntas}p)
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-gray-500">No hay quizzes disponibles</p>
              )}
            </div>
            {quizzesParaPDF.length > 0 && (
              <p className="text-sm text-blue-700 mt-3 font-medium">
                ✓ {quizzesParaPDF.length} quiz(zes) seleccionado(s) para el PDF
              </p>
            )}
          </div>

          {/* Selector de Quiz */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Quiz
            </label>
            <select
              value={quizSeleccionado}
              onChange={(e) => {
                setQuizSeleccionado(e.target.value);
                cargarAnalisisQuiz(e.target.value);
              }}
              className="w-full md:w-1/2 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
            >
              <option value="">-- Selecciona un Quiz --</option>
              {Array.isArray(quizzes) && quizzes.length > 0 ? (
                quizzes.map((quiz) => (
                  <option key={quiz.id_quizz} value={quiz.id_quizz}>
                    {quiz.titulo} ({quiz.cant_preguntas} preguntas)
                  </option>
                ))
              ) : (
                <option value="" disabled>No hay quizzes disponibles</option>
              )}
            </select>
          </div>

          {/* Resultados del Análisis */}
          {analisisQuiz && (
            <div className="space-y-6">
              {/* Información del Quiz */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-5 border-l-4 border-purple-600">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {analisisQuiz.quiz.exhibicion}
                </h3>
                <div className="flex gap-6 text-gray-700">
                  <div>
                    <span className="font-semibold">Total de Preguntas:</span> {analisisQuiz.quiz.cant_preguntas}
                  </div>
                  <div>
                    <span className="font-semibold">Participantes:</span> {analisisQuiz.total_participantes}
                  </div>
                </div>
              </div>

              {/* Análisis por Pregunta */}
              {analisisQuiz.analisis_preguntas.map((pregunta, idx) => (
                <div key={pregunta.id_pregunta} className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                  <div className="mb-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                          Pregunta {idx + 1}
                        </span>
                        {pregunta.enunciado}
                      </h4>
                      <span className="text-sm text-gray-600 whitespace-nowrap">
                        {pregunta.total_respuestas} respuestas
                      </span>
                    </div>
                  </div>

                  {/* Respuestas con porcentajes */}
                  <div className="space-y-3">
                    {pregunta.respuestas.map((respuesta) => {
                      const esCorrecta = respuesta.es_correcta;
                      const colorBarra = esCorrecta ? 'from-green-400 to-green-600' : 'from-gray-300 to-gray-400';
                      const colorBg = esCorrecta ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200';
                      const iconoCorrecta = esCorrecta ? '✓' : '○';

                      return (
                        <div key={respuesta.id_respuesta} className={`${colorBg} border-2 rounded-lg p-4`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className={`text-xl font-bold ${esCorrecta ? 'text-green-600' : 'text-gray-400'}`}>
                                {iconoCorrecta}
                              </span>
                              <span className={`font-medium ${esCorrecta ? 'text-green-800' : 'text-gray-700'}`}>
                                {respuesta.texto}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">
                                {respuesta.cantidad} respuestas
                              </span>
                              <span className={`text-2xl font-bold ${esCorrecta ? 'text-green-600' : 'text-gray-700'}`}>
                                {respuesta.porcentaje}%
                              </span>
                            </div>
                          </div>

                          {/* Barra de porcentaje */}
                          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className={`bg-gradient-to-r ${colorBarra} h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                              style={{ width: `${respuesta.porcentaje}%` }}
                            >
                              {respuesta.porcentaje > 15 && (
                                <span className="text-white text-xs font-bold">
                                  {respuesta.porcentaje}%
                                </span>
                              )}
                            </div>
                          </div>

                          {esCorrecta && (
                            <div className="mt-2 text-xs text-green-700 font-semibold">
                              ✓ Respuesta Correcta
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!analisisQuiz && !loading && quizSeleccionado && (
            <div className="text-center py-8 text-gray-500">
              Cargando análisis del quiz...
            </div>
          )}

          {!analisisQuiz && !loading && !quizSeleccionado && (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📝</div>
              <p className="text-gray-600">
                Selecciona un quiz del menú desplegable para ver el análisis detallado
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
