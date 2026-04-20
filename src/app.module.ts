import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatSession } from './entities/ChatSession.entity';
import { Run } from './entities/Run.entity';
import { AuditLog } from './entities/AuditLog.entity';
import { SystemModule } from './system/system.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'slm-local.db',
      entities: [ChatSession, Run, AuditLog],
      synchronize: true, // auto-sync for rapid development
    }),
    SystemModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
