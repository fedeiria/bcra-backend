import { Test, TestingModule } from '@nestjs/testing';
import { MonetaryController } from './monetary.controller';

describe('MonetaryController', () => {
  let controller: MonetaryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonetaryController],
    }).compile();

    controller = module.get<MonetaryController>(MonetaryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
