import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Send, X, Plus, Upload, Paperclip, Trash2, FileText, Tag, FolderOpen, Info } from 'lucide-react'
import { articlesAPI, categoriesAPI, tagsAPI, filesAPI } from '../services/api'
import toast from 'react-hot-toast'

function CreateArticle() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    category_id: '',
    tags: [],
    is_featured: false
  })
  const [categories, setCategories] = useState([])
  const [allTags, setAllTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [pendingFiles, setPendingFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchMeta()
  }, [])

  const fetchMeta = async () => {
    try {
      const [catRes, tagRes] = await Promise.all([categoriesAPI.getAll(), tagsAPI.getAll()])
      setCategories(catRes.data.data)
      setAllTags(tagRes.data.data)
    } catch {}
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.content.trim()) errs.content = 'Content is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleTagToggle = (tagId) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId) ? prev.tags.filter(t => t !== tagId) : [...prev.tags, tagId]
    }))
  }

  const handleCreateTag = async () => {
    if (!tagInput.trim()) return
    try {
      const res = await tagsAPI.create({ name: tagInput.trim() })
      setAllTags(prev => [...prev, res.data.data])
      setForm(prev => ({ ...prev, tags: [...prev.tags, res.data.data.id] }))
      setTagInput('')
      toast.success(`Tag "${res.data.data.name}" created`)
    } catch (err) {
      if (err.response?.status === 409) {
        const existing = allTags.find(t => t.name === tagInput.trim().toLowerCase())
        if (existing && !form.tags.includes(existing.id)) {
          setForm(prev => ({ ...prev, tags: [...prev.tags, existing.id] }))
          toast.success('Tag added')
        } else {
          toast.error('Tag already exists')
        }
      } else {
        toast.error('Failed to create tag')
      }
      setTagInput('')
    }
  }

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(f => {
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} exceeds 10MB`); return false }
      return true
    })
    setPendingFiles(prev => [...prev, ...validFiles.map(f => ({ file: f, id: Math.random().toString(36).slice(2) }))])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const removePendingFile = (id) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id))
  }

  const saveArticle = async (submitAfter = false) => {
    if (!validate()) {
      toast.error('Please fix the errors before saving')
      return
    }

    submitAfter ? setSubmitting(true) : setSaving(true)

    try {
      const res = await articlesAPI.create({
        title: form.title,
        summary: form.summary,
        content: form.content,
        category_id: form.category_id || null,
        tags: form.tags,
        is_featured: form.is_featured
      })
      const articleId = res.data.data.id

      if (pendingFiles.length > 0) {
        const uploadPromises = pendingFiles.map(({ file }) => {
          const formData = new FormData()
          formData.append('file', file)
          return filesAPI.upload(articleId, formData).catch(() => {})
        })
        await Promise.all(uploadPromises)
      }

      if (submitAfter) {
        await articlesAPI.submit(articleId)
        toast.success('Article created and submitted for review!')
      } else {
        toast.success('Article saved as draft!')
      }

      navigate(`/articles/${articleId}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save article')
    } finally {
      setSaving(false)
      setSubmitting(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Create New Article</h2>
          <p className="text-sm text-slate-500 mt-0.5">Write and publish to the knowledge base</p>
        </div>
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Article Title <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter a clear, descriptive title..."
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all font-medium text-slate-900 ${errors.title ? 'border-red-300' : 'border-slate-200'}`}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Summary / Abstract
              </label>
              <textarea
                name="summary"
                value={form.summary}
                onChange={handleChange}
                placeholder="Brief description of the article (shown in cards and search results)..."
                rows={2}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Content <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Info className="w-3.5 h-3.5" />
                Supports Markdown
              </div>
            </div>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder={`# Article Title\n\nWrite your article content here...\n\n## Section 1\n\nYour content...\n\n## Section 2\n\nMore content...`}
              rows={20}
              className={`w-full px-4 py-3 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all resize-y leading-relaxed ${errors.content ? 'border-red-300' : 'border-slate-200'}`}
            />
            {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
            <p className="text-xs text-slate-400 mt-2">
              {form.content.length} characters · ~{Math.ceil(form.content.split(/\s+/).filter(Boolean).length / 200)} min read
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" /> Attachments
            </label>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">Drop files here or click to browse</p>
              <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, PPT, XLS, PNG, JPG — Max 10MB each</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />

            {pendingFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {pendingFiles.map(({ file, id }) => (
                  <div key={id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                      <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                    </div>
                    <button onClick={() => removePendingFile(id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" /> Category
            </label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
            >
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Tags
            </label>

            <div className="flex gap-2 mb-3">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
                placeholder="New tag name..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleCreateTag}
                className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                    form.tags.includes(tag.id)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  #{tag.name}
                </button>
              ))}
            </div>

            {form.tags.length > 0 && (
              <p className="text-xs text-slate-400 mt-2">{form.tags.length} tag{form.tags.length !== 1 ? 's' : ''} selected</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_featured"
                checked={form.is_featured}
                onChange={handleChange}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-semibold text-slate-700">Mark as Featured</p>
                <p className="text-xs text-slate-400">Highlight in dashboard and listings</p>
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => saveArticle(false)}
              disabled={saving || submitting}
              className="w-full py-3 flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:border-indigo-300 hover:text-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              onClick={() => saveArticle(true)}
              disabled={saving || submitting}
              className="w-full py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateArticle
