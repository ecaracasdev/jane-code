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
const exceljs = require('exceljs')
const { isEmpty } = require('lodash')
let file_name

let processParams = {
  temperatura: process.argv[2] ? '/'+ process.argv[2] : ''
}

const main = async () => {
  
  let excelPath = 'EXCEL_DPT' +  processParams.temperatura

  let dptFiles = glob.sync( 'ARCHIVOS_DPT/*.DPT' , {  nocase: true })
  if (!fs.existsSync(excelPath)) fs.mkdirSync(excelPath)
  
  for (const dptFile of dptFiles) {
    file_name = dptFile.replace('ARCHIVOS_DPT/','')
    let dptData = await getDptData(dptFile)
    let wbDPT = await getWorkBookExcelJS('TEMPLATES/longitud_de_onda_vs_intensidad_template.xlsx')
    let wsDPT = getWorksheetByIndex(wbDPT, 0)
    wsDPT = procesarData(wsDPT, dptData)
    await wbDPT.xlsx.writeFile( excelPath+ '/' + file_name + '.xlsx')

    fs.unlinkSync(dptFile)
  }

  process.exit()
}


const getDptData = async (fileAcreedia) => {
  return new Promise(function(resolve, reject) {
      let resultData = []
      lineReader.eachLine(fileAcreedia, function(line, last) {
        line = line.split(',')
        resultData.push({
          longitudOnda:line[0],
          intensidadFluorecencia:line[1]
        })
        if (last ) {
          resolve(resultData)
          return false
        } 
      })
  })
}

const getWorkBookExcelJS = (fileName) => {
  return new Promise(function (resolve, reject) {
    var workbook = new exceljs.Workbook()
    workbook.xlsx.readFile(fileName)
      .then(function () {
        resolve(workbook)
      })
      .catch(function (err) {
        console.log("error")
        console.log(err)
        reject(err)
      })
  })
}

const getWorksheetByIndex = (workbook, index) => {
  let sheets = []
  workbook.eachSheet(function (worksheet, sheetId) {
    sheets.push(worksheet)
  })
  return sheets[index]
}

const procesarData = (ws, data) => {
  const ROW_INIT = 2
  let rowCounter = ROW_INIT

  for (dato of data) {
    //longitud de onda
    let cellLongitudOnda = ws.getCell('A' + rowCounter)
    cellLongitudOnda.value = dato.longitudOnda
    //intensidad de fluorecencia
    let cellIntensidadFluorecencia = ws.getCell('B' + rowCounter)
    cellIntensidadFluorecencia.value = dato.intensidadFluorecencia

    rowCounter++
  }

  return ws
}


main().then(successOutput).catch(failureOutput)