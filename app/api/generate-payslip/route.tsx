import { NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { PayslipDocument } from '@/components/pdf/PayslipDocument'
import { PayslipData } from '@/types/payslip'
import { convertGifToPngForPdf } from '@/lib/image-utils'

// Helper function to render PDF outside try/catch
const renderPdfStream = async (data: PayslipData) => {
  // Convert GIF logo to PNG if needed
  let processedData = data
  if (data.companyLogoUrl) {
    const convertedLogoUrl = await convertGifToPngForPdf(data.companyLogoUrl)
    processedData = {
      ...data,
      companyLogoUrl: convertedLogoUrl,
    }
  }

  // Render the PDF component to a Node stream
  return await renderToStream(<PayslipDocument data={processedData} />)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data: PayslipData = body.data

    const stream = await renderPdfStream(data)

    // Convert stream to standard Web Response
    return new NextResponse(stream as ReadableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="payslip-${data.employeeName.replace(/\s+/g, '-')}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

