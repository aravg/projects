import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Save,
  X,
  User,
  Building2,
  Tag,
  CheckCircle2,
  FileText,
  Calendar,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { ticketService } from '../services/ticketService'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'

const CATEGORIES = [
  'VPN Issue', 'Password Reset', 'Software Installation', 'Laptop Issue',
  'Email Access', 'Network Connectivity', 'Hardware Request', 'Other',
]
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed']
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
const DEPARTMENTS = [
  'IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations',
  'Engineering', 'Legal', 'Management', 'Other',
]

const STATUS_FLOW = ['Open', 'In Progress', 'Resolved', 'Closed']

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
        <Icon size={11} />
        {label}
      </label>
      {children}
    </div>
  )
}

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    ticketService
      .getById(id)
      .then((r) => { setTicket(r.data); setForm(r.data) })
      .catch(() => { toast.error('Ticket not found'); navigate('/tickets') })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const cancelEdit = () => { setEditing(false); setForm(ticket) }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await ticketService.update(id, {
        employee_name: form.employee_name,
        department: form.department,
        issue_category: form.issue_category,
        description: form.description,
        priority: form.priority,
        status: form.status,
        resolution_notes: form.resolution_notes,
      })
      setTicket(res.data)
      setForm(res.data)
      setEditing(false)
      toast.success('Ticket updated!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleQuickStatus = async (newStatus) => {
    try {
      const res = await ticketService.update(id, { status: newStatus })
      setTicket(res.data)
      setForm(res.data)
      toast.success(`Status changed to ${newStatus}`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await ticketService.delete(id)
      toast.success('Ticket deleted')
      navigate('/tickets')
    } catch (err) {
      toast.error(err.message)
      setDeleting(false)
    }
  }

  const fmt = (d, long = false) => {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-US', long
      ? { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const upd = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!ticket) return null

  const currentStatusIdx = STATUS_FLOW.indexOf(ticket.status)

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3 mb-7">
        <button
          onClick={() => navigate('/tickets')}
          className="mt-0.5 w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={17} className="text-slate-600" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
              #{ticket.ticket_id}
            </span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 truncate">{ticket.issue_category}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Submitted by {ticket.employee_name} &middot; {ticket.department} &middot; {fmt(ticket.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {editing ? (
            <>
              <button onClick={cancelEdit} className="btn-secondary">
                <X size={15} />
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                Save
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setShowDelete(true)} className="btn-secondary text-red-600 hover:bg-red-50 hover:border-red-200">
                <Trash2 size={15} />
                Delete
              </button>
              <button onClick={() => setEditing(true)} className="btn-primary">
                <Edit2 size={15} />
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Progress Bar */}
      {!editing && (
        <div className="card p-4 mb-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Ticket Progress
          </p>
          <div className="flex items-center gap-0">
            {STATUS_FLOW.map((s, i) => {
              const done = i <= currentStatusIdx
              const current = i === currentStatusIdx
              return (
                <div key={s} className="flex items-center flex-1">
                  <button
                    onClick={() => !current && handleQuickStatus(s)}
                    title={`Set to ${s}`}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                      current
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : done
                        ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 cursor-pointer'
                    }`}
                  >
                    {s}
                  </button>
                  {i < STATUS_FLOW.length - 1 && (
                    <div
                      className={`w-6 h-0.5 flex-shrink-0 transition-colors ${
                        i < currentStatusIdx ? 'bg-indigo-300' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Click a status to quickly update it
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <div className="card p-5">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
              <FileText size={16} className="text-slate-400" />
              Issue Description
            </h3>
            {editing ? (
              <textarea
                value={form.description}
                onChange={upd('description')}
                rows={6}
                className="input-field resize-none"
              />
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            )}
          </div>

          {/* Resolution Notes */}
          <div className="card p-5">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
              <CheckCircle2 size={16} className="text-slate-400" />
              Resolution Notes
            </h3>
            {editing ? (
              <textarea
                value={form.resolution_notes || ''}
                onChange={upd('resolution_notes')}
                rows={4}
                placeholder="Document the resolution steps taken to fix this issue..."
                className="input-field resize-none"
              />
            ) : ticket.resolution_notes ? (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {ticket.resolution_notes}
              </p>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-400 italic py-2">
                <AlertTriangle size={14} />
                No resolution notes added yet
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-slate-900">Ticket Details</h3>

            <DetailRow icon={User} label="Employee">
              {editing ? (
                <input
                  type="text"
                  value={form.employee_name}
                  onChange={upd('employee_name')}
                  className="input-field text-sm py-2"
                />
              ) : (
                <p className="text-sm font-medium text-slate-800">{ticket.employee_name}</p>
              )}
            </DetailRow>

            <DetailRow icon={Building2} label="Department">
              {editing ? (
                <select
                  value={form.department}
                  onChange={upd('department')}
                  className="input-field text-sm py-2"
                >
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              ) : (
                <p className="text-sm font-medium text-slate-800">{ticket.department}</p>
              )}
            </DetailRow>

            <DetailRow icon={Tag} label="Category">
              {editing ? (
                <select
                  value={form.issue_category}
                  onChange={upd('issue_category')}
                  className="input-field text-sm py-2"
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              ) : (
                <p className="text-sm font-medium text-slate-800">{ticket.issue_category}</p>
              )}
            </DetailRow>

            <DetailRow icon={AlertTriangle} label="Priority">
              {editing ? (
                <select
                  value={form.priority}
                  onChange={upd('priority')}
                  className="input-field text-sm py-2"
                >
                  {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                </select>
              ) : (
                <PriorityBadge priority={ticket.priority} />
              )}
            </DetailRow>

            <DetailRow icon={CheckCircle2} label="Status">
              {editing ? (
                <select
                  value={form.status}
                  onChange={upd('status')}
                  className="input-field text-sm py-2"
                >
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              ) : (
                <StatusBadge status={ticket.status} />
              )}
            </DetailRow>
          </div>

          {/* Timeline */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Calendar size={13} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Ticket Created</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {fmt(ticket.created_at, true)}
                  </p>
                </div>
              </div>
              {ticket.updated_at && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock size={13} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Last Updated</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {fmt(ticket.updated_at, true)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDelete && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowDelete(false)}
        >
          <div className="card p-6 max-w-sm w-full shadow-2xl animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete Ticket</h3>
                <p className="text-sm text-slate-500">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5 bg-slate-50 p-3 rounded-lg">
              You're about to permanently delete{' '}
              <span className="font-semibold text-slate-900">
                Ticket #{ticket.ticket_id}
              </span>{' '}
              — "{ticket.issue_category}" submitted by {ticket.employee_name}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger flex-1 justify-center"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
