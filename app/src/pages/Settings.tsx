import { COUNTRIES, packOf, type CountryCode } from '../data/country'
import { Badge, Button, PageHead, inputClass } from '../components/ui'
import { useStore } from '../store'

export function SettingsPage() {
  const { state, resetDemo, setCountry } = useStore()
  const pack = packOf(state.countryCode)

  return (
    <div>
      <PageHead
        title="Settings"
        subtitle="Country pack drives currency, GST/VAT, UIP vaccines, stages, documents, COD, and holidays — the same split Indian preschool ERPs (Pathshala, Fledgly, Zenox, OpenEduCat) use."
      />

      <div className="card mb-6 p-5">
        <h2 className="font-display text-xl">Country pack</h2>
        <p className="mt-1 text-sm text-muted">
          Active: {pack.nativeName} · {pack.currency} · {pack.academicYear} · {pack.messaging}
        </p>
        <select
          className={`${inputClass} mt-3 max-w-md`}
          value={state.countryCode}
          onChange={(e) => setCountry(e.target.value as CountryCode)}
        >
          {Object.values(COUNTRIES).map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.currency})
            </option>
          ))}
        </select>
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <p>
            <strong>Stages:</strong> {pack.stages.map((s) => s.label).join(', ')}
          </p>
          <p>
            <strong>Payments:</strong> {pack.payments.map((p) => p.label).join(', ')}
          </p>
          <p>
            <strong>Vaccines:</strong> {pack.vaccineProgram}
          </p>
          <p>
            <strong>COD:</strong> {pack.cod.enabled ? `${pack.cod.label} ${pack.symbol}${pack.cod.min}–${pack.cod.max}` : 'Off'}
          </p>
          <p className="md:col-span-2">
            <strong>ID rule:</strong> {pack.idHint}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {state.sites.map((s) => (
          <article key={s.id} className="card p-5">
            <h2 className="font-display text-xl">{s.name}</h2>
            <p className="mt-1 text-sm text-muted">{s.address}</p>
            <p className="mt-3 text-sm">{s.phone}</p>
            {s.whatsapp ? <p className="text-sm">WhatsApp {s.whatsapp}</p> : null}
            <p className="text-sm">License {s.license}</p>
            {s.gstin ? <p className="text-sm">GSTIN {s.gstin}</p> : null}
            {s.udise ? <p className="text-sm">U-DISE {s.udise}</p> : null}
            {s.fssai ? <p className="text-sm">FSSAI {s.fssai}</p> : null}
            {s.affiliation ? <p className="text-sm">{s.affiliation}</p> : null}
            <p className="text-sm">Licensed capacity {s.capacity}</p>
            <div className="mt-2">
              <Badge tone="pine">{s.state ?? pack.name}</Badge>
            </div>
          </article>
        ))}
      </div>
      <div className="card mt-6 p-5">
        <h2 className="font-display text-xl">Demo data</h2>
        <p className="mt-1 text-sm text-muted">
          Willow stores everything in this browser. Reset to restore the India-seeded multi-site centre (Bengaluru, Mumbai, Delhi).
        </p>
        <Button className="mt-4" variant="danger" onClick={resetDemo}>
          Reset demo
        </Button>
      </div>
    </div>
  )
}
