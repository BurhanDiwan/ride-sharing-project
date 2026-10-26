const generateCSV = (data) => {
  if (!data || data.length === 0) return ''

  let headers = Object.keys(data[0])
  let csvRows = []

  csvRows.push(headers.join(','))

  for (let i = 0; i < data.length; i++) {
    let row = data[i]
    let values = headers.map(header => {
      let val = row[header]
      if (val === null || val === undefined) return ''
      let str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    })
    csvRows.push(values.join(","))
  }

  return csvRows.join('\n')
}

module.exports = { generateCSV }
