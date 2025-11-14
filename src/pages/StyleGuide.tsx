import { FiSettings, FiCheckCircle, FiXCircle, FiLayout, FiAlertTriangle } from 'react-icons/fi'
import ThemeToggle from '../components/layout/ThemeToggle'

export default function StyleGuide() {
  return (
    <div className="ds-container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ds-h1">Design System & Style Guide</h1>
          <p className="ds-subtitle">Light/Dark themes, components, and UI patterns.</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Colors & Typography */}
      <section className="ds-section">
        <h2 className="ds-card-title">Brand Colors & Typography</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Primary 600', class: 'bg-primary-600' },
            { name: 'Success 600', class: 'bg-success-600' },
            { name: 'Warning 600', class: 'bg-warning-600' },
            { name: 'Danger 600', class: 'bg-danger-600' },
          ].map((c) => (
            <div key={c.name} className={`rounded-lg p-4 text-white ${c.class}`}>
              <span className="text-sm font-medium">{c.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-2">
          <h3 className="ds-h3">Type Scale</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Consistent hierarchy for readability.</p>
          <div className="space-y-1">
            <div className="text-3xl font-bold">Heading 1</div>
            <div className="text-2xl font-semibold">Heading 2</div>
            <div className="text-xl font-semibold">Heading 3</div>
            <div className="text-base">Body text example with normal weight.</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Caption / helper text</div>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="ds-section">
        <h2 className="ds-card-title">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <button className="ds-btn-primary"><FiCheckCircle className="h-4 w-4" />Primary</button>
          <button className="ds-btn-secondary"><FiSettings className="h-4 w-4" />Secondary</button>
          <button className="ds-btn-outline">Outline</button>
          <button className="ds-btn-danger"><FiXCircle className="h-4 w-4" />Danger</button>
        </div>
      </section>

      {/* Forms */}
      <section className="ds-section">
        <h2 className="ds-card-title">Forms</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="ds-subtitle">Email</label>
            <input className="ds-input mt-1" placeholder="you@example.com" />
          </div>
          <div>
            <label className="ds-subtitle">Severity</label>
            <select className="ds-select mt-1">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="ds-subtitle">Notes</label>
            <textarea className="ds-textarea mt-1" placeholder="Write a short note..." />
          </div>
        </div>
      </section>

      {/* Badges & Alerts */}
      <section className="ds-section">
        <h2 className="ds-card-title">Badges & Alerts</h2>
        <div className="flex flex-wrap gap-2">
          <span className="ds-badge-info">Info</span>
          <span className="ds-badge-success">Success</span>
          <span className="ds-badge-warning">Warning</span>
          <span className="ds-badge-danger">Danger</span>
        </div>
        <div className="mt-4 space-y-3">
          <div className="ds-alert-info"><strong>Info:</strong> System updated successfully.</div>
          <div className="ds-alert-success"><strong>Success:</strong> All tests are passing.</div>
          <div className="ds-alert-warning"><strong>Warning:</strong> High CPU usage detected.</div>
          <div className="ds-alert-danger"><strong>Error:</strong> Connection failed.</div>
        </div>
      </section>

      {/* Layout mockup */}
      <section className="ds-section">
        <h2 className="ds-card-title">Dashboard Mockup</h2>
        <p className="ds-subtitle">Illustrative layout with intuitive information architecture.</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => (
            <div className="ds-card" key={i}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FiLayout className="h-4 w-4 text-primary-600" />
                  <h3 className="ds-card-title mb-0">Metric {i}</h3>
                </div>
                <span className="ds-badge-info">Live</span>
              </div>
              <div className="ds-card-body">Content area with chart/metric.</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <section className="ds-section">
        <h2 className="ds-card-title">Tabs</h2>
        <div className="ds-tabs">
          <button className="ds-tab ds-tab-active">Overview</button>
          <button className="ds-tab">Settings</button>
          <button className="ds-tab">Logs</button>
        </div>
        <div className="ds-card mt-4">
          <p className="ds-card-body">Tabs demonstrate consistent spacing and visual hierarchy.</p>
        </div>
      </section>

      {/* Accessibility note */}
      <section className="ds-section">
        <h2 className="ds-card-title">Accessibility</h2>
        <div className="space-y-2">
          <p className="ds-card-body">Colors meet WCAG contrast targets for body and interactive text.</p>
          <div className="ds-alert-info"><FiAlertTriangle className="inline h-4 w-4 mr-1" /> Ensure labels are associated with inputs and interactive elements have focus styles.</div>
        </div>
      </section>
    </div>
  )
}