import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Send,
  User,
  Building2,
  Tag,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { ticketService } from '../services/ticketService'

const CATEGORIES = [
  'VPN Issue',
  'Password Reset',
  'Software Installation',
  'Laptop Issue',
  'Email Access',
  'Network Connectivity',
  'Hardware Request',
  'Other',
]

const DEPARTMENTS = [
  'IT',
  'HR',
  'Finance',
  'Marketing',
  'Sales',
  'Operations',
  'Engineering',
  'Legal',
  'Management',
  'Other',
]

const PRIORITIES = [
  {
    label: 'Low',
    desc: 'Non-urgent, can wait',
    active: 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-200',
    inactive: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400',
  },
  {
    label: 'Medium',
    desc: 'Standard priority',
    active: 'bg-sky-600 border-sky-600 text-white shadow-sky-200',
    inactive: 'bg-sky-50 border-sky-200 text-sky-700 hover:border-sky-400',
  },
  {
    label: 'High',
    desc: 'Needs quick attention',
    active: 'bg-orange-500 border-orange-500 text-white shadow-orange-200',
    inactive: 'bg-orange-50 border-orange-200 text-orange-700 hover:border-orange-400',
  },
  {
    label: 'Critical',
    desc: 'Immediate action needed',
    active: 'bg-red-600 border-red-600 text-white shadow-red-200',
    inactive: 'bg-red-50 border-red-200 text-red-700 hover:border-red-400',
  },
]

const INIT = {
  employee_name: '',
  department: '',
  issue_category: '',
  description: '',
  priority: 'Medium',
}

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5">
      <AlertTriangle size={11} />
      {msg}
    </p>
  )
}

export default function CreateTicket() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INIT)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.employee_name.trim()) e.employee_name = 'Employee name is required'
    if (!form.department) e.department = 'Department is required'
    if (!form.issue_category) e.issue_category = 'Issue category is required'
    if (!form.description.trim()) e.description = 'Description is required'
    else if (form.description.trim().length < 10)
      e.description = 'Description must be at least 10 characters'
    return e
  }

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    try {
      const res = await ticketService.create(form)
      toast.success('Ticket submitted successfully!')
      navigate(`/tickets/${res.data.ticket_id}`)
    } catch (err) {
      toast.error(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={17} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create New Ticket</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Submit a support request to the IT team
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Employee + Department row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <User size={14} className="text-slate-400" />
              Employee Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.employee_name}
              onChange={set('employee_name')}
              placeholder="e.g. John Smith"
              className={`input-field ${errors.employee_name ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}`}
            />
            <FieldError msg={errors.employee_name} />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <Building2 size={14} className="text-slate-400" />
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={form.department}
              onChange={set('department')}
              className={`input-field ${errors.department ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}`}
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <FieldError msg={errors.department} />
          </div>
        </div>

        {/* Issue Category */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
            <Tag size={14} className="text-slate-400" />
            Issue Category <span className="text-red-500">*</span>
          </label>
          <select
            value={form.issue_category}
            onChange={set('issue_category')}
            className={`input-field ${errors.issue_category ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}`}
          >
            <option value="">Select issue category</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <FieldError msg={errors.issue_category} />
        </div>

        {/* Priority */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Priority Level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRIORITIES.map(({ label, desc, active, inactive }) => (
              <button
                key={label}
                type="button"
                onClick={() => setForm((p) => ({ ...p, priority: label }))}
                className={`py-2.5 px-2 rounded-lg text-sm font-medium border-2 transition-all duration-150 shadow-sm ${
                  form.priority === label ? `${active} shadow-md` : inactive
                }`}
              >
                <p className="font-semibold">{label}</p>
                <p className={`text-[10px] mt-0.5 leading-tight ${form.priority === label ? 'opacity-80' : 'opacity-60'}`}>
                  {desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
            <FileText size={14} className="text-slate-400" />
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={set('description')}
            placeholder="Describe the issue in detail — include steps to reproduce, error messages, affected systems, etc."
            rows={5}
            className={`input-field resize-none ${errors.description ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}`}
          />
          <div className="flex justify-between items-start mt-1.5">
            <FieldError msg={errors.description} />
            <span className="text-xs text-slate-400 ml-auto">{form.description.length} chars</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1 justify-center shadow-md shadow-indigo-200"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={15} />
                Submit Ticket
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => { setForm(INIT); setErrors({}) }}
            className="btn-secondary"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  )
}
