import fastify from "fastify"
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod"
import { errorHandler } from "./error-handler"
import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUI from "@fastify/swagger-ui"
import fastifyJwt from "@fastify/jwt"
import fastifyCors from "@fastify/cors"
import { env } from "@/env"
import { auth } from "@/lib/auth"
import fastifyScalar from "@scalar/fastify-api-reference"
import { getUser } from "./routes/example"

const app = fastify().withTypeProvider<ZodTypeProvider>()

// Configuration
app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)
app.setErrorHandler(errorHandler)

// Documentation
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Auth-Template",
      description: "Auth template routes",
      version: "0.1.0",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  transform: jsonSchemaTransform,
})

app.register(fastifyScalar, {
  routePrefix: "/reference",
})

// Security
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})
app.register(fastifyCors)

// Auth Routes
app.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  async handler(request, reply) {
    try {
      // Construct request URL
      const url = new URL(request.url, `http://${request.headers.host}`)

      // Convert Fastify headers to standard Headers object
      const headers = new Headers()
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, value.toString())
      })
      // Create Fetch API-compatible request
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
      })
      // Process authentication request
      const response = await auth.handler(req)
      // Forward response to client
      reply.status(response.status)
      response.headers.forEach((value, key) => reply.header(key, value))
      reply.send(response.body ? await response.text() : null)
    } catch (error) {
      reply.status(500).send({
        error: "Internal authentication error",
        code: "AUTH_FAILURE",
      })
    }
  },
})

// Routes
app.register(getUser)

// Init
app.listen({ port: env.PORT }).then(() => {
  console.log(">>>>>>>> HTTP Server running")
})
