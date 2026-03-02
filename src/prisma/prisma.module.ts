import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // <--- Add this decorator!
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // <--- Export it
})
export class PrismaModule {}
