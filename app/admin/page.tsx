"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { 
  Upload, 
  File, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Database,
  TrendingUp,
  Clock,
  FileText,
  BarChart3,
  RefreshCw
} from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  fragments?: number;
}

interface AdminStats {
  totalResources: number;
  totalEmbeddings: number;
  recentResources: Array<{
    id: string;
    content: string;
    createdAt: string;
    fragmentCount: number;
  }>;
  dailyStats: Array<{
    date: string;
    count: number;
  }>;
  avgContentLength: number;
  lastUpdate: string;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoadingStats(false);
    }
  };

  // Refrescar estadísticas después de subir archivos
  const refreshStats = () => {
    fetchStats();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };
  const handleFiles = async (fileList: File[]) => {
    setUploading(true);
    
    // Filtrar solo archivos .txt
    const txtFiles = fileList.filter(file => file.name.toLowerCase().endsWith('.txt'));
    
    if (txtFiles.length !== fileList.length) {
      toast.error('Solo se permiten archivos .txt');
    }
    
    for (const file of txtFiles) {
      const fileId = `${Date.now()}-${file.name}`;
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        status: 'uploading'
      };

      setFiles(prev => [...prev, newFile]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('resourceName', file.name);

        const response = await fetch('/api/resources', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'success', fragments: result.fragments }
              : f
          ));
          toast.success(`${file.name} cargado exitosamente`);
          refreshStats(); // Refrescar estadísticas después de subir
        } else {
          throw new Error('Error al subir archivo');
        }
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error' }
            : f
        ));
        toast.error(`Error al cargar ${file.name}`);
      }
    }
    
    setUploading(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso denegado
          </h1>
          <p className="text-gray-600">
            Debes iniciar sesión para acceder al panel administrativo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Panel Administrativo
              </h1>
              <p className="text-gray-600">
                Gestiona tu base de conocimientos de Chatico
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Bienvenido,</p>
                <p className="font-medium text-gray-900">{session.user?.name}</p>
              </div>
              <img 
                src={session.user?.image || ''} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Subir Archivos
              </h2>

              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >                <input
                  type="file"
                  multiple
                  onChange={handleChange}
                  accept=".txt"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload className={`w-8 h-8 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                  </div>
                  
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {dragActive ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      o haz clic para seleccionar archivos
                    </p>
                  </div>
                    <p className="text-xs text-gray-400">
                    Soporta: TXT (máx. 10MB)
                  </p>
                </div>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Archivos Procesados
                </h3>
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.size)}
                            {file.fragments && ` • ${file.fragments} fragmentos`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === 'uploading' && (
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        )}
                        {file.status === 'success' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {file.status === 'error' && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Estadísticas Generales */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Estadísticas Generales
                </h3>
                <button
                  onClick={refreshStats}
                  disabled={loadingStats}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {loadingStats ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ) : stats ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Total documentos:
                    </span>
                    <span className="font-semibold text-blue-600">
                      {stats.totalResources}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Total fragmentos:
                    </span>
                    <span className="font-semibold text-purple-600">
                      {stats.totalEmbeddings}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Tamaño promedio:
                    </span>
                    <span className="font-semibold text-green-600">
                      {(stats.avgContentLength / 1000).toFixed(1)}k chars
                    </span>
                  </div>
                  <hr className="my-4" />
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Actualizado: {new Date(stats.lastUpdate).toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Error al cargar estadísticas</p>
              )}
            </div>

            {/* Estadísticas de Sesión */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Sesión Actual
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Archivos exitosos:</span>
                  <span className="font-semibold text-green-600">
                    {files.filter(f => f.status === 'success').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">En proceso:</span>
                  <span className="font-semibold text-blue-600">
                    {files.filter(f => f.status === 'uploading').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Con errores:</span>
                  <span className="font-semibold text-red-600">
                    {files.filter(f => f.status === 'error').length}
                  </span>
                </div>
                <hr className="my-4" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fragmentos agregados:</span>
                  <span className="font-semibold text-purple-600">
                    {files.reduce((acc, f) => acc + (f.fragments || 0), 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actividad Reciente */}
            {stats?.recentResources && stats.recentResources.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Actividad Reciente
                </h3>
                <div className="space-y-3">
                  {stats.recentResources.slice(0, 5).map((resource) => (
                    <div key={resource.id} className="border-l-4 border-blue-200 pl-4 py-2">
                      <p className="text-sm text-gray-800 line-clamp-2">
                        {resource.content}...
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                          {resource.fragmentCount} fragmentos
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(resource.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gráfico de Actividad */}
            {stats?.dailyStats && stats.dailyStats.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Actividad (7 días)
                </h3>
                <div className="space-y-2">
                  {stats.dailyStats.map((day) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {new Date(day.date).toLocaleDateString('es-ES', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 bg-blue-500 rounded"
                          style={{ width: `${Math.max(day.count * 20, 8)}px` }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900">
                          {day.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">💡 Consejos</h3>
              <ul className="text-sm space-y-2 opacity-90">
                <li>• Solo acepta archivos de texto (.txt)</li>
                <li>• Los archivos grandes se fragmentan automáticamente</li>
                <li>• Incluye contexto relevante en tus documentos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
