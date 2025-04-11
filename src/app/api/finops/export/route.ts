import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date range based on timeRange parameter
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Fetch data for the report
    const costs = await prisma.cost.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const utilization = await prisma.resourceUtilization.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const chargeback = await prisma.chargeback.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        department: true,
      },
    });

    if (format === 'csv') {
      // Generate CSV content
      const csvRows = [
        ['Date', 'Cost', 'Optimized Cost', 'Savings', 'Utilization', 'Department', 'Chargeback'],
        ...costs.map(cost => {
          const util = utilization.find(u => u.date.getTime() === cost.date.getTime());
          const charge = chargeback.find(c => c.date.getTime() === cost.date.getTime());
          return [
            format(cost.date, 'yyyy-MM-dd'),
            cost.amount.toFixed(2),
            (cost.optimizedAmount || 0).toFixed(2),
            ((cost.amount - (cost.optimizedAmount || 0))).toFixed(2),
            (util?.percentage || 0).toFixed(2),
            charge?.department.name || '',
            (charge?.amount || 0).toFixed(2),
          ];
        }),
      ];

      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=finops-report.csv',
        },
      });
    } else {
      // Generate PDF content
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const lineHeight = 20;
      let y = height - 50;

      // Add title
      page.drawText('FinOps Report', {
        x: 50,
        y,
        size: 24,
        font,
      });
      y -= lineHeight * 2;

      // Add date range
      page.drawText(`Date Range: ${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`, {
        x: 50,
        y,
        size: fontSize,
        font,
      });
      y -= lineHeight * 2;

      // Add summary
      const totalCost = costs.reduce((sum, cost) => sum + cost.amount, 0);
      const totalSavings = costs.reduce((sum, cost) => sum + (cost.optimizedAmount || 0), 0);
      const averageUtilization = utilization.reduce((sum, util) => sum + util.percentage, 0) / utilization.length;

      page.drawText('Summary:', {
        x: 50,
        y,
        size: fontSize,
        font,
      });
      y -= lineHeight;

      page.drawText(`Total Cost: $${totalCost.toFixed(2)}`, {
        x: 50,
        y,
        size: fontSize,
        font,
      });
      y -= lineHeight;

      page.drawText(`Total Savings: $${totalSavings.toFixed(2)}`, {
        x: 50,
        y,
        size: fontSize,
        font,
      });
      y -= lineHeight;

      page.drawText(`Average Utilization: ${averageUtilization.toFixed(2)}%`, {
        x: 50,
        y,
        size: fontSize,
        font,
      });
      y -= lineHeight * 2;

      // Add detailed data
      page.drawText('Detailed Data:', {
        x: 50,
        y,
        size: fontSize,
        font,
      });
      y -= lineHeight;

      costs.forEach(cost => {
        if (y < 50) {
          page = pdfDoc.addPage();
          y = height - 50;
        }

        const util = utilization.find(u => u.date.getTime() === cost.date.getTime());
        const charge = chargeback.find(c => c.date.getTime() === cost.date.getTime());

        page.drawText(`${format(cost.date, 'MMM d, yyyy')}:`, {
          x: 50,
          y,
          size: fontSize,
          font,
        });
        y -= lineHeight;

        page.drawText(`  Cost: $${cost.amount.toFixed(2)}`, {
          x: 50,
          y,
          size: fontSize,
          font,
        });
        y -= lineHeight;

        page.drawText(`  Optimized Cost: $${(cost.optimizedAmount || 0).toFixed(2)}`, {
          x: 50,
          y,
          size: fontSize,
          font,
        });
        y -= lineHeight;

        page.drawText(`  Utilization: ${(util?.percentage || 0).toFixed(2)}%`, {
          x: 50,
          y,
          size: fontSize,
          font,
        });
        y -= lineHeight;

        page.drawText(`  Department: ${charge?.department.name || 'N/A'}`, {
          x: 50,
          y,
          size: fontSize,
          font,
        });
        y -= lineHeight;

        page.drawText(`  Chargeback: $${(charge?.amount || 0).toFixed(2)}`, {
          x: 50,
          y,
          size: fontSize,
          font,
        });
        y -= lineHeight * 2;
      });

      const pdfBytes = await pdfDoc.save();
      return new NextResponse(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename=finops-report.pdf',
        },
      });
    }
  } catch (error) {
    console.error('Error generating FinOps report:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 