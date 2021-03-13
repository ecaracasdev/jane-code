const successOutput = (data) => {
  let output = { state: "success", data }
  console.log(JSON.stringify(output))
  process.exit(1)
}

const failureOutput = (err) => {
  console.error(err)

  let output = {
    state: "failure",
    data: {
      message: err.message,
      code: err.code,
      data: err.data
    }
  }
  console.log(err.message)
  console.error(JSON.stringify(output))
  process.exit(0)
}

process.on('unhandledRejection', (reason, p) => {
  console.error(reason, 'Unhandled Rejection at Promise', p)
  failureOutput(reason)
})

process.on('uncaughtException', err => {
  console.error(err, 'Uncaught Exception thrown')
  failureOutput(err)
})

const fs = require('fs')
const path = require('path')
const glob = require('glob')
const lineReader = require('line-reader')
const { isEmpty } = require('lodash')
let file_name

let processParams = {
  temperatura: process.argv[2] || ''
}

const main = async () => {

  let txtFiles = glob.sync( 'BSA_SIN_CORREGIR/*.txt' , {  nocase: true })

  if (!fs.existsSync( 'BSA_CORREGIDOS/'+  processParams.temperatura )) fs.mkdirSync('BSA_CORREGIDOS/'+  processParams.temperatura  )

  for (const txt of txtFiles) {
    file_name = txt.replace('BSA_SIN_CORREGIR/','')
    let txtData = await getTxtData(txt)
    fs.writeFileSync('BSA_CORREGIDOS/'+ processParams.temperatura + '/' + file_name, txtData)
    fs.unlinkSync(txt)
  }

  return ['hola']
}


const getTxtData = async (fileAcreedia) => {
  return new Promise(function(resolve, reject) {
      let letters = /[a-zA-Z]/g
      let resultData = []
      let fullString = ''
      lineReader.eachLine(fileAcreedia, function(line, last) {
        if(!letters.test(line) && !isEmpty(line) && !line.includes('"')) {
          line = line.replace(/,/g,'.')
          line = line.replace('.0.',' ')
          line = line 

          if (line.length < 30) fullString += line + '\n'

          if (last ) {
            resolve(fullString)
            return false
          } 
        }
          
      })
  })
}

main().then(successOutput).catch(failureOutput)

