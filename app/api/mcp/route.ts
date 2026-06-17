import { authHandler } from "./server"

export const runtime = "nodejs"
export const maxDuration = 60

export { authHandler as GET, authHandler as POST }
