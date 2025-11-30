import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Exhibiciones',
      description: 'Ver todas las exhibiciones del museo',
      icon: '🏛️',
      path: '/exhibiciones',
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Quizzes',
      description: 'Gestionar quizzes y preguntas',
      icon: '📝',
      path: '/quizzes',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Usuarios',
      description: 'Administrar usuarios del sistema',
      icon: '👥',
      path: '/usuarios',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Informes',
      description: 'Estadísticas, visitas y análisis detallado de quizzes',
      icon: '📊',
      path: '/informes',
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      title: 'MinIO',
      description: 'Gestionar archivos multimedia',
      icon: '📁',
      path: '/minio',
      color: 'from-pink-500 to-pink-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Panel de Administración
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Bienvenido, {user?.nombre} {user?.apellido}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Módulos del Sistema
          </h2>
          <p className="text-gray-600">
            Selecciona una opción para gestionar el sistema del museo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <span className="text-4xl mr-3">{item.icon}</span>
                  <h3 className="text-xl font-bold text-gray-800">
                    {item.title}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  {item.description}
                </p>
              </div>

              <div className={`h-1 bg-gradient-to-r ${item.color}`}></div>
            </button>
          ))}
        </div>

        {/* Stats Preview */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Acceso Rápido
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">4</p>
              <p className="text-sm text-gray-600">Exhibiciones</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">-</p>
              <p className="text-sm text-gray-600">Quizzes Activos</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">-</p>
              <p className="text-sm text-gray-600">Visitas Hoy</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">-</p>
              <p className="text-sm text-gray-600">Usuarios Totales</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
