import { addressInUse } from '../constants'

export const isAddressInUse = (error: unknown): boolean => {
  const text =
    error instanceof Error
      ? `${error.message} ${String((error as { cause?: unknown }).cause)}`
      : String(error)
  const cause = (error as { cause?: { code?: string } }).cause
  return cause?.code === addressInUse || text.includes(addressInUse)
}
