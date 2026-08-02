import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCsvExport } from '@/composables/useCsvExport'
import { useToast } from '@/composables/useToast'
import { http } from '@/lib/http'

vi.mock('@/lib/http', () => ({
  http: { get: vi.fn() },
}))

const mocked = vi.mocked(http)

/** jsdom implements neither object URL method. */
const createObjectURL = vi.fn(() => 'blob:mock-url')
const revokeObjectURL = vi.fn()

function csvResponse(contentDisposition?: string) {
  return {
    data: new Blob(['Reference,Merchant\n'], { type: 'text/csv' }),
    headers: contentDisposition ? { 'content-disposition': contentDisposition } : {},
  }
}

let clickedAnchors: HTMLAnchorElement[] = []

beforeEach(() => {
  vi.clearAllMocks()
  clickedAnchors = []

  Object.assign(URL, { createObjectURL, revokeObjectURL })

  // Capture the download without letting jsdom attempt a navigation.
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    clickedAnchors.push(this)
  })

  const { toasts, dismiss } = useToast()
  toasts.value.forEach((toast) => dismiss(toast.id))
})

describe('download', () => {
  it('requests the export as a blob, carrying the active filters', async () => {
    mocked.get.mockResolvedValue(csvResponse('attachment; filename=kudi-transactions-2026-07-26.csv'))
    const { download } = useCsvExport()

    await download('transactions', { merchant_id: 5, date_from: '2026-07-20' })

    expect(mocked.get).toHaveBeenCalledWith('/api/exports/transactions', {
      params: { merchant_id: 5, date_from: '2026-07-20' },
      responseType: 'blob',
    })
  })

  it('names the file from the Content-Disposition header', async () => {
    mocked.get.mockResolvedValue(csvResponse('attachment; filename=kudi-settlements-2026-07-26.csv'))
    const { download } = useCsvExport()

    await download('settlements')

    expect(clickedAnchors[0].download).toBe('kudi-settlements-2026-07-26.csv')
  })

  it('handles a quoted filename', async () => {
    mocked.get.mockResolvedValue(csvResponse('attachment; filename="kudi-transactions-2026-07-26.csv"'))
    const { download } = useCsvExport()

    await download('transactions')

    expect(clickedAnchors[0].download).toBe('kudi-transactions-2026-07-26.csv')
  })

  it('falls back to a dated name when the header is missing', async () => {
    mocked.get.mockResolvedValue(csvResponse())
    const { download } = useCsvExport()

    await download('transactions')

    expect(clickedAnchors[0].download).toMatch(/^kudi-transactions-\d{4}-\d{2}-\d{2}\.csv$/)
  })

  it('releases the object URL rather than leaking it', async () => {
    mocked.get.mockResolvedValue(csvResponse('attachment; filename=export.csv'))
    const { download } = useCsvExport()

    await download('transactions')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('removes the anchor it created', async () => {
    mocked.get.mockResolvedValue(csvResponse('attachment; filename=export.csv'))
    const { download } = useCsvExport()

    await download('transactions')

    expect(document.querySelectorAll('a[download]')).toHaveLength(0)
  })

  it('confirms the download by name', async () => {
    mocked.get.mockResolvedValue(csvResponse('attachment; filename=kudi-transactions-2026-07-26.csv'))
    const { download } = useCsvExport()
    const { toasts } = useToast()

    await download('transactions')

    expect(toasts.value[0]).toMatchObject({
      message: 'kudi-transactions-2026-07-26.csv downloaded.',
      variant: 'success',
    })
  })
})

describe('failure handling', () => {
  it('reports an error instead of throwing at the caller', async () => {
    mocked.get.mockRejectedValue(new Error('500'))
    const { download } = useCsvExport()
    const { toasts } = useToast()

    await expect(download('settlements')).resolves.toBeUndefined()

    expect(toasts.value[0]).toMatchObject({
      message: 'Could not export settlements. Try again.',
      variant: 'error',
    })
  })

  it('does not trigger a download when the request fails', async () => {
    mocked.get.mockRejectedValue(new Error('500'))
    const { download } = useCsvExport()

    await download('transactions')

    expect(clickedAnchors).toHaveLength(0)
  })
})

describe('exporting flag', () => {
  it('names the resource in flight, then clears', async () => {
    let release: (value: unknown) => void = () => {}
    mocked.get.mockReturnValue(new Promise((resolve) => { release = resolve }))
    const { download, exporting } = useCsvExport()

    const pending = download('transactions')
    expect(exporting.value).toBe('transactions')

    release(csvResponse('attachment; filename=export.csv'))
    await pending

    expect(exporting.value).toBeNull()
  })

  it('clears after a failure, so the button is not stuck spinning', async () => {
    mocked.get.mockRejectedValue(new Error('500'))
    const { download, exporting } = useCsvExport()

    await download('transactions')

    expect(exporting.value).toBeNull()
  })
})
