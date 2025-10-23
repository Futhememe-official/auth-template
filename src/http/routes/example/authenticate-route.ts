import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import z from "zod"

import { prisma } from "@/lib/prisma"

import { BadRequestError } from "../_errors/bad-request-error"
import { authMiddleware } from "@/http/middlewares/auth"

export async function getUser(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authMiddleware)
    .get(
      "/example",
      {
        schema: {
          tags: ["auth"],
          summary: "Get authenticated user profile",
          response: {
            200: z.object({
              user: z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.email(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const user = await prisma.user.findUnique({
          select: {
            id: true,
            name: true,
            email: true,
          },
          where: {
            id: userId,
          },
        })

        if (!user) {
          throw new BadRequestError("User not found.")
        }

        return reply.send({ user })
      },
    )
}
