import { useState, useEffect, FormEvent } from 'react';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import type { Importer, ImporterInput } from '../../types/database';
import {
  getImporters,
  createImporter,
  updateImporter,
  deleteImporter,
} from '../../services/importerService';

export default function Importers() {
  const [importers, setImporters] = useState<Importer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImporter, setEditingImporter] = useState<Importer | null>(null);
  const [formData, setFormData] = useState<ImporterInput>({
    name: '',
    cnpj: '',
    active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  // Carregar importadoras
  useEffect(() => {
    loadImporters();
  }, []);

  const loadImporters = async () => {
    try {
      setLoading(true);
      const data = await getImporters();
      setImporters(data);
    } catch (error: any) {
      showToast(error.message || 'Erro ao carregar importadoras', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para criar
  const handleCreate = () => {
    setEditingImporter(null);
    setFormData({
      name: '',
      cnpj: '',
      active: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (importer: Importer) => {
    setEditingImporter(importer);
    setFormData({
      name: importer.name,
      cnpj: importer.cnpj || '',
      active: importer.active,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Excluir importadora
  const handleDelete = async (importer: Importer) => {
    if (!confirm(`Deseja realmente excluir a importadora "${importer.name}"?`)) {
      return;
    }

    try {
      await deleteImporter(importer.id);
      showToast('Importadora excluída com sucesso!', 'success');
      loadImporters();
    } catch (error: any) {
      showToast(error.message || 'Erro ao excluir importadora', 'error');
    }
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submeter formulário
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      if (editingImporter) {
        await updateImporter(editingImporter.id, formData);
        showToast('Importadora atualizada com sucesso!', 'success');
      } else {
        await createImporter(formData);
        showToast('Importadora cadastrada com sucesso!', 'success');
      }
      setIsModalOpen(false);
      loadImporters();
    } catch (error: any) {
      showToast(error.message || 'Erro ao salvar importadora', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Colunas da tabela
  const columns: Column<Importer>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (importer) => (
        <span className="font-semibold">{importer.name}</span>
      ),
    },
    {
      key: 'cnpj',
      label: 'CNPJ',
      render: (importer) => importer.cnpj || '-',
    },
    {
      key: 'active',
      label: 'Status',
      render: (importer) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            importer.active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {importer.active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importadoras</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gerenciamento de empresas importadoras
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nova Importadora
        </button>
      </div>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={importers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Nenhuma importadora cadastrada"
      />

      {/* Modal de Formulário */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingImporter ? 'Editar Importadora' : 'Nova Importadora'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nome da importadora"
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>

          {/* CNPJ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CNPJ
            </label>
            <input
              type="text"
              value={formData.cnpj}
              onChange={(e) =>
                setFormData({ ...formData, cnpj: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="00.000.000/0000-00"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) =>
                setFormData({ ...formData, active: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">
              Importadora ativa
            </label>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
