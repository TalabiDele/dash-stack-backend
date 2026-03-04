import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('dashboard')
@ApiBearerAuth() // Tells Swagger this needs the JWT token
@UseGuards(AuthGuard('jwt')) // Protects ALL dashboard routes
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get KPI summary cards with percentage changes' })
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('sales-chart')
  @ApiOperation({ summary: 'Get sales chart data filtered by month' })
  @ApiQuery({
    name: 'month',
    required: false,
    example: '2026-03',
    description: 'Format: YYYY-MM',
  })
  getSalesChart(@Query('month') month?: string) {
    return this.dashboardService.getSalesChart(month);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get list of orders filtered by month' })
  @ApiQuery({
    name: 'month',
    required: false,
    example: '2026-03',
    description: 'Format: YYYY-MM',
  })
  getOrdersList(@Query('month') month?: string) {
    return this.dashboardService.getOrdersList(month);
  }
}
