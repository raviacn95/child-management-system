import { Badge, Button, PageHead } from '../components/ui'
import { useStore } from '../store'

export function Inventory() {
  const { state, adjustInventory } = useStore()
  return (
    <div>
      <PageHead title="Supplies" subtitle="Classroom, kitchen, and health inventory with reorder points." />
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th>Category</th>
              <th>On hand</th>
              <th>Reorder at</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.inventory.map((i) => (
              <tr key={i.id} className="border-t border-line">
                <td className="px-4 py-3 font-semibold">{i.name}</td>
                <td>{i.category}</td>
                <td>
                  {i.qty} {i.unit}{' '}
                  {i.qty <= i.reorderAt ? (
                    <Badge tone="rose">low</Badge>
                  ) : (
                    <Badge tone="pine">ok</Badge>
                  )}
                </td>
                <td>
                  {i.reorderAt} {i.unit}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => adjustInventory(i.id, -1)}>
                      −
                    </Button>
                    <Button variant="ghost" onClick={() => adjustInventory(i.id, 1)}>
                      +
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
