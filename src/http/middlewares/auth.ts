import { FastifyInstance } from "fastify"
import { fastifyPlugin } from "fastify-plugin"

import { UnauthorizedError } from "../routes/_errors/unauthorized-error"
import { auth } from "@/lib/auth"

export const authMiddleware = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook("preHandler", async (request) => {
    request.getCurrentUserId = async () => {
      try {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user?.id) {
          throw new UnauthorizedError("Invalid auth token")
        }

        return session.user.id
      } catch (error) {
        throw new UnauthorizedError("Invalid auth token")
      }
    }
  })
})
