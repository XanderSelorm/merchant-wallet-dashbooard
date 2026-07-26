import { ref } from 'vue'

import { http } from '@/lib/http'
import { useToast } from '@/composables/useToast'

/**
 * Downloads a CSV through the authenticated axios client rather than a plain
 * link, so the session cookie and any active filters both travel with it.
 */
export function useCsvExport() {
  const exporting = ref<string | null>(null)
  const toast = useToast()

  async function download(
    resource: 'transactions' | 'settlements',
    params: Record<string, string | number | undefined> = {},
  ): Promise<void> {
    exporting.value = resource
    try {
      const response = await http.get(`/api/exports/${resource}`, {
        params,
        responseType: 'blob',
      })

      const filename =
        parseFilename(response.headers['content-disposition']) ??
        `kudi-${resource}-${new Date().toISOString().slice(0, 10)}.csv`

      const url = URL.createObjectURL(response.data as Blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      toast.success(`${filename} downloaded.`)
    } catch {
      toast.error(`Could not export ${resource}. Try again.`)
    } finally {
      exporting.value = null
    }
  }

  return { exporting, download }
}

function parseFilename(header: unknown): string | null {
  if (typeof header !== 'string') return null
  return header.match(/filename=("?)([^";]+)\1/)?.[2] ?? null
}
