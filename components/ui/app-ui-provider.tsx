'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ConfirmDialog } from './confirm-dialog'
import { PromptDialog } from './prompt-dialog'
import { ToastProvider, useToast } from './toast-provider'
import {
  registerConfirmHandler,
  type ConfirmOptions,
} from '../../lib/ui/confirm'
import { registerPromptHandler, type PromptOptions } from '../../lib/ui/prompt'
import { registerToastApi } from '../../lib/ui/toast'

type PendingConfirm = ConfirmOptions & { resolve: (value: boolean) => void }

type PendingPrompt = PromptOptions & { resolve: (value: string | null) => void }

function AppUiBridge({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)
  const [pendingPrompt, setPendingPrompt] = useState<PendingPrompt | null>(null)

  useEffect(() => {
    registerToastApi(toast)
  }, [toast])

  useEffect(() => {
    registerConfirmHandler((options) => {
      return new Promise<boolean>((resolve) => {
        setPendingConfirm({ ...options, resolve })
      })
    })
    registerPromptHandler((options) => {
      return new Promise<string | null>((resolve) => {
        setPendingPrompt({ ...options, resolve })
      })
    })
  }, [])

  const closeConfirm = useCallback((value: boolean) => {
    setPendingConfirm((current) => {
      current?.resolve(value)
      return null
    })
  }, [])

  const closePrompt = useCallback((value: string | null) => {
    setPendingPrompt((current) => {
      current?.resolve(value)
      return null
    })
  }, [])

  return (
    <>
      {children}
      <ConfirmDialog
        open={Boolean(pendingConfirm)}
        title={pendingConfirm?.title ?? ''}
        message={pendingConfirm?.message ?? ''}
        confirmLabel={pendingConfirm?.confirmLabel}
        cancelLabel={pendingConfirm?.cancelLabel}
        tone={pendingConfirm?.tone}
        onConfirm={() => closeConfirm(true)}
        onCancel={() => closeConfirm(false)}
      />
      <PromptDialog
        open={Boolean(pendingPrompt)}
        title={pendingPrompt?.title ?? ''}
        message={pendingPrompt?.message ?? ''}
        defaultValue={pendingPrompt?.defaultValue}
        placeholder={pendingPrompt?.placeholder}
        confirmLabel={pendingPrompt?.confirmLabel}
        cancelLabel={pendingPrompt?.cancelLabel}
        requiredValue={pendingPrompt?.requiredValue}
        inputLabel={pendingPrompt?.inputLabel}
        tone={pendingPrompt?.tone}
        onConfirm={(value) => closePrompt(value)}
        onCancel={() => closePrompt(null)}
      />
    </>
  )
}

export function AppUiProvider({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AppUiBridge>{children}</AppUiBridge>
    </ToastProvider>
  )
}
