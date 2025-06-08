'use client';

import { useState, useEffect } from 'react';
import { TenantContentWithAuthor, CreateContentRequest, UpdateContentRequest, ContentType, ContentStatus } from '@/types/content';

interface ContentManagementProps {
  tenantId: string;
}

export function ContentManagement({ tenantId }: ContentManagementProps) {
  const [content, setContent] = useState<TenantContentWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingContent, setEditingContent] = useState<TenantContentWithAuthor | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState<CreateContentRequest>({
    title: '',
    content: {},
    contentType: ContentType.PAGE,
    category: '',
    metadata: {},
    status: ContentStatus.DRAFT,
  });

  useEffect(() => {
    loadContent();
  }, [selectedType, selectedStatus]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const response = await fetch(`/api/v1/content?${params.toString()}`, {
        headers: {
          'x-tenant-slug': tenantId, // Assuming tenant slug is used for identification
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
      } else {
        console.error('Failed to load content');
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/v1/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantId,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newContent = await response.json();
        setContent(prev => [newContent, ...prev]);
        setShowCreateForm(false);
        resetForm();
      } else {
        console.error('Failed to create content');
      }
    } catch (error) {
      console.error('Error creating content:', error);
    }
  };

  const handleUpdate = async (id: string, updates: UpdateContentRequest) => {
    try {
      const response = await fetch(`/api/v1/content/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantId,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedContent = await response.json();
        setContent(prev => prev.map(item => 
          item.id === id ? updatedContent : item
        ));
        setEditingContent(null);
      } else {
        console.error('Failed to update content');
      }
    } catch (error) {
      console.error('Error updating content:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const response = await fetch(`/api/v1/content/${id}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-slug': tenantId,
        },
      });

      if (response.ok) {
        setContent(prev => prev.filter(item => item.id !== id));
      } else {
        console.error('Failed to delete content');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const handlePublish = async (id: string) => {
    await handleUpdate(id, { status: ContentStatus.PUBLISHED });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: {},
      contentType: ContentType.PAGE,
      category: '',
      metadata: {},
      status: ContentStatus.DRAFT,
    });
  };

  const startEdit = (item: TenantContentWithAuthor) => {
    setEditingContent(item);
    setFormData({
      title: item.title,
      content: item.content,
      contentType: item.contentType,
      category: item.category || '',
      metadata: item.metadata || {},
      status: item.status,
    });
    setShowCreateForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Content Management</h2>
          <p className="text-gray-600">Manage tenant-specific content and media</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Content
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Types</option>
            <option value={ContentType.PAGE}>Page</option>
            <option value={ContentType.COMPONENT}>Component</option>
            <option value={ContentType.MEDIA}>Media</option>
            <option value={ContentType.TEMPLATE}>Template</option>
            <option value={ContentType.CONFIG}>Config</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value={ContentStatus.DRAFT}>Draft</option>
            <option value={ContentStatus.PUBLISHED}>Published</option>
            <option value={ContentStatus.ARCHIVED}>Archived</option>
          </select>
        </div>
      </div>

      {/* Content List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading content...</p>
          </div>
        ) : content.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No content found. Create your first content item to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Author</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Updated</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {content.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-500">v{item.version}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {item.contentType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {item.category || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        item.status === ContentStatus.PUBLISHED ? 'bg-green-100 text-green-800' :
                        item.status === ContentStatus.DRAFT ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {item.author?.name || 'Unknown'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        {item.status !== ContentStatus.PUBLISHED && (
                          <button
                            onClick={() => handlePublish(item.id)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Publish
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingContent ? 'Edit Content' : 'Create New Content'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingContent(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter content title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.contentType}
                    onChange={(e) => setFormData(prev => ({ ...prev, contentType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value={ContentType.PAGE}>Page</option>
                    <option value={ContentType.COMPONENT}>Component</option>
                    <option value={ContentType.MEDIA}>Media</option>
                    <option value={ContentType.TEMPLATE}>Template</option>
                    <option value={ContentType.CONFIG}>Config</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Optional category"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  value={typeof formData.content === 'string' ? formData.content : JSON.stringify(formData.content, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData(prev => ({ ...prev, content: parsed }));
                    } catch {
                      setFormData(prev => ({ ...prev, content: e.target.value }));
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-32"
                  placeholder="Enter content (JSON or text)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value={ContentStatus.DRAFT}>Draft</option>
                  <option value={ContentStatus.PUBLISHED}>Published</option>
                  <option value={ContentStatus.ARCHIVED}>Archived</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingContent(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingContent ? () => handleUpdate(editingContent.id, formData) : handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingContent ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 