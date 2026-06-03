'use client'

import { useCallback, useState } from 'react'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import type { ConfirmOptions } from '../lib/ui/confirm'

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void
}

/** Page-level confirm hook (renders ConfirmDialog in the page tree). */
export function useConfirm() {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve })
    })
  }, [])

  const close = useCallback((value: boolean) => {
    setPending((current) => {
      current?.resolve(value)
      return null
    })
  }, [])

  const ConfirmDialogElement = (
    <ConfirmDialog
      open={Boolean(pending)}
      title={pending?.title ?? ''}
      message={pending?.message ?? ''}
      confirmLabel={pending?.confirmLabel}
      cancelLabel={pending?.cancelLabel}
      tone={pending?.tone}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  )

  return { confirm, ConfirmDialog: ConfirmDialogElement }
}
