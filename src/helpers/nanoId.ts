import { createId as cuid } from '@paralleldrive/cuid2';

export const generateId = (): string => {
    return cuid().slice(0, 19)
}