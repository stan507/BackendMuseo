import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Quizzes() {
  const navigate = useNavigate();
  const [exhibiciones, setExhibiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExhibicion, setExpandedExhibicion] = useState(null);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [exhibicionSeleccionada, setExhibicionSeleccionada] = useState(null);
  const [quizToEdit, setQuizToEdit] = useState(null);
  const [nuevoQuiz, setNuevoQuiz] = useState({
    titulo: '',
    descripcion: '',
    preguntas: [
      {
        texto_pregunta: '',
        respuestas: [
          { texto_respuesta: '', es_correcta: true },
          { texto_respuesta: '', es_correcta: false },
          { texto_respuesta: '', es_correcta: false },
          { texto_respuesta: '', es_correcta: false }
        ]
      }
    ]
  });

  useEffect(() => {
    cargarQuizzesPorExhibicion();
  }, []);

  const cargarQuizzesPorExhibicion = async () => {
    try {
      const respExhibiciones = await api.get('/exhibicion');
      const exhibicionesData = respExhibiciones.data.data || respExhibiciones.data;
      
      // Para cada exhibición, obtenemos todos sus quizzes
      const exhibicionesConQuizzes = await Promise.all(
        exhibicionesData.map(async (exhibicion) => {
          try {
            // Obtener TODOS los quizzes de esta exhibición
            const respQuiz = await api.get(`/quizz/exhibicion/${exhibicion.id_exhibicion}`);
            const quizzes = respQuiz.data.data || respQuiz.data || [];
            
            // Asegurar que quizzes sea un array
            const quizzesArray = Array.isArray(quizzes) ? quizzes : (quizzes ? [quizzes] : []);
            
            return {
              ...exhibicion,
              quizzes: quizzesArray,
              tieneQuiz: quizzesArray.length > 0
            };
          } catch (error) {
            console.error(`Error al cargar quizzes de ${exhibicion.id_exhibicion}:`, error);
            return {
              ...exhibicion,
              quizzes: [],
              tieneQuiz: false
            };
          }
        })
      );

      const ordenadas = exhibicionesConQuizzes.sort((a, b) => 
        a.id_exhibicion.localeCompare(b.id_exhibicion)
      );
      
      setExhibiciones(ordenadas);
    } catch (error) {
      console.error('Error al cargar quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExhibicion = (idExhibicion) => {
    if (expandedExhibicion === idExhibicion) {
      setExpandedExhibicion(null);
      setExpandedQuiz(null);
    } else {
      setExpandedExhibicion(idExhibicion);
      setExpandedQuiz(null);
    }
  };

  const toggleQuiz = (idQuizz) => {
    setExpandedQuiz(expandedQuiz === idQuizz ? null : idQuizz);
  };

  const handleDeleteClick = (quiz, exhibicion) => {
    // Validar que no sea el único quiz de la exhibición
    if (exhibicion.quizzes.length === 1) {
      alert('No puedes eliminar el único quiz de esta exhibición. Debe haber al menos un quiz activo.');
      return;
    }
    setQuizToDelete({ quiz, exhibicion });
    setShowDeleteModal(true);
  };

  const confirmarEliminar = async () => {
    if (!quizToDelete) return;

    try {
      const { quiz, exhibicion } = quizToDelete;
      
      await api.delete(`/quizz/${quiz.id_quizz}`);
      
      // Si el quiz eliminado estaba expandido, colapsar
      if (expandedQuiz === quiz.id_quizz) {
        // Buscar otro quiz en la misma exhibición para expandir
        const otrosQuizzes = exhibicion.quizzes.filter(q => q.id_quizz !== quiz.id_quizz);
        if (otrosQuizzes.length > 0) {
          setExpandedQuiz(otrosQuizzes[0].id_quizz);
        } else {
          setExpandedQuiz(null);
        }
      }

      setShowDeleteModal(false);
      setQuizToDelete(null);
      cargarQuizzesPorExhibicion();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar el quiz');
    }
  };

  const marcarComoActivo = async (quiz) => {
    console.log('Marcando como activo:', quiz.id_quizz);
    
    if (quiz.es_activo) {
      return;
    }

    try {
      console.log('Llamando a PATCH /quizz/' + quiz.id_quizz + '/activar');
      const response = await api.patch(`/quizz/${quiz.id_quizz}/activar`);
      console.log('Respuesta del servidor:', response.data);
      
      console.log('Recargando lista de quizzes...');
      await cargarQuizzesPorExhibicion();
      console.log('Lista recargada');
    } catch (error) {
      console.error('Error al marcar como activo:', error);
      console.error('Detalles:', error.response?.data);
      alert('Error al marcar el quiz como activo');
    }
  };

  const handleEditarClick = (quiz) => {
    // Pre-cargar el formulario con los datos del quiz existente
    setQuizToEdit(quiz);
    setNuevoQuiz({
      titulo: quiz.titulo,
      descripcion: quiz.descripcion || '',
      preguntas: quiz.preguntas.map(pregunta => ({
        texto_pregunta: pregunta.texto,
        respuestas: [
          ...pregunta.respuestas.map(r => ({
            texto_respuesta: r.texto,
            es_correcta: r.es_correcta
          })),
          // Rellenar con respuestas vacías hasta tener 4
          ...Array(Math.max(0, 4 - pregunta.respuestas.length)).fill({
            texto_respuesta: '',
            es_correcta: false
          })
        ]
      }))
    });
    setShowEditModal(true);
  };

  const handleSubmitEditar = async (e) => {
    e.preventDefault();
    
    // Mismas validaciones que crear
    if (!nuevoQuiz.titulo.trim()) {
      alert('El título es obligatorio');
      return;
    }
    
    if (nuevoQuiz.preguntas.length === 0) {
      alert('Debe haber al menos una pregunta');
      return;
    }

    for (let i = 0; i < nuevoQuiz.preguntas.length; i++) {
      const pregunta = nuevoQuiz.preguntas[i];
      if (!pregunta.texto_pregunta.trim()) {
        alert(`La pregunta ${i + 1} no puede estar vacía`);
        return;
      }
      
      const respuestasConTexto = pregunta.respuestas.filter(r => r.texto_respuesta.trim());
      
      if (respuestasConTexto.length < 2) {
        alert(`La pregunta ${i + 1} debe tener al menos 2 respuestas con texto`);
        return;
      }

      const correctas = respuestasConTexto.filter(r => r.es_correcta);
      if (correctas.length !== 1) {
        alert(`La pregunta ${i + 1} debe tener exactamente 1 respuesta correcta`);
        return;
      }
    }

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user.id_usuario) {
        alert('No se pudo obtener el usuario. Inicia sesión nuevamente.');
        return;
      }

      const preguntasFormateadas = nuevoQuiz.preguntas.map(pregunta => {
        const respuestasConTexto = pregunta.respuestas.filter(r => r.texto_respuesta.trim());
        
        return {
          titulo: pregunta.texto_pregunta.substring(0, 50) || 'Pregunta',
          texto: pregunta.texto_pregunta,
          respuestas: respuestasConTexto.map(respuesta => ({
            texto: respuesta.texto_respuesta,
            es_correcta: respuesta.es_correcta
          }))
        };
      });

      const payload = {
        id_exhibicion: quizToEdit.id_exhibicion,
        titulo: nuevoQuiz.titulo,
        preguntas: preguntasFormateadas
      };

      await api.put(`/quizz/${quizToEdit.id_quizz}`, payload);
      
      setNuevoQuiz({
        titulo: '',
        descripcion: '',
        preguntas: [
          {
            texto_pregunta: '',
            respuestas: [
              { texto_respuesta: '', es_correcta: true },
              { texto_respuesta: '', es_correcta: false },
              { texto_respuesta: '', es_correcta: false },
              { texto_respuesta: '', es_correcta: false }
            ]
          }
        ]
      });
      
      setShowEditModal(false);
      setQuizToEdit(null);
      
      await cargarQuizzesPorExhibicion();
      
      alert('Quiz actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar quiz:', error);
      console.error('Detalles del error completo:', JSON.stringify(error.response?.data, null, 2));
      
      const errorMsg = error.response?.data?.details 
        ? `Errores de validación:\n${error.response.data.details.join('\n')}`
        : error.response?.data?.message || 'Error al actualizar el quiz';
      
      alert(errorMsg);
    }
  };

  const cancelarEditar = () => {
    setShowEditModal(false);
    setQuizToEdit(null);
    setNuevoQuiz({
      titulo: '',
      descripcion: '',
      preguntas: [
        {
          texto_pregunta: '',
          respuestas: [
            { texto_respuesta: '', es_correcta: true },
            { texto_respuesta: '', es_correcta: false },
            { texto_respuesta: '', es_correcta: false },
            { texto_respuesta: '', es_correcta: false }
          ]
        }
      ]
    });
  };

  const handleCrearClick = (exhibicion) => {
    setExhibicionSeleccionada(exhibicion);
    setShowCreateModal(true);
  };

  const agregarPregunta = () => {
    setNuevoQuiz({
      ...nuevoQuiz,
      preguntas: [
        ...nuevoQuiz.preguntas,
        {
          texto_pregunta: '',
          respuestas: [
            { texto_respuesta: '', es_correcta: true },
            { texto_respuesta: '', es_correcta: false },
            { texto_respuesta: '', es_correcta: false },
            { texto_respuesta: '', es_correcta: false }
          ]
        }
      ]
    });
  };

  const eliminarPregunta = (index) => {
    if (nuevoQuiz.preguntas.length === 1) {
      alert('Debe haber al menos una pregunta');
      return;
    }
    const nuevasPreguntas = nuevoQuiz.preguntas.filter((_, i) => i !== index);
    setNuevoQuiz({ ...nuevoQuiz, preguntas: nuevasPreguntas });
  };

  const actualizarPregunta = (indexPregunta, campo, valor) => {
    const nuevasPreguntas = JSON.parse(JSON.stringify(nuevoQuiz.preguntas));
    nuevasPreguntas[indexPregunta][campo] = valor;
    setNuevoQuiz({ ...nuevoQuiz, preguntas: nuevasPreguntas });
  };

  const actualizarRespuesta = (indexPregunta, indexRespuesta, campo, valor) => {
    const nuevasPreguntas = JSON.parse(JSON.stringify(nuevoQuiz.preguntas));
    nuevasPreguntas[indexPregunta].respuestas[indexRespuesta][campo] = valor;
    setNuevoQuiz({ ...nuevoQuiz, preguntas: nuevasPreguntas });
  };

  const marcarRespuestaCorrecta = (indexPregunta, indexRespuesta) => {
    const nuevasPreguntas = JSON.parse(JSON.stringify(nuevoQuiz.preguntas));
    nuevasPreguntas[indexPregunta].respuestas.forEach((respuesta, idx) => {
      respuesta.es_correcta = idx === indexRespuesta;
    });
    setNuevoQuiz({ ...nuevoQuiz, preguntas: nuevasPreguntas });
  };

  const handleSubmitCrear = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!nuevoQuiz.titulo.trim()) {
      alert('El título es obligatorio');
      return;
    }
    
    if (nuevoQuiz.preguntas.length === 0) {
      alert('Debe haber al menos una pregunta');
      return;
    }

    for (let i = 0; i < nuevoQuiz.preguntas.length; i++) {
      const pregunta = nuevoQuiz.preguntas[i];
      if (!pregunta.texto_pregunta.trim()) {
        alert(`La pregunta ${i + 1} no puede estar vacía`);
        return;
      }
      
      // Filtrar respuestas que tienen texto
      const respuestasConTexto = pregunta.respuestas.filter(r => r.texto_respuesta.trim());
      
      if (respuestasConTexto.length < 2) {
        alert(`La pregunta ${i + 1} debe tener al menos 2 respuestas con texto`);
        return;
      }

      const correctas = respuestasConTexto.filter(r => r.es_correcta);
      if (correctas.length !== 1) {
        alert(`La pregunta ${i + 1} debe tener exactamente 1 respuesta correcta`);
        return;
      }
    }

    try {
      // Obtener usuario actual del localStorage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user.id_usuario) {
        alert('No se pudo obtener el usuario. Inicia sesión nuevamente.');
        return;
      }

      // Transformar preguntas al formato que espera el backend
      const preguntasFormateadas = nuevoQuiz.preguntas.map(pregunta => {
        const respuestasConTexto = pregunta.respuestas.filter(r => r.texto_respuesta.trim());
        
        return {
          titulo: pregunta.texto_pregunta.substring(0, 50) || 'Pregunta', // Backend necesita titulo corto
          texto: pregunta.texto_pregunta, // Texto completo de la pregunta
          respuestas: respuestasConTexto.map(respuesta => ({
            texto: respuesta.texto_respuesta,
            es_correcta: respuesta.es_correcta
          }))
        };
      });

      const payload = {
        id_usuario: user.id_usuario,
        id_exhibicion: exhibicionSeleccionada.id_exhibicion,
        titulo: nuevoQuiz.titulo,
        preguntas: preguntasFormateadas
      };

      console.log('Payload a enviar:', JSON.stringify(payload, null, 2));
      
      // Verificar que cada pregunta tenga exactamente 1 respuesta correcta
      await api.post('/quizz', payload);
      
      // Resetear formulario
      setNuevoQuiz({
        titulo: '',
        descripcion: '',
        preguntas: [
          {
            texto_pregunta: '',
            respuestas: [
              { texto_respuesta: '', es_correcta: true },
              { texto_respuesta: '', es_correcta: false },
              { texto_respuesta: '', es_correcta: false },
              { texto_respuesta: '', es_correcta: false }
            ]
          }
        ]
      });
      
      // Cerrar modal
      setShowCreateModal(false);
      
      // Recargar quizzes después de un pequeño delay para asegurar que el backend terminó
      await cargarQuizzesPorExhibicion();
      
      // Limpiar exhibición seleccionada al final
      setExhibicionSeleccionada(null);
      
      alert('Quiz creado exitosamente');
    } catch (error) {
      console.error('Error al crear quiz:', error);
      console.error('Detalles del error completo:', JSON.stringify(error.response?.data, null, 2));
      
      const errorMsg = error.response?.data?.details 
        ? `Errores de validación:\n${error.response.data.details.join('\n')}`
        : error.response?.data?.message || 'Error al crear el quiz';
      
      alert(errorMsg);
    }
  };

  const cancelarCrear = () => {
    setShowCreateModal(false);
    setExhibicionSeleccionada(null);
    setNuevoQuiz({
      titulo: '',
      descripcion: '',
      preguntas: [
        {
          texto_pregunta: '',
          respuestas: [
            { texto_respuesta: '', es_correcta: true },
            { texto_respuesta: '', es_correcta: false },
            { texto_respuesta: '', es_correcta: false },
            { texto_respuesta: '', es_correcta: false }
          ]
        }
      ]
    });
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quizzes por Exhibición</h1>
            <p className="text-sm text-gray-600 mt-1">Vista general de todos los quizzes del museo</p>
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
          <div className="space-y-4">
            {exhibiciones.map((exhibicion) => (
              <div key={exhibicion.id_exhibicion} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header clickeable de la exhibición */}
                <button
                  onClick={() => toggleExhibicion(exhibicion.id_exhibicion)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 hover:from-blue-700 hover:to-blue-800 transition"
                >
                  <div className="flex justify-between items-center">
                    <div className="text-left">
                      <h2 className="text-xl font-bold text-white">
                        {exhibicion.nombre}
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">
                        {exhibicion.tieneQuiz && exhibicion.quizzes[0] ? exhibicion.quizzes[0].titulo : 'Sin quiz asignado'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {exhibicion.tieneQuiz && (
                        <span className="px-3 py-1 bg-green-400 text-green-900 rounded-full text-xs font-bold flex items-center gap-1">
                          ★ Quiz Activo
                        </span>
                      )}
                      <span className="text-white text-2xl">
                        {expandedExhibicion === exhibicion.id_exhibicion ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Contenido desplegable: Lista de quizzes */}
                {expandedExhibicion === exhibicion.id_exhibicion && (
                  <div className="bg-gray-50 border-t border-gray-200">
                    {/* Botón Crear Quiz */}
                    <div className="px-6 py-4 bg-white border-b border-gray-200">
                      <button
                        onClick={() => handleCrearClick(exhibicion)}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition flex items-center justify-center gap-2"
                      >
                        + Crear Nuevo Quiz
                      </button>
                    </div>

                    {exhibicion.tieneQuiz && exhibicion.quizzes.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {exhibicion.quizzes.map((quiz) => (
                          <div key={quiz.id_quizz}>
                            {/* Header del quiz (segundo nivel) */}
                            <div className="bg-white">
                              <button
                                onClick={() => toggleQuiz(quiz.id_quizz)}
                                className="w-full px-6 py-4 hover:bg-gray-50 transition text-left"
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                      {quiz.titulo}
                                    </h3>
                                    {quiz.descripcion && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        {quiz.descripcion}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-xs text-gray-500">
                                        {quiz.preguntas?.length || 0} preguntas
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {quiz.es_activo && (
                                      <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
                                        ★ ACTIVO
                                      </span>
                                    )}
                                    <span className="text-gray-600 text-xl">
                                      {expandedQuiz === quiz.id_quizz ? '▼' : '▶'}
                                    </span>
                                  </div>
                                </div>
                              </button>

                              {/* Botones de acción (Marcar Activo, Editar y Eliminar) */}
                              <div className="px-6 pb-4 flex gap-2">
                                {!quiz.es_activo && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      marcarComoActivo(quiz);
                                    }}
                                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition text-sm"
                                    title="Marcar como quiz activo"
                                  >
                                    ★ Activar
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditarClick(quiz);
                                  }}
                                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium transition text-sm"
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(quiz, exhibicion);
                                  }}
                                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition text-sm ${
                                    exhibicion.quizzes.length === 1
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-red-500 text-white hover:bg-red-600'
                                  }`}
                                  disabled={exhibicion.quizzes.length === 1}
                                  title={exhibicion.quizzes.length === 1 ? 'No puedes eliminar el único quiz' : 'Eliminar quiz'}
                                >
                                  🗑️ Eliminar
                                </button>
                              </div>
                            </div>

                            {/* Contenido del quiz: Preguntas y respuestas (tercer nivel) */}
                            {expandedQuiz === quiz.id_quizz && (
                              <div className="bg-white px-6 py-4">
                                {quiz.preguntas && quiz.preguntas.length > 0 ? (
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                      Preguntas y Respuestas:
                                    </h4>
                                    {quiz.preguntas.map((pregunta, index) => (
                                      <div key={pregunta.id_pregunta} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <p className="font-medium text-gray-800 mb-3">
                                          {index + 1}. {pregunta.texto}
                                        </p>
                                        <div className="ml-4 space-y-2">
                                          {pregunta.respuestas?.map((respuesta) => (
                                            <div key={respuesta.id_respuesta} className="flex items-start">
                                              <span className={`mr-2 mt-0.5 ${respuesta.es_correcta ? 'text-green-600 font-bold text-lg' : 'text-gray-400'}`}>
                                                {respuesta.es_correcta ? '✓' : '○'}
                                              </span>
                                              <span className={`flex-1 ${respuesta.es_correcta ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                                                {respuesta.texto}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-sm text-center py-4">
                                    Este quiz no tiene preguntas
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-2">Esta exhibición no tiene quizzes asignados</p>
                        <p className="text-sm text-gray-400">Próximamente podrás crear quizzes desde aquí</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de edición de quiz */}
      {showEditModal && quizToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-6 py-4 sticky top-0">
              <h3 className="text-2xl font-bold text-white">✏️ Editar Quiz</h3>
              <p className="text-yellow-100 text-sm mt-1">
                Editando quiz para la exhibición seleccionada
              </p>
            </div>

            <form onSubmit={handleSubmitEditar} className="p-6 space-y-6">
              {/* Título del Quiz */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Quiz *
                </label>
                <input
                  type="text"
                  value={nuevoQuiz.titulo}
                  onChange={(e) => setNuevoQuiz({ ...nuevoQuiz, titulo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="Ej: Quiz de Historia del Museo"
                  required
                />
              </div>

              {/* Preguntas */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Preguntas del Quiz *
                  </label>
                  <button
                    type="button"
                    onClick={agregarPregunta}
                    className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 font-medium transition text-sm"
                  >
                    + Agregar Pregunta
                  </button>
                </div>

                {nuevoQuiz.preguntas.map((pregunta, indexPregunta) => (
                  <div key={indexPregunta} className="bg-gray-50 rounded-lg p-4 mb-4 border-2 border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-700">
                        Pregunta {indexPregunta + 1}
                      </h4>
                      {nuevoQuiz.preguntas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarPregunta(indexPregunta)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm font-medium"
                        >
                          ✕ Eliminar
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={pregunta.texto_pregunta}
                      onChange={(e) => actualizarPregunta(indexPregunta, 'texto_pregunta', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-yellow-500"
                      placeholder="Escribe la pregunta aquí"
                      required
                    />

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Respuestas (las vacías se ignoran, mínimo 2 con texto):
                      </p>
                      {pregunta.respuestas.map((respuesta, indexRespuesta) => (
                        <div key={indexRespuesta} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-300">
                          <input
                            type="radio"
                            name={`correcta-edit-${indexPregunta}`}
                            checked={respuesta.es_correcta}
                            onChange={() => marcarRespuestaCorrecta(indexPregunta, indexRespuesta)}
                            className="w-5 h-5 text-green-500 focus:ring-green-500"
                          />
                          <input
                            type="text"
                            value={respuesta.texto_respuesta}
                            onChange={(e) => actualizarRespuesta(indexPregunta, indexRespuesta, 'texto_respuesta', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500"
                            placeholder={`Respuesta ${indexRespuesta + 1} (opcional)`}
                          />
                          {respuesta.es_correcta && (
                            <span className="text-green-600 font-semibold text-sm">✓ Correcta</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition"
                >
                  Actualizar Quiz
                </button>
                <button
                  type="button"
                  onClick={cancelarEditar}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && quizToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Confirmar Eliminación
            </h2>
            <p className="text-gray-600 mb-2">
              ¿Estás seguro de eliminar el quiz:
            </p>
            <p className="font-semibold text-gray-800 mb-4">
              "{quizToDelete.quiz.titulo}"
            </p>
            <p className="text-sm text-gray-500 mb-6">
              de la exhibición <span className="font-medium">{quizToDelete.exhibicion.nombre}</span>?
            </p>
            {expandedQuiz === quizToDelete.quiz.id_quizz && quizToDelete.exhibicion.quizzes.length > 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  ℹ️ Como este quiz está actualmente desplegado, se seleccionará automáticamente otro quiz.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={confirmarEliminar}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
              >
                Sí, Eliminar
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setQuizToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear Quiz */}
      {showCreateModal && exhibicionSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Crear Nuevo Quiz
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Exhibición: <span className="font-semibold">{exhibicionSeleccionada.nombre}</span>
            </p>

            <form onSubmit={handleSubmitCrear}>
              {/* Información básica del quiz */}
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del Quiz *
                  </label>
                  <input
                    type="text"
                    value={nuevoQuiz.titulo}
                    onChange={(e) => setNuevoQuiz({ ...nuevoQuiz, titulo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Quiz sobre el Renacimiento"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={nuevoQuiz.descripcion}
                    onChange={(e) => setNuevoQuiz({ ...nuevoQuiz, descripcion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="Descripción del contenido del quiz"
                  />
                </div>
              </div>

              {/* Preguntas */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Preguntas ({nuevoQuiz.preguntas.length})
                  </h3>
                  <button
                    type="button"
                    onClick={agregarPregunta}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition text-sm"
                  >
                    + Agregar Pregunta
                  </button>
                </div>

                {nuevoQuiz.preguntas.map((pregunta, indexPregunta) => (
                  <div key={indexPregunta} className="mb-6 p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-md font-semibold text-gray-700">
                        Pregunta {indexPregunta + 1}
                      </h4>
                      {nuevoQuiz.preguntas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarPregunta(indexPregunta)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={pregunta.texto_pregunta}
                      onChange={(e) => actualizarPregunta(indexPregunta, 'texto_pregunta', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                      placeholder="Escribe la pregunta aquí"
                      required
                    />

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Respuestas (las vacías se ignoran, mínimo 2 con texto):
                      </p>
                      {pregunta.respuestas.map((respuesta, indexRespuesta) => (
                        <div key={indexRespuesta} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-300">
                          <input
                            type="radio"
                            name={`correcta-${indexPregunta}`}
                            checked={respuesta.es_correcta}
                            onChange={() => marcarRespuestaCorrecta(indexPregunta, indexRespuesta)}
                            className="w-5 h-5 text-green-500 focus:ring-green-500"
                          />
                          <input
                            type="text"
                            value={respuesta.texto_respuesta}
                            onChange={(e) => actualizarRespuesta(indexPregunta, indexRespuesta, 'texto_respuesta', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder={`Respuesta ${indexRespuesta + 1} (opcional)`}
                          />
                          {respuesta.es_correcta && (
                            <span className="text-green-600 font-semibold text-sm">✓ Correcta</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                >
                  Crear Quiz
                </button>
                <button
                  type="button"
                  onClick={cancelarCrear}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
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
