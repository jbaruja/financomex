import { useState, useEffect, type FormEvent } from 'react';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import type { ExpenseCategory, ExpenseCategoryInput } from '../../types/database';
import {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from '../../services/expenseCategoryService';

export default function ExpenseCategories() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [formData, setFormData] = useState<ExpenseCategoryInput>({
    name: '',
    description: '',
    active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  // Carregar categorias
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getExpenseCategories();
      setCategories(data);
    } catch (error: any) {
      showToast(error.message || 'Erro ao carregar categorias', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para criar
  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      active: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      active: category.active,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Excluir categoria
  const handleDelete = async (category: ExpenseCategory) => {
    if (!confirm(`Deseja realmente excluir a categoria "${category.name}"?`)) {
      return;
    }

    try {
      await deleteExpenseCategory(category.id);
      showToast('Categoria excluída com sucesso!', 'success');
      loadCategories();
    } catch (error: any) {
      showToast(error.message || 'Erro ao excluir categoria', 'error');
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
      if (editingCategory) {
        await updateExpenseCategory(editingCategory.id, formData);
        showToast('Categoria atualizada com sucesso!', 'success');
      } else {
        await createExpenseCategory(formData);
        showToast('Categoria cadastrada com sucesso!', 'success');
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (error: any) {
      showToast(error.message || 'Erro ao salvar categoria', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Colunas da tabela
  const columns: Column<ExpenseCategory>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (category) => (
        <span className="font-semibold">{category.name}</span>
      ),
    },
    {
      key: 'description',
      label: 'Descrição',
      render: (category) => category.description || '-',
    },
    {
      key: 'active',
      label: 'Status',
      render: (category) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            category.active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {category.active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias de Despesa</h1>
          <p className="mt-1 text-sm text-gray-600">
            
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
          Nova Categoria
        </button>
      </div>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Nenhuma categoria cadastrada"
      />

      {/* Modal de Formulário */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
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
              placeholder="Nome da categoria"
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Descrição da categoria (opcional)"
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
              Categoria ativa
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
