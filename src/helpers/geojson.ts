import { Postition } from '../types'

export const createMultiLineString = (coordinates: Postition[][]) => ({
    type: 'MultiLineString' as const,
    coordinates
});