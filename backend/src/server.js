import express from 'express'
import { APIs_V1 } from './routes/v1'
import { env } from './config/environment'
import exitHook from 'async-exit-hook'
import { CLOSE_DB, CONNECT_DB } from './config/mongodb'
import { corsOptions } from './config/cors'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorHandlingMiddleware } from '~/middlewares/exampleMiddleware'

const START_SERVER = () => {
  const app = express ()

  app.use((req,res,next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  app.use(express.json())

  app.use(cors(corsOptions))

  app.use(cookieParser())

  app.use('/V1', APIs_V1)

  //tranh loi 500
  app.use(errorHandlingMiddleware)


  if (env.BUILD_MODE === 'production') {
    app.listen(process.env.PORT, () => {
      console.log(`3. Production: Hello ${env.AUTHOR}, I am running at Port: ${ process.env.PORT }/`)
    })
  }
  else
  {
    app.listen(env.LOCAL_DEV_APP_PORT, env.LOCAL_DEV_APP_HOST, () => {
      console.log(`3. LocalDev: Hello ${env.AUTHOR}, I am running at http://${ env.LOCAL_DEV_APP_HOST }:${ env.LOCAL_DEV_APP_PORT }/`)
    })
  }

  exitHook(() => {
    console.log('4. Disconnecting from MongoDB Cloud Atlas')
    CLOSE_DB()
    console.log('5. Disconnecting from MongoDB Cloud Atlas')
  })
}


(async () => {
  try {
    console.log("1. Connect to MongoDB Atlas")
    await CONNECT_DB()
    console.log("2. Connect to MongoDB Atlas")
    START_SERVER()
  } catch (error) {
    console.error(error)
    process.exit(0)
  }
})()