import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { clearAway, consumeToken, lastScreen } from '../features/ott/returnSession'

export function ReturnPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = params.get('token')
    const record = token ? consumeToken(token) : null
    clearAway()
    window.dispatchEvent(new Event('willow-return'))
    navigate(record?.screen || lastScreen(), { replace: true })
  }, [navigate, params])

  return (
    <p className="text-sm text-muted" data-testid="return-page">
      Bringing you back to Willow…
    </p>
  )
}
