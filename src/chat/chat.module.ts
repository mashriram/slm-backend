import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [SystemModule],
  controllers: [ChatController],
})
export class ChatModule {}
