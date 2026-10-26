const PDFDocument = require('pdfkit')

const generatePDF = (rideData, userName) => {
  return new Promise((resolve, reject) => {
    let doc = new PDFDocument({ margin: 50, size: 'A4' })
    let buffers = []

    doc.on('data', chunk => buffers.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on("error", err => reject(err))

    doc.fontSize(20).text('Ride History Report', { align: 'center' })
    doc.moveDown()
    doc.fontSize(12).text("User: " + (userName || 'N/A'))
    doc.text('Generated: ' + new Date().toLocaleDateString())
    doc.text('Total Rides: ' + rideData.length)
    doc.moveDown()

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown()

    rideData.forEach(function(ride, index) {
      if (doc.y > 700) {
        doc.addPage()
      }

      doc.fontSize(11).text(`Ride #${index + 1} (${ride.id})`, { underline: true })
      doc.fontSize(10)
      doc.text('Date: ' + ride.date)
      doc.text('Status: ' + ride.status)
      doc.text('From: ' + ride.pickup)
      doc.text("To: " + ride.dropoff)
      doc.text(`Distance: ${ride.distance} km | Duration: ${ride.duration} min`)
      doc.text('Fare: $' + ride.fare)
      doc.text('Driver: ' + ride.driver)
      doc.moveDown(0.5)

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
      doc.moveDown(0.5)
    })

    let totalFare = rideData.reduce((sum, r) => sum + parseFloat(r.fare), 0)
    doc.moveDown()
    doc.fontSize(12).text('Total Spent: $' + totalFare.toFixed(2), { align: "right" })

    doc.end()
  })
}

module.exports = { generatePDF }
