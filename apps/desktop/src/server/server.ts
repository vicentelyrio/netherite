import { runServer } from '@netherite/api'

window.exports = {}

function StartServer() {
  console.log('Starting server')

  runServer().then(() => console.log('Server started'))
}

StartServer()
console.log('Starting server')
