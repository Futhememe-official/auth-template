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
app.register(fastifySwaggerUI, {
  routePrefix: "/docs",
})

// Security
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})
app.register(fastifyCors)

// Routes

// Init
app.listen({ port: env.PORT }).then(() => {
  console.log(">>>>>>>> HTTP Server running")
})
