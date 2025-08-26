import { env } from "./environment"
import { MongoClient, ServerApiVersion } from "mongodb"

let micareDatabaseInstace = null

const mongoClientInstance = new MongoClient(env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

export const CONNECT_DB = async () => {
  await mongoClientInstance.connect()
  micareDatabaseInstace = mongoClientInstance.db(env.DATABASE_NAME)
}

export const GET_DB = () => {
  if (!micareDatabaseInstace) throw new Error("MUST CONNECT DATABASE FIRST")
  return micareDatabaseInstace
}

export const CLOSE_DB = async () => {
  await mongoClientInstance.close()
}