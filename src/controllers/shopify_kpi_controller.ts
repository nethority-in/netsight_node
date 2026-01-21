import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export class ShopifyKpiController {
  static async getTotalSalesKpi(req: Request, res: Response): Promise<void> {
    try {
      const shop = req.query.shop as string;
      const dateFrom = req.query.date_from as string | undefined;
      const dateTo = req.query.date_to as string | undefined;

      if (!shop) {
        res.status(400).json({ error: 'Shop parameter is required' });
        return;
      }

      const merchant = await prisma.merchant.findFirst({
        where: { shop }
      });

      if (!merchant) {
        res.status(404).json({ error: 'Merchant not found' });
        return;
      }

      // Build base query conditions
      const baseConditions: any = {
        merchant_id: merchant.id,
        financial_status: 'paid'
      };

      // Determine current period
      let currentPeriodStart: Date;
      let currentPeriodEnd: Date;

      if (dateFrom || dateTo) {
        currentPeriodStart = dateFrom 
          ? new Date(new Date(dateFrom).setHours(0, 0, 0, 0))
          : new Date(new Date().setHours(0, 0, 0, 0));
        currentPeriodEnd = dateTo
          ? new Date(new Date(dateTo).setHours(23, 59, 59, 999))
          : new Date(new Date().setHours(23, 59, 59, 999));
      } else {
        const now = new Date();
        currentPeriodStart = new Date(now.setHours(0, 0, 0, 0));
        currentPeriodEnd = new Date(now.setHours(23, 59, 59, 999));
      }

      // Apply date filters to base conditions
      if (dateFrom) {
        baseConditions.created_at_shopify = {
          ...baseConditions.created_at_shopify,
          gte: new Date(dateFrom)
        };
      }
      if (dateTo) {
        baseConditions.created_at_shopify = {
          ...baseConditions.created_at_shopify,
          lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999))
        };
      }

      // Calculate current period sales
      const currentOrders = await prisma.order.findMany({
        where: {
          ...baseConditions,
          created_at_shopify: {
            gte: currentPeriodStart,
            lte: currentPeriodEnd
          }
        },
        select: {
          total_price: true
        }
      });

      const currentSales = currentOrders.reduce((sum: number, order: { total_price: any }) => {
        return sum + Number(order.total_price);
      }, 0);

      // Calculate previous period (same length immediately before current period)
      const daysDiff = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - daysDiff);
      const previousPeriodEnd = new Date(currentPeriodEnd);
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - daysDiff);

      const previousOrders = await prisma.order.findMany({
        where: {
          ...baseConditions,
          created_at_shopify: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd
          }
        },
        select: {
          total_price: true
        }
      });

      const previousSales = previousOrders.reduce((sum: number, order: { total_price: any }) => {
        return sum + Number(order.total_price);
      }, 0);

      // Calculate comparison
      const comparison = currentSales - previousSales;
      const comparisonText = `${Math.abs(comparison).toFixed(2)} Vs Same Week Last Week`;
      const isPositive = comparison >= 0;

      // Get daily sales data for the chart
      const dailySales: Array<{ day: string; sales: number }> = [];
      const dailyPrevious: Array<{ day: string; sales: number }> = [];

      const cursor = new Date(currentPeriodStart);
      const prevCursor = new Date(previousPeriodStart);

      while (cursor <= currentPeriodEnd) {
        const dayStart = new Date(cursor);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(cursor);
        dayEnd.setHours(23, 59, 59, 999);

        const prevDayStart = new Date(prevCursor);
        prevDayStart.setHours(0, 0, 0, 0);
        const prevDayEnd = new Date(prevCursor);
        prevDayEnd.setHours(23, 59, 59, 999);

        const dayOrders = await prisma.order.findMany({
          where: {
            ...baseConditions,
            created_at_shopify: {
              gte: dayStart,
              lte: dayEnd
            }
          },
          select: {
            total_price: true
          }
        });

        const prevDayOrders = await prisma.order.findMany({
          where: {
            ...baseConditions,
            created_at_shopify: {
              gte: prevDayStart,
              lte: prevDayEnd
            }
          },
          select: {
            total_price: true
          }
        });

        const daySales = dayOrders.reduce((sum: number, order: { total_price: any }) => sum + Number(order.total_price), 0);
        const prevDaySales = prevDayOrders.reduce((sum: number, order: { total_price: any }) => sum + Number(order.total_price), 0);

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dailySales.push({
          day: dayNames[cursor.getDay()],
          sales: parseFloat(daySales.toFixed(2))
        });

        dailyPrevious.push({
          day: dayNames[prevCursor.getDay()],
          sales: parseFloat(prevDaySales.toFixed(2))
        });

        cursor.setDate(cursor.getDate() + 1);
        prevCursor.setDate(prevCursor.getDate() + 1);
      }

      res.json({
        total_sales: currentSales.toFixed(2),
        comparison: {
          value: Math.abs(comparison),
          text: comparisonText,
          is_positive: isPositive,
          percentage: previousSales > 0 ? parseFloat(((comparison / previousSales) * 100).toFixed(1)) : 0
        },
        daily_data: {
          current_week: dailySales,
          previous_week: dailyPrevious
        },
        period: {
          from: currentPeriodStart.toISOString().split('T')[0],
          to: currentPeriodEnd.toISOString().split('T')[0]
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in getTotalSalesKpi:', error);
      res.status(500).json({
        error: errorMessage
      });
    }
  }

  static async getTotalOrdersKpi(req: Request, res: Response): Promise<void> {
    try {
      const shop = req.query.shop as string;
      const dateFrom = req.query.date_from as string | undefined;
      const dateTo = req.query.date_to as string | undefined;

      if (!shop) {
        res.status(400).json({ error: 'Shop parameter is required' });
        return;
      }

      const merchant = await prisma.merchant.findFirst({
        where: { shop }
      });

      if (!merchant) {
        res.status(404).json({ error: 'Merchant not found' });
        return;
      }

      // Build base query conditions
      const baseConditions: any = {
        merchant_id: merchant.id
      };

      // Determine current period
      let currentPeriodStart: Date;
      let currentPeriodEnd: Date;

      if (dateFrom || dateTo) {
        currentPeriodStart = dateFrom 
          ? new Date(new Date(dateFrom).setHours(0, 0, 0, 0))
          : new Date(new Date().setHours(0, 0, 0, 0));
        currentPeriodEnd = dateTo
          ? new Date(new Date(dateTo).setHours(23, 59, 59, 999))
          : new Date(new Date().setHours(23, 59, 59, 999));
      } else {
        const now = new Date();
        currentPeriodStart = new Date(now.setHours(0, 0, 0, 0));
        currentPeriodEnd = new Date(now.setHours(23, 59, 59, 999));
      }
      // Apply date filters to base conditions
      if (dateFrom) {
        baseConditions.created_at_shopify = {
          ...baseConditions.created_at_shopify,
          gte: new Date(dateFrom)
        };
      }
      if (dateTo) {
        baseConditions.created_at_shopify = {
          ...baseConditions.created_at_shopify,
          lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999))
        };
      }

      // Calculate current period orders count
      const currentOrdersCount = await prisma.order.count({
        where: {
          ...baseConditions,
          created_at_shopify: {
            gte: currentPeriodStart,
            lte: currentPeriodEnd
          }
        }
      });

      // Calculate previous period (same length immediately before current period)
      const daysDiff = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - daysDiff);
      const previousPeriodEnd = new Date(currentPeriodEnd);
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - daysDiff);

      const previousOrdersCount = await prisma.order.count({
        where: {
          ...baseConditions,
          created_at_shopify: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd
          }
        }
      });

      // Calculate comparison
      const comparison = currentOrdersCount - previousOrdersCount;
      const comparisonText = `${Math.abs(comparison)} Vs Same Week Last Week`;
      const isPositive = comparison >= 0;

      // Get daily orders data for the chart
      const dailyOrders: Array<{ day: string; orders: number }> = [];
      const dailyPrevious: Array<{ day: string; orders: number }> = [];

      const cursor = new Date(currentPeriodStart);
      const prevCursor = new Date(previousPeriodStart);

      while (cursor <= currentPeriodEnd) {
        const dayStart = new Date(cursor);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(cursor);
        dayEnd.setHours(23, 59, 59, 999);

        const prevDayStart = new Date(prevCursor);
        prevDayStart.setHours(0, 0, 0, 0);
        const prevDayEnd = new Date(prevCursor);
        prevDayEnd.setHours(23, 59, 59, 999);

        const dayOrdersCount = await prisma.order.count({
          where: {
            ...baseConditions,
            created_at_shopify: {
              gte: dayStart,
              lte: dayEnd
            }
          }
        });

        const prevDayOrdersCount = await prisma.order.count({
          where: {
            ...baseConditions,
            created_at_shopify: {
              gte: prevDayStart,
              lte: prevDayEnd
            }
          }
        });

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dailyOrders.push({
          day: dayNames[cursor.getDay()],
          orders: dayOrdersCount
        });

        dailyPrevious.push({
          day: dayNames[prevCursor.getDay()],
          orders: prevDayOrdersCount
        });

        cursor.setDate(cursor.getDate() + 1);
        prevCursor.setDate(prevCursor.getDate() + 1);
      }

      res.json({
        total_orders: currentOrdersCount,
        comparison: {
          value: Math.abs(comparison),
          text: comparisonText,
          is_positive: isPositive,
          percentage: previousOrdersCount > 0 ? parseFloat(((comparison / previousOrdersCount) * 100).toFixed(1)) : 0
        },
        daily_data: {
          current_week: dailyOrders,
          previous_week: dailyPrevious
        },
        period: {
          from: currentPeriodStart.toISOString().split('T')[0],
          to: currentPeriodEnd.toISOString().split('T')[0]
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in getTotalOrdersKpi:', error);
      res.status(500).json({
        error: errorMessage
      });
    }
  }

  static async getNetSalesKpi(req: Request, res: Response): Promise<void> {
    try {
      const shop = req.query.shop as string;
      const dateFrom = req.query.date_from as string | undefined;
      const dateTo = req.query.date_to as string | undefined;

      if (!shop) {
        res.status(400).json({ error: 'Shop parameter is required' });
        return;
      }

      const merchant = await prisma.merchant.findFirst({
        where: { shop }
      });

      if (!merchant) {
        res.status(404).json({ error: 'Merchant not found' });
        return;
      }

        //  Resolve current period
      const now = new Date();

      const currentPeriodStart = dateFrom
        ? new Date(new Date(dateFrom).setHours(0, 0, 0, 0))
        : new Date(new Date(now).setHours(0, 0, 0, 0));

      const currentPeriodEnd = dateTo
        ? new Date(new Date(dateTo).setHours(23, 59, 59, 999))
        : new Date(new Date(now).setHours(23, 59, 59, 999));

        //  Detect range type
      const diffDays =
        Math.ceil(
          (currentPeriodEnd.getTime() - currentPeriodStart.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;

      let aggregation: 'day' | 'week' | 'month' = 'day';

      if (diffDays > 60) aggregation = 'month';
      else if (diffDays > 14) aggregation = 'week';

        //  Previous period
      const previousPeriodStart = new Date(currentPeriodStart);
      const previousPeriodEnd = new Date(currentPeriodEnd);

      previousPeriodStart.setDate(previousPeriodStart.getDate() - diffDays);
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - diffDays);

        //  Base where clause
      const baseWhere = {
        merchant_id: merchant.id,
        financial_status: 'paid'
      };

        //  Totals (current / previous)
      const [currentAgg, previousAgg] = await Promise.all([
        prisma.order.aggregate({
          where: {
            ...baseWhere,
            created_at_shopify: {
              gte: currentPeriodStart,
              lte: currentPeriodEnd
            }
          },
          _sum: { total_price: true }
        }),
        prisma.order.aggregate({
          where: {
            ...baseWhere,
            created_at_shopify: {
              gte: previousPeriodStart,
              lte: previousPeriodEnd
            }
          },
          _sum: { total_price: true }
        })
      ]);

      const currentTotal = Number(currentAgg._sum.total_price ?? 0);
      const previousTotal = Number(previousAgg._sum.total_price ?? 0);
      const comparison = currentTotal - previousTotal;

        //  Bar chart data (grouped)
      let dateFormat: string;
      if (aggregation === 'month') {
        dateFormat = '%Y-%m';
      } else if (aggregation === 'week') {
        dateFormat = '%Y-%u'; // Year-Week number
      } else {
        dateFormat = '%Y-%m-%d';
      }

      const barChartCurrent = await prisma.$queryRawUnsafe<
        Array<{ label: string; value: number }>
      >(`
        SELECT 
          DATE_FORMAT(created_at_shopify, '${dateFormat}') as label,
          CAST(SUM(total_price) AS DECIMAL(15,4)) as value
        FROM orders
        WHERE merchant_id = ${merchant.id}
          AND financial_status = 'paid'
          AND created_at_shopify BETWEEN '${currentPeriodStart.toISOString()}'
          AND '${currentPeriodEnd.toISOString()}'
        GROUP BY label
        ORDER BY label
      `);

      const barChartPrevious = await prisma.$queryRawUnsafe<
        Array<{ label: string; value: number }>
      >(`
        SELECT 
          DATE_FORMAT(created_at_shopify, '${dateFormat}') as label,
          CAST(SUM(total_price) AS DECIMAL(15,4)) as value
        FROM orders
        WHERE merchant_id = ${merchant.id}
          AND financial_status = 'paid'
          AND created_at_shopify BETWEEN '${previousPeriodStart.toISOString()}'
          AND '${previousPeriodEnd.toISOString()}'
        GROUP BY label
        ORDER BY label
      `);

        //  Response data
      res.json({
        total_sales: currentTotal.toFixed(2),
        comparison: {
          value: Math.abs(comparison),
          text: `${Math.abs(comparison).toFixed(2)} vs previous period`,
          is_positive: comparison >= 0,
          percentage:
            previousTotal > 0
              ? Number(((comparison / previousTotal) * 100).toFixed(1))
              : 0
        },
        daily_data: {
          current_week: barChartCurrent,
          previous_week: barChartPrevious
        },
        period: {
          from: currentPeriodStart.toISOString().split('T')[0],
          to: currentPeriodEnd.toISOString().split('T')[0],
          aggregation
        },
        source: 'database'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in getNetSalesKpi:', error);
      res.status(500).json({ 
        error: errorMessage 
      });
    }
  }
  
  static async getGrossSalesKpi(req: Request, res: Response): Promise<void> {
    try {
      const shop = req.query.shop as string;
      const dateFrom = req.query.date_from as string | undefined;
      const dateTo = req.query.date_to as string | undefined;

      if (!shop) {
        res.status(400).json({ error: 'Shop parameter is required' });
        return;
      }

      const merchant = await prisma.merchant.findFirst({
        where: { shop }
      });

      if (!merchant) {
        res.status(404).json({ error: 'Merchant not found' });
        return;
      }

        //  Resolve current period
      const now = new Date();

      const currentPeriodStart = dateFrom
        ? new Date(new Date(dateFrom).setHours(0, 0, 0, 0))
        : new Date(new Date(now).setHours(0, 0, 0, 0));

      const currentPeriodEnd = dateTo
        ? new Date(new Date(dateTo).setHours(23, 59, 59, 999))
        : new Date(new Date(now).setHours(23, 59, 59, 999));

        //  Detect range & aggregation
      const diffDays =
        Math.ceil(
          (currentPeriodEnd.getTime() - currentPeriodStart.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;

      let aggregation: 'day' | 'week' | 'month' = 'day';
      let rangeType: 'day' | 'week' | 'month' = 'day';

      if (diffDays > 60) {
        aggregation = 'month';
        rangeType = 'month';
      } else if (diffDays > 14) {
        aggregation = 'week';
        rangeType = 'week';
      }

        //  Previous period
      const previousPeriodStart = new Date(currentPeriodStart);
      const previousPeriodEnd = new Date(currentPeriodEnd);

      previousPeriodStart.setDate(previousPeriodStart.getDate() - diffDays);
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - diffDays);

        //  Base where clause
      const baseWhere = {
        merchant_id: merchant.id,
        financial_status: 'paid'
      };

        //  Gross sales totals
      const [currentAgg, previousAgg] = await Promise.all([
        prisma.order.aggregate({
          where: {
            ...baseWhere,
            created_at_shopify: {
              gte: currentPeriodStart,
              lte: currentPeriodEnd
            }
          },
          _sum: {
            subtotal_price: true // GROSS SALES
          }
        }),
        prisma.order.aggregate({
          where: {
            ...baseWhere,
            created_at_shopify: {
              gte: previousPeriodStart,
              lte: previousPeriodEnd
            }
          },
          _sum: {
            subtotal_price: true
          }
        })
      ]);

      const currentTotal = Number(currentAgg._sum.subtotal_price ?? 0);
      const previousTotal = Number(previousAgg._sum.subtotal_price ?? 0);
      const comparison = currentTotal - previousTotal;

        //  Bar chart aggregation
   
      const dateFormat =
        aggregation === 'month'
          ? '%Y-%m'
          : aggregation === 'week'
          ? '%Y-%u'
          : '%Y-%m-%d';

      const barChartCurrent = await prisma.$queryRawUnsafe<
        { label: string; value: number }[]
      >(`
        SELECT
          DATE_FORMAT(created_at_shopify, '${dateFormat}') as label,
          CAST(SUM(subtotal_price) AS DECIMAL(15,4)) as value
        FROM orders
        WHERE merchant_id = ${merchant.id}
          AND financial_status = 'paid'
          AND created_at_shopify BETWEEN '${currentPeriodStart.toISOString()}'
          AND '${currentPeriodEnd.toISOString()}'
        GROUP BY label
        ORDER BY label
      `);

      const barChartPrevious = await prisma.$queryRawUnsafe<
        { label: string; value: number }[]
      >(`
        SELECT
          DATE_FORMAT(created_at_shopify, '${dateFormat}') as label,
          CAST(SUM(subtotal_price) AS DECIMAL(15,4)) as value
        FROM orders
        WHERE merchant_id = ${merchant.id}
          AND financial_status = 'paid'
          AND created_at_shopify BETWEEN '${previousPeriodStart.toISOString()}'
          AND '${previousPeriodEnd.toISOString()}'
        GROUP BY label
        ORDER BY label
      `);

        //  Response
      res.json({
        total_gross_sales: currentTotal.toFixed(2),
        comparison: {
          value: Math.abs(comparison),
          text: `${Math.abs(comparison).toFixed(2)} Vs previous period`,
          is_positive: comparison >= 0,
          percentage:
            previousTotal > 0
              ? Number(((comparison / previousTotal) * 100).toFixed(1))
              : 0
        },
        daily_data: {
          current_week: barChartCurrent,
          previous_week: barChartPrevious
        },
        period: {
          from: currentPeriodStart.toISOString().split('T')[0],
          to: currentPeriodEnd.toISOString().split('T')[0],
          aggregation,
          range_type: rangeType
        },
        source: 'database'
      });
    } catch (error) {
      console.error('Error in getGrossSalesKpi:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
