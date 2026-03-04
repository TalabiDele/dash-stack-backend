import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // Helper function to calculate percentage change
  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }

  // Helper to get date ranges
  private getMonthDateRanges(targetMonth?: string) {
    const now = targetMonth ? new Date(targetMonth) : new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    );

    const startOfPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    return {
      startOfCurrentMonth,

      endOfCurrentMonth,

      startOfPreviousMonth,
      endOfPreviousMonth,
    };
  }

  // 1. KPI SUMMARY CARDS
  async getSummary() {
    const { startOfCurrentMonth, startOfPreviousMonth, endOfPreviousMonth } =
      this.getMonthDateRanges();
    // Get Current Month Stats
    const currentUsers = await this.prisma.user.count({
      where: {
        createdAt: { gte: startOfCurrentMonth },
      },
    });
    const currentOrders = await this.prisma.order.count({
      where: { createdAt: { gte: startOfCurrentMonth } },
    });
    const currentPending = await this.prisma.order.count({
      where: {
        status: 'PENDING',
        createdAt: { gte: startOfCurrentMonth },
      },
    });

    const currentSalesAggr = await this.prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'COMPLETED', createdAt: { gte: startOfCurrentMonth } },
    });
    const currentSales = currentSalesAggr._sum.totalAmount || 0;

    // Get Previous Month Stats

    const prevUsers = await this.prisma.user.count({
      where: {
        createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth },
      },
    });
    const prevOrders = await this.prisma.order.count({
      where: {
        createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth },
      },
    });
    const prevPending = await this.prisma.order.count({
      where: {
        status: 'PENDING',
        createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth },
      },
    });
    const prevSalesAggr = await this.prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth },
      },
    });
    const prevSales = prevSalesAggr._sum.totalAmount || 0;

    return {
      users: {
        total: currentUsers,
        percentageChange: this.calculatePercentageChange(
          currentUsers,
          prevUsers,
        ),
      },
      orders: {
        total: currentOrders,
        percentageChange: this.calculatePercentageChange(
          currentOrders,

          prevOrders,
        ),
      },
      sales: {
        total: currentSales,
        percentageChange: this.calculatePercentageChange(
          currentSales,
          prevSales,
        ),
      },
      pending: {
        total: currentPending,
        percentageChange: this.calculatePercentageChange(
          currentPending,
          prevPending,
        ),
      },
    };
  }

  // 2. CHART DATA
  async getSalesChart(month?: string) {
    const { startOfCurrentMonth, endOfCurrentMonth } =
      this.getMonthDateRanges(month);

    // Group sales by day/item (simplified for demonstration)
    const orders = await this.prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
      },
      select: { totalAmount: true, createdAt: true },
    });

    // Note: You requested Percentage on Y and Amount on X.
    // We map it exactly to x/y keys so the frontend can plot it however it needs.
    const totalMonthSales = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    return orders.map((order) => ({
      x: order.totalAmount, // Sales Amount on X-axis
      y:
        totalMonthSales > 0
          ? Number(((order.totalAmount / totalMonthSales) * 100).toFixed(2))
          : 0, // Percentage on Y-axis
      date: order.createdAt, // Kept for reference
    }));
  }

  // 3. RECENT ORDERS TABLE
  async getOrdersList(month?: string) {
    const { startOfCurrentMonth, endOfCurrentMonth } =
      this.getMonthDateRanges(month);

    return this.prisma.order.findMany({
      where: {
        createdAt: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
      },
      include: {
        product: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Pagination limit
    });
  }
}
